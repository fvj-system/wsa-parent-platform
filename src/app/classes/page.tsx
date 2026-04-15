import { ClassesHub } from "@/components/classes-hub";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import { confirmClassBookingFromSession } from "@/lib/class-bookings";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";
import type { WaiverRecord } from "@/lib/waivers";

export default async function ClassesPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; group_id?: string; class?: string; canceled?: string }>;
}) {
  const { session_id: sessionId, group_id: groupId, class: selectedClassId, canceled } = await searchParams;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  let successMessage = "";
  let errorMessage = canceled === "1" ? "Checkout was canceled. Your class registration was not completed." : "";

  if (sessionId && groupId) {
    try {
      await confirmClassBookingFromSession({
        supabase,
        userId: user.id,
        sessionId,
        bookingGroupId: groupId
      });
      successMessage = "Class registration confirmed and payment recorded.";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Could not confirm the Stripe session.";
    }
  }

  const [{ data: classes }, { data: students }, { data: bookings }, { data: reusableWaiver }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at")
      .in("status", ["published", "full", "completed"])
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(24),
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId)
      .order("created_at", { ascending: true }),
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, household_id, student_id, registration_group_id, group_lead, attendee_count, pricing_mode, waiver_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
      .eq("household_id", household.householdId)
      .order("booked_at", { ascending: false }),
    supabase
      .from("waivers")
      .select("id, user_id, household_id, student_id, child_name, emergency_contact, medical_notes, waiver_type, accepted_at, signature_name, signature_data, version, save_on_file")
      .eq("household_id", household.householdId)
      .eq("save_on_file", true)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Classes"
      title="Classes"
      description="Browse planned classes, register one or more children, reuse a saved waiver when available, and track family class activity in one place."
    >
      <ClassesHub
        classes={(classes ?? []) as ClassRecord[]}
        students={(students ?? []) as StudentRecord[]}
        bookings={(bookings ?? []) as ClassBookingRecord[]}
        initialSelectedClassId={selectedClassId ?? null}
        reusableWaiver={(reusableWaiver ?? null) as WaiverRecord | null}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />
    </PageShell>
  );
}
