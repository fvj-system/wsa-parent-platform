import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationKind } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";

type SaveGenerationInput = {
  supabase: SupabaseClient;
  userId: string;
  studentId?: string;
  toolType: GenerationKind;
  title: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
};

export async function saveGeneration({
  supabase,
  userId,
  studentId,
  toolType,
  title,
  inputJson,
  outputJson
}: SaveGenerationInput) {
  const household = await getHouseholdContext(supabase, userId);

  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      household_id: household.householdId,
      student_id: studentId ?? null,
      kind: toolType,
      tool_type: toolType,
      title,
      input_json: inputJson,
      output_json: outputJson
    })
    .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
