import type { SupabaseClient } from "@supabase/supabase-js";

type LogGenerationInput = {
  supabase: SupabaseClient;
  familyId?: string | null;
  studentId?: string | null;
  userId?: string | null;
  feature: "lesson_planner" | "worksheet_generator" | "portfolio_tagger" | "review_summarizer";
  promptSummary: string;
  modelUsed: string;
  outputSummary: string;
};

export async function logGeneration(input: LogGenerationInput) {
  const { error } = await input.supabase.from("ai_generation_logs").insert({
    family_id: input.familyId ?? null,
    student_id: input.studentId ?? null,
    user_id: input.userId ?? null,
    feature: input.feature,
    prompt_summary: input.promptSummary,
    model_used: input.modelUsed,
    output_summary: input.outputSummary,
  });

  if (error) {
    console.error("ai_generation_log_failed", error.message);
    return false;
  }

  return true;
}
