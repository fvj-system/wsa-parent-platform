import { NextResponse } from "next/server";
import { z } from "zod";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";

const createPortfolioNoteSchema = z.object({
  studentId: z.string().uuid(),
  note: z.string().trim().min(1).max(2000),
  relatedCompletionId: z.string().uuid().optional(),
  relatedGenerationId: z.string().uuid().optional()
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createPortfolioNoteSchema.safeParse(await request.json());
    const household = await getHouseholdContext(supabase, user.id);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid portfolio note." }, { status: 400 });
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("household_id", household.householdId)
      .eq("id", parsed.data.studentId)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("portfolio_notes")
      .insert({
        user_id: user.id,
        household_id: household.householdId,
        student_id: parsed.data.studentId,
        related_completion_id: parsed.data.relatedCompletionId ?? null,
        related_generation_id: parsed.data.relatedGenerationId ?? null,
        note: parsed.data.note
      })
      .select("id, user_id, household_id, student_id, related_completion_id, related_generation_id, note, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
