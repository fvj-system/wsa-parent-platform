import { NextResponse } from "next/server";
import { getHouseholdContext } from "@/lib/households";
import { fieldQuestEventSchema, getFieldQuestSelect, type FieldQuestRecord } from "@/lib/field-quests";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const parsed = fieldQuestEventSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid field quest event." }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const questQuery = supabase
      .from("field_quests")
      .select(getFieldQuestSelect())
      .eq("status", "published");

    const { data: quest, error: questError } = parsed.data.questId
      ? await questQuery.eq("id", parsed.data.questId).maybeSingle()
      : await questQuery.eq("slug", parsed.data.questSlug ?? "").maybeSingle();

    if (questError) {
      throw new Error(questError.message);
    }

    if (!quest) {
      return NextResponse.json({ error: "Field Quest not found." }, { status: 404 });
    }
    const questRecord = quest as unknown as FieldQuestRecord;

    let householdId: string | null = null;
    if (user) {
      try {
        householdId = (await getHouseholdContext(supabase, user.id)).householdId;
      } catch {
        householdId = null;
      }
    }

    const { error } = await supabase.from("field_quest_events").insert({
      quest_id: questRecord.id,
      user_id: user?.id ?? null,
      household_id: householdId,
      student_id: parsed.data.studentId ?? null,
      event_type: parsed.data.eventType,
      metadata_json: parsed.data.metadata ?? {},
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
