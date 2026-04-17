import { NextResponse } from "next/server";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";
import { updateStudentReadingLevelSchema } from "@/lib/students";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateStudentReadingLevelSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid student update." }, { status: 400 });
    }

    const household = await getHouseholdContext(supabase, user.id);
    const { data, error } = await supabase
      .from("students")
      .update({
        reading_level: parsed.data.readingLevel,
        updated_at: new Date().toISOString()
      })
      .eq("household_id", household.householdId)
      .eq("id", id)
      .select("id, user_id, household_id, name, age, interests, reading_level, current_rank, completed_adventures_count, created_at, updated_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json({ student: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
