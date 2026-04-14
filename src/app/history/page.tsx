import { HistoryList } from "@/components/history-list";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";

export default async function HistoryPage() {
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const { data } = await supabase
    .from("generations")
    .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
    .eq("household_id", household.householdId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="History"
      title="Saved generations"
      description="This feed supports lessons, animal cards, and weekly plans so every tool can write to one shared history model."
    >
      <HistoryList
        items={(data ?? []) as GenerationRecord[]}
        emptyMessage="No generations have been saved yet. Create an animal card or week planner to get started."
      />
    </PageShell>
  );
}
