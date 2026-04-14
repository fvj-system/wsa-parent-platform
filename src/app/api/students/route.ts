import { NextResponse } from "next/server";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";
import { createStudentSchema, parseInterests } from "@/lib/students";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createStudentSchema.safeParse(await request.json());
    const household = await getHouseholdContext(supabase, user.id);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid student profile request." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        user_id: user.id,
        household_id: household.householdId,
        name: parsed.data.name,
        age: parsed.data.age,
        interests: parseInterests(parsed.data.interests)
      })
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ student: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
