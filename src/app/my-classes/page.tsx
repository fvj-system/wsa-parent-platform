import { MyClassesList } from "@/components/my-classes-list";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import { confirmClassBookingFromSession } from "@/lib/class-bookings";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function MyClassesPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; booking_id?: string }>;
}) {
  const { session_id: sessionId, booking_id: bookingId } = await searchParams;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  let successMessage = "";
  let errorMessage = "";

  if (sessionId && bookingId) {
    try {
      await confirmClassBookingFromSession({
        supabase,
        userId: user.id,
        sessionId,
        bookingId
      });
      successMessage = "Class booking confirmed and payment recorded.";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Could not confirm the Stripe session.";
    }
  }

  const [{ data: bookings }, { data: students }, { data: completions }] = await Promise.all([
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, household_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at, classes:classes(id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at)")
      .eq("household_id", household.householdId)
      .order("booked_at", { ascending: false }),
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId),
    supabase
      .from("activity_completions")
      .select("id, user_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
      .eq("household_id", household.householdId)
      .eq("activity_type", "in_person_class")
  ]);

  const studentMap = new Map(((students ?? []) as StudentRecord[]).map((student) => [student.id, student.name]));
  const bookingItems = ((bookings ?? []) as Array<ClassBookingRecord & { classes?: ClassRecord | ClassRecord[] | null }>).map((item) => ({
    ...item,
    studentName: item.student_id ? studentMap.get(item.student_id) ?? "Student" : "Student",
    classes: Array.isArray(item.classes) ? item.classes[0] : item.classes
  }));

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="My Classes"
      title="Booked classes"
      description="One place to track bookings, payment status, and later mark attended classes into the student learning record."
    >
      {errorMessage ? <p className="error">{errorMessage}</p> : null}
      <MyClassesList
        items={bookingItems}
        completions={(completions ?? []) as ActivityCompletionRecord[]}
        successMessage={successMessage}
      />
    </PageShell>
  );
}
