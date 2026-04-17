import { AppShell } from "@/components/app-shell";
import { StudentsManager } from "@/components/students-manager";
import { requireUser } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function StudentsPage() {
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const { data } = await supabase
    .from("students")
    .select("id, user_id, household_id, name, age, interests, reading_level, current_rank, completed_adventures_count, created_at, updated_at")
    .eq("household_id", household.householdId)
    .order("created_at", { ascending: false });

  return (
    <AppShell userLabel={user.email ?? "WSA family"}>
      <section className="students-page-header">
        <p className="eyebrow">Students</p>
        <h1 className="page-title">Student profiles</h1>
      </section>
      <StudentsManager initialStudents={(data ?? []) as StudentRecord[]} />
    </AppShell>
  );
}
