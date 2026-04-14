import { PageShell } from "@/components/page-shell";
import { WeekPlannerGenerator } from "@/components/week-planner-generator";
import { requireUser } from "@/lib/auth";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function PlannerPage() {
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const [{ data }, { data: students }] = await Promise.all([
    supabase
      .from("generations")
      .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
      .eq("household_id", household.householdId)
      .eq("tool_type", "week_plan")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId)
      .order("created_at", { ascending: true })
  ]);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Week Planner"
      title="Weekly Planner"
      description="The parent command center for a practical family week: shared rhythm, real students, useful outings, and one weekly plan you can actually follow."
    >
      <WeekPlannerGenerator initialHistory={(data ?? []) as GenerationRecord[]} students={(students ?? []) as StudentRecord[]} />
    </PageShell>
  );
}
