import { PageShell } from "@/components/page-shell";
import { StudentsManager } from "@/components/students-manager";
import { requireUser } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function StudentsPage() {
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const { data } = await supabase
    .from("students")
    .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
    .eq("household_id", household.householdId)
    .order("created_at", { ascending: false });

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Students"
      title="Student profiles"
      description="Open each child's profile, keep their trail records organized, and move cleanly between proud student pages and parent review documentation."
    >
      <StudentsManager initialStudents={(data ?? []) as StudentRecord[]} />
    </PageShell>
  );
}
