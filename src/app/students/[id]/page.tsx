import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { StudentProfileView } from "@/components/student-profile-view";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import { requireUser } from "@/lib/auth";
import {
  normalizeStudentAchievementRows,
  normalizeStudentBadgeRows,
  type StudentAchievementRecord,
  type StudentBadgeRecord
} from "@/lib/badges";
import type { DiscoveryRecord } from "@/lib/discoveries";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";
import { createSignedStorageUrl, extractStoragePathFromLegacyUrl } from "@/lib/storage";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import type { StudentRecord } from "@/lib/students";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const { data: student } = await supabase
    .from("students")
    .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
    .eq("household_id", household.householdId)
    .eq("id", id)
    .maybeSingle();

  if (!student) {
    notFound();
  }

  const { data: completions } = await supabase
    .from("activity_completions")
    .select("id, user_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
    .eq("household_id", household.householdId)
    .eq("student_id", id)
    .order("completed_at", { ascending: false });

  const completionRows = (completions ?? []) as ActivityCompletionRecord[];
  const generationIds = completionRows.map((item) => item.generation_id).filter((value): value is string => Boolean(value));
  let completedAdventures: GenerationRecord[] = [];
  let linkedGenerations: GenerationRecord[] = [];

  if (generationIds.length) {
    const { data } = await supabase
      .from("generations")
      .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
      .in("id", generationIds)
      .order("created_at", { ascending: false });

    completedAdventures = (data ?? []) as GenerationRecord[];
  }

  const { data: linkedGenerationRows } = await supabase
    .from("generations")
    .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
    .eq("household_id", household.householdId)
    .eq("student_id", id)
    .order("created_at", { ascending: false })
    .limit(8);

  linkedGenerations = (linkedGenerationRows ?? []) as GenerationRecord[];

  const [{ data: badges }, { data: achievements }, { data: bookings }, { data: discoveries }] = await Promise.all([
    supabase
      .from("student_badges")
      .select("id, student_id, badge_id, earned_at, source_completion_id, created_at, badges:badges(id, name, description, category, icon, criteria_json, created_at)")
      .eq("student_id", id)
      .order("earned_at", { ascending: false }),
    supabase
      .from("student_achievements")
      .select("id, user_id, student_id, achievement_id, earned_at, created_at, achievements:achievements(id, key, name, description, earning_criteria, created_at)")
      .eq("household_id", household.householdId)
      .eq("student_id", id)
      .order("earned_at", { ascending: false }),
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, household_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at, classes:classes(id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at)")
      .eq("household_id", household.householdId)
      .eq("student_id", id)
      .order("booked_at", { ascending: false }),
    supabase
      .from("discoveries")
      .select("id, user_id, household_id, student_id, category, image_path, common_name, scientific_name, confidence_level, image_url, image_alt, notes, result_json, location_label, latitude, longitude, observed_at, created_at")
      .eq("household_id", household.householdId)
      .or(`student_id.eq.${id},student_id.is.null`)
      .order("observed_at", { ascending: false })
      .limit(6)
  ]);

  const recentDiscoveries = await Promise.all(
    ((discoveries ?? []) as DiscoveryRecord[]).map(async (item) => {
      const imagePath = item.image_path ?? extractStoragePathFromLegacyUrl(item.image_url, "leaf-photos");
      const signedImageUrl = await createSignedStorageUrl(supabase, "leaf-photos", imagePath);

      return {
        ...item,
        image_path: imagePath,
        image_url: signedImageUrl ?? item.image_url
      } satisfies DiscoveryRecord;
    })
  );

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Student profile"
      title={student.name}
      description="A proud student field record with rank, recent work, creature-log connections, and a clean path into homeschool review."
    >
      <StudentProfileView
        student={student as StudentRecord}
        completedAdventures={completedAdventures}
        linkedGenerations={linkedGenerations}
        recentCompletions={completionRows}
        recentDiscoveries={recentDiscoveries}
        classBookings={((bookings ?? []) as Array<ClassBookingRecord & { classes?: ClassRecord | ClassRecord[] | null }>).map((item) => ({
          ...item,
          classes: Array.isArray(item.classes) ? item.classes[0] : item.classes
        }))}
        badges={normalizeStudentBadgeRows(badges ?? []) as StudentBadgeRecord[]}
        achievements={normalizeStudentAchievementRows(achievements ?? []) as StudentAchievementRecord[]}
      />
    </PageShell>
  );
}
