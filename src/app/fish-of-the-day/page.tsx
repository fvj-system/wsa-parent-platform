import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureHouseholdBriefing } from "@/lib/daily-briefing";
import type { GenerationRecord } from "@/lib/generations";
import { getUserLocationPreferences, resolveUserLocationPreference } from "@/lib/location-preferences";

export default async function FishOfTheDayPage({
  searchParams
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: generations }, locationPreferences] = await Promise.all([
    supabase
      .from("generations")
      .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(16),
    getUserLocationPreferences(supabase, user.id)
  ]);

  const resolvedLocationPreference = resolveUserLocationPreference(locationPreferences);
  const briefing = await ensureHouseholdBriefing(
    supabase,
    user.id,
    (generations ?? []) as GenerationRecord[],
    resolvedLocationPreference.location.displayLabel
  );

  redirect(`/generations/${briefing.fishGeneration.id}`);
}
