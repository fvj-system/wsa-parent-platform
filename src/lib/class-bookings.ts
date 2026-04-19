import type { SupabaseClient } from "@supabase/supabase-js";
import { completeActivity } from "@/lib/activity-completions";
import { calculateClassRegistrationPrice } from "@/lib/class-pricing";
import { getClassSpotsLeft, type ClassBookingRecord, type ClassRecord } from "@/lib/classes";
import { getHouseholdContext } from "@/lib/households";
import { getAppUrl, getStripeClient } from "@/lib/stripe";
import type { StudentRecord } from "@/lib/students";
import type { WaiverRecord } from "@/lib/waivers";

export type ClassCheckoutWaiverInput = {
  emergencyContact: string;
  medicalNotes?: string;
  signatureName: string;
  saveOnFile: boolean;
  accepted: boolean;
};

type LoadedBooking = ClassBookingRecord & {
  registration_group_id?: string;
  group_lead?: boolean;
  attendee_count?: number;
  pricing_mode?: "per_child" | "family";
  waiver_id?: string | null;
};

export async function loadClassForBooking(supabase: SupabaseClient, classId: string) {
  const { data, error } = await supabase
    .from("classes")
    .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at")
    .eq("id", classId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Class not found.");

  return data as ClassRecord;
}

export async function loadStudentsForBooking(supabase: SupabaseClient, userId: string, studentIds: string[]) {
  const household = await getHouseholdContext(supabase, userId);
  const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

  if (!uniqueStudentIds.length) {
    throw new Error("Choose at least one student for this class.");
  }

  const { data, error } = await supabase
    .from("students")
    .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
    .eq("household_id", household.householdId)
    .in("id", uniqueStudentIds);

  if (error) throw new Error(error.message);

  const loadedStudents = (data ?? []) as StudentRecord[];
  if (loadedStudents.length !== uniqueStudentIds.length) {
    throw new Error("One or more selected students could not be loaded.");
  }

  return loadedStudents.sort(
    (left, right) => uniqueStudentIds.indexOf(left.id) - uniqueStudentIds.indexOf(right.id),
  );
}

export async function getLatestReusableWaiver(supabase: SupabaseClient, householdId: string) {
  const { data, error } = await supabase
    .from("waivers")
    .select("id, user_id, household_id, student_id, child_name, emergency_contact, medical_notes, waiver_type, accepted_at, signature_name, signature_data, version, save_on_file")
    .eq("household_id", householdId)
    .eq("save_on_file", true)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as WaiverRecord | null;
}

async function createClassWaiver(input: {
  supabase: SupabaseClient;
  userId: string;
  householdId: string;
  students: StudentRecord[];
  waiver: ClassCheckoutWaiverInput;
}) {
  const signatureName = input.waiver.signatureName.trim();
  const emergencyContact = input.waiver.emergencyContact.trim();

  if (!input.waiver.accepted) {
    throw new Error("Please accept the waiver before continuing.");
  }

  if (!signatureName) {
    throw new Error("Enter the parent signature name for the waiver.");
  }

  if (!emergencyContact) {
    throw new Error("Enter an emergency contact before continuing.");
  }

  const { data, error } = await input.supabase
    .from("waivers")
    .insert({
      user_id: input.userId,
      household_id: input.householdId,
      student_id: input.students.length === 1 ? input.students[0].id : null,
      child_name: input.students.map((student) => student.name).join(", "),
      emergency_contact: emergencyContact,
      medical_notes: input.waiver.medicalNotes?.trim() || null,
      signature_name: signatureName,
      waiver_type: "class_registration",
      accepted_at: new Date().toISOString(),
      version: "class-registration-v1",
      save_on_file: input.waiver.saveOnFile
    })
    .select("id, user_id, household_id, student_id, child_name, emergency_contact, medical_notes, waiver_type, accepted_at, signature_name, signature_data, version, save_on_file")
    .single();

  if (error) throw new Error(error.message);
  return data as WaiverRecord;
}

export async function createClassCheckoutSession(input: {
  supabase: SupabaseClient;
  userId: string;
  userEmail?: string | null;
  classId: string;
  studentIds: string[];
  useSavedWaiverOnFile?: boolean;
  waiver?: ClassCheckoutWaiverInput | null;
}) {
  const household = await getHouseholdContext(input.supabase, input.userId);
  const uniqueStudentIds = Array.from(new Set(input.studentIds.filter(Boolean)));
  const classRow = await loadClassForBooking(input.supabase, input.classId);
  const students = await loadStudentsForBooking(input.supabase, input.userId, uniqueStudentIds);

  if (classRow.status !== "published" && classRow.status !== "scheduled") {
    throw new Error("This class is not currently open for booking.");
  }

  const spotsRemaining = getClassSpotsLeft(classRow);

  if (typeof spotsRemaining === "number" && spotsRemaining <= 0) {
    throw new Error("This class is full.");
  }

  if (typeof spotsRemaining === "number" && spotsRemaining < students.length) {
    throw new Error("There are not enough remaining class spots for all selected students.");
  }

  for (const student of students) {
    if (
      (typeof classRow.age_min === "number" && student.age < classRow.age_min) ||
      (typeof classRow.age_max === "number" && student.age > classRow.age_max)
    ) {
      throw new Error(`${student.name} is outside this class age range.`);
    }
  }

  let waiverId: string | null = null;
  const reusableWaiver = classRow.waiver_required
    ? await getLatestReusableWaiver(input.supabase, household.householdId)
    : null;

  if (classRow.waiver_required) {
    if (input.useSavedWaiverOnFile && reusableWaiver?.id) {
      waiverId = reusableWaiver.id;
    } else if (input.waiver) {
      waiverId = (await createClassWaiver({
        supabase: input.supabase,
        userId: input.userId,
        householdId: household.householdId,
        students,
        waiver: input.waiver
      })).id;
    } else {
      throw new Error("A class waiver is required before registration can continue.");
    }
  }

  const { data: existingRows, error: existingError } = await input.supabase
    .from("class_bookings")
    .select("id, class_id, user_id, household_id, student_id, registration_group_id, group_lead, attendee_count, pricing_mode, waiver_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
    .eq("household_id", household.householdId)
    .eq("class_id", input.classId)
    .in("student_id", uniqueStudentIds)
    .neq("booking_status", "cancelled");

  if (existingError) throw new Error(existingError.message);

  const existingBookings = (existingRows ?? []) as LoadedBooking[];
  const alreadyPaidStudents = existingBookings
    .filter((booking) => booking.payment_status === "paid" || booking.booking_status === "confirmed" || booking.booking_status === "attended")
    .map((booking) => booking.student_id)
    .filter(Boolean) as string[];

  if (alreadyPaidStudents.length) {
    const alreadyPaidNames = students
      .filter((student) => alreadyPaidStudents.includes(student.id))
      .map((student) => student.name);

    throw new Error(`${alreadyPaidNames.join(", ")} ${alreadyPaidNames.length === 1 ? "is" : "are"} already registered for this class.`);
  }

  const pricing = calculateClassRegistrationPrice(students.length);
  const registrationGroupId = crypto.randomUUID();
  const leadStudentId = students[0]?.id ?? null;

  for (const student of students) {
    const existingBooking = existingBookings.find((booking) => booking.student_id === student.id);
    const commonValues = {
      household_id: household.householdId,
      registration_group_id: registrationGroupId,
      group_lead: student.id === leadStudentId,
      attendee_count: students.length,
      pricing_mode: pricing.mode,
      waiver_id: waiverId,
      booking_status: "pending",
      payment_status: "pending",
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: null,
      amount_paid_cents: 0,
      updated_at: new Date().toISOString()
    };

    if (existingBooking) {
      const { error } = await input.supabase
        .from("class_bookings")
        .update(commonValues)
        .eq("id", existingBooking.id)
        .eq("household_id", household.householdId);

      if (error) throw new Error(error.message);
      continue;
    }

    const { error } = await input.supabase
      .from("class_bookings")
      .insert({
        class_id: input.classId,
        user_id: input.userId,
        student_id: student.id,
        booked_at: new Date().toISOString(),
        ...commonValues
      });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("duplicate") || lower.includes("unique")) {
        throw new Error(`${student.name} is already linked to this class.`);
      }
      throw new Error(error.message);
    }
  }

  const stripe = getStripeClient();
  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.userEmail ?? undefined,
    client_reference_id: registrationGroupId,
    success_url: `${appUrl}/classes?session_id={CHECKOUT_SESSION_ID}&group_id=${registrationGroupId}&class=${classRow.id}`,
    cancel_url: `${appUrl}/classes?class=${classRow.id}&canceled=1`,
    metadata: {
      bookingGroupId: registrationGroupId,
      classId: classRow.id,
      householdId: household.householdId,
      userId: input.userId,
      studentIds: students.map((student) => student.id).join(","),
      studentNames: students.map((student) => student.name).join(", "),
      pricingMode: pricing.mode,
      attendeeCount: String(students.length),
      waiverId: waiverId ?? ""
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pricing.totalCents,
          product_data: {
            name: classRow.title,
            description: `${pricing.breakdownLabel} - ${students.map((student) => student.name).join(", ")}`
          }
        }
      }
    ]
  });

  const { error: updateError } = await input.supabase
    .from("class_bookings")
    .update({
      stripe_checkout_session_id: session.id,
      booking_status: "pending",
      payment_status: "pending",
      updated_at: new Date().toISOString()
    })
    .eq("household_id", household.householdId)
    .eq("registration_group_id", registrationGroupId)
    .in("student_id", students.map((student) => student.id));

  if (updateError) throw new Error(updateError.message);

  return {
    registrationGroupId,
    checkoutUrl: session.url,
    totalCents: pricing.totalCents,
    pricingMode: pricing.mode
  };
}

