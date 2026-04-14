import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PortfolioStudentView } from "@/components/portfolio-student-view";
import { requireUser } from "@/lib/auth";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import { normalizeStudentAchievementRows, normalizeStudentBadgeRows, type StudentAchievementRecord, type StudentBadgeRecord } from "@/lib/badges";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";
import { getPortfolioRange, isWithinRange, type PortfolioNoteRecord } from "@/lib/portfolio";
import type { StudentRecord } from "@/lib/students";

type PortfolioStudentPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function PortfolioStudentPage({ params, searchParams }: PortfolioStudentPageProps) {
  const { studentId } = await params;
  const rangeParams = await searchParams;
  const range = getPortfolioRange(rangeParams);
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const { data: student } = await supabase
    .from("students")
    .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
    .eq("household_id", household.householdId)
    .eq("id", studentId)
    .maybeSingle();

  if (!student) {
    notFound();
  }

  const [{ data: completionRows }, { data: generationRows }, { data: badgeRows }, { data: achievementRows }, { data: noteRows }, { data: bookingRows }] =
    await Promise.all([
      supabase
        .from("activity_completions")
        .select("id, user_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
        .eq("household_id", household.householdId)
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false }),
      supabase
        .from("generations")
        .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
        .eq("household_id", household.householdId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("student_badges")
        .select("id, student_id, badge_id, earned_at, source_completion_id, created_at, badges:badges(id, name, description, category, icon, criteria_json, created_at)")
        .eq("student_id", studentId)
        .order("earned_at", { ascending: false }),
      supabase
        .from("student_achievements")
        .select("id, user_id, student_id, achievement_id, earned_at, created_at, achievements:achievements(id, key, name, description, earning_criteria, created_at)")
        .eq("household_id", household.householdId)
        .eq("student_id", studentId)
        .order("earned_at", { ascending: false }),
      supabase
        .from("portfolio_notes")
        .select("id, user_id, student_id, related_completion_id, related_generation_id, note, created_at")
        .eq("user_id", user.id)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("class_bookings")
        .select("id, class_id, user_id, household_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, classes:classes(id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at)")
        .eq("household_id", household.householdId)
        .eq("student_id", studentId)
        .order("booked_at", { ascending: false })
    ]);

  const completions = ((completionRows ?? []) as ActivityCompletionRecord[]).filter((item) => isWithinRange(item.completed_at, range));
  const linkedGenerations = (generationRows ?? []) as GenerationRecord[];
  const completionGenerationIds = completions.map((item) => item.generation_id).filter((value): value is string => Boolean(value));
  const completionGenerations = linkedGenerations.filter((item) => completionGenerationIds.includes(item.id));
  const badges = (normalizeStudentBadgeRows(badgeRows ?? []) as StudentBadgeRecord[]).filter((item) => isWithinRange(item.earned_at, range));
  const achievements = (normalizeStudentAchievementRows(achievementRows ?? []) as StudentAchievementRecord[]).filter((item) =>
    isWithinRange(item.earned_at, range)
  );
  const notes = ((noteRows ?? []) as PortfolioNoteRecord[]).filter((item) => isWithinRange(item.created_at, range));
  const classBookings = ((bookingRows ?? []) as Array<ClassBookingRecord & { classes?: ClassRecord | ClassRecord[] | null }>)
    .map((item) => ({
      ...item,
      classes: Array.isArray(item.classes) ? item.classes[0] : item.classes
    }))
    .filter((item) => completions.some((completion) => completion.class_booking_id === item.id));

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Homeschool review"
      title={`${student.name}'s review packet`}
      description="A professional parent-facing export built from completed activities, class participation, badges, and parent reflections."
    >
      <PortfolioStudentView
        student={student as StudentRecord}
        range={range}
        completions={completions}
        linkedGenerations={linkedGenerations}
        completionGenerations={completionGenerations}
        classBookings={classBookings}
        badges={badges}
        achievements={achievements}
        notes={notes}
      />
    </PageShell>
  );
}
