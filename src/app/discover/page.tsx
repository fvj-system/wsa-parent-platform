import { IdentifyTool } from "@/components/identify-tool";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const { data: students } = await supabase
    .from("students")
    .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
    .eq("household_id", household.householdId)
    .order("created_at", { ascending: false });

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Discover Nature"
      title="Phone field discovery"
      description="Photograph a nature find, get a careful possible identification, and turn it into a quick Wild Stallion Academy observation mission."
    >
      <IdentifyTool students={(students ?? []) as StudentRecord[]} preselectedStudentId={studentId} />
    </PageShell>
  );
}