export async function confirmClassBookingFromSession(input: {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  bookingGroupId: string;
}) {
  const household = await getHouseholdContext(input.supabase, input.userId);
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
    expand: ["payment_intent"]
  });

  const sessionGroupId = session.client_reference_id ?? session.metadata?.bookingGroupId ?? "";
  if (sessionGroupId !== input.bookingGroupId) {
    throw new Error("Checkout session does not match this class registration.");
  }

  const { data: bookingRows, error: bookingError } = await input.supabase
    .from("class_bookings")
    .select("id, class_id, user_id, household_id, student_id, registration_group_id, group_lead, attendee_count, pricing_mode, waiver_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
    .eq("household_id", household.householdId)
    .eq("registration_group_id", input.bookingGroupId);

  if (bookingError) throw new Error(bookingError.message);

  const bookings = (bookingRows ?? []) as LoadedBooking[];
  if (!bookings.length) {
    throw new Error("Class registration not found.");
  }

  if (session.payment_status !== "paid") {
    throw new Error("Stripe has not marked this checkout as paid yet.");
  }

  const newlyPaidCount = bookings.filter((booking) => booking.payment_status !== "paid").length;
  const classId = bookings[0].class_id;

  if (newlyPaidCount > 0) {
    const { data: classRow, error: classError } = await input.supabase
      .from("classes")
      .select("id, spots_remaining, status")
      .eq("id", classId)
      .maybeSingle();

    if (classError) throw new Error(classError.message);

    if (classRow) {
      const nextSpots = Math.max((classRow.spots_remaining ?? newlyPaidCount) - newlyPaidCount, 0);
      const nextStatus =
        (classRow.status === "published" || classRow.status === "scheduled") && nextSpots === 0
          ? "full"
          : classRow.status;
      const { error } = await input.supabase
        .from("classes")
        .update({
          spots_remaining: nextSpots,
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", classId);

      if (error) throw new Error(error.message);
    }
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  const { error: paidUpdateError } = await input.supabase
    .from("class_bookings")
    .update({
      booking_status: "confirmed",
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      amount_paid_cents: 0,
      updated_at: new Date().toISOString()
    })
    .eq("household_id", household.householdId)
    .eq("registration_group_id", input.bookingGroupId);

  if (paidUpdateError) throw new Error(paidUpdateError.message);

  const leadBooking = bookings.find((booking) => booking.group_lead) ?? bookings[0];
  const { error: leadUpdateError } = await input.supabase
    .from("class_bookings")
    .update({
      amount_paid_cents: session.amount_total ?? leadBooking.amount_paid_cents,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadBooking.id)
    .eq("household_id", household.householdId);

  if (leadUpdateError) throw new Error(leadUpdateError.message);

  return session;
}

export async function markClassAttended(input: {
  supabase: SupabaseClient;
  actingUserId: string;
  ownerUserId: string;
  bookingId: string;
  notes?: string;
  parentRating?: number;
}) {
  const { data: booking, error: bookingError } = await input.supabase
    .from("class_bookings")
    .select("id, class_id, user_id, household_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (bookingError) throw new Error(bookingError.message);
  if (!booking || !booking.student_id) throw new Error("Booking not found.");

  if (booking.payment_status !== "paid") {
    throw new Error("Only paid bookings can be marked attended.");
  }

  const { data: existingCompletion, error: existingCompletionError } = await input.supabase
    .from("activity_completions")
    .select("id")
    .eq("household_id", booking.household_id)
    .eq("student_id", booking.student_id)
    .eq("class_booking_id", booking.id)
    .maybeSingle();

  if (existingCompletionError) throw new Error(existingCompletionError.message);

  if (existingCompletion) {
    const { error: bookingUpdateError } = await input.supabase
      .from("class_bookings")
      .update({
        booking_status: "attended",
        notes: input.notes?.trim() ? input.notes.trim() : booking.notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", booking.id);

    if (bookingUpdateError) throw new Error(bookingUpdateError.message);

    return { alreadyCompleted: true };
  }

  const { error: bookingUpdateError } = await input.supabase
    .from("class_bookings")
    .update({
      booking_status: "attended",
      notes: input.notes?.trim() ? input.notes.trim() : booking.notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", booking.id);

  if (bookingUpdateError) throw new Error(bookingUpdateError.message);

  return completeActivity({
    supabase: input.supabase,
    userId: input.actingUserId,
    studentId: booking.student_id,
    classBookingId: booking.id,
    notes: input.notes,
    parentRating: input.parentRating
  });
}

export async function adminUpdateBookingStatus(input: {
  supabase: SupabaseClient;
  bookingId: string;
  action: "mark_no_show" | "cancel_booking" | "mark_refunded";
  notes?: string;
}) {
  const { data: booking, error: bookingError } = await input.supabase
    .from("class_bookings")
    .select("id, class_id, user_id, student_id, booking_status, payment_status, notes")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (bookingError) throw new Error(bookingError.message);
  if (!booking) throw new Error("Booking not found.");

  const { data: existingCompletion, error: completionError } = await input.supabase
    .from("activity_completions")
    .select("id")
    .eq("class_booking_id", booking.id)
    .maybeSingle();

  if (completionError) throw new Error(completionError.message);

  if (existingCompletion && input.action !== "mark_refunded") {
    throw new Error("This booking is already marked attended. Leave it attended so student progress stays accurate.");
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    notes: input.notes?.trim() ? input.notes.trim() : booking.notes
  };

  if (input.action === "mark_no_show") {
    updates.booking_status = "no_show";
  }

  if (input.action === "cancel_booking") {
    updates.booking_status = "cancelled";
  }

  if (input.action === "mark_refunded") {
    updates.payment_status = "refunded";
    updates.booking_status = booking.booking_status === "attended" ? "attended" : "cancelled";
  }

  const { error: updateError } = await input.supabase
    .from("class_bookings")
    .update(updates)
    .eq("id", booking.id);

  if (updateError) throw new Error(updateError.message);

  return booking;
}
