import { NextResponse } from "next/server";
import { buildAdminFieldQuestPayload } from "@/lib/admin-field-quests";
import { requireAdmin } from "@/lib/auth";
import { fieldQuestAdminSchema } from "@/lib/field-quests";
import { geocodeCountyCenter, isSupportedGeocacheState } from "@/lib/geocaches";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const parsed = fieldQuestAdminSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Field Quest details." }, { status: 400 });
    }

    const { data: existingQuest, error: existingQuestError } = await supabase
      .from("field_quests")
      .select("latitude, longitude")
      .eq("id", id)
      .maybeSingle();

    if (existingQuestError) {
      return NextResponse.json({ error: existingQuestError.message }, { status: 500 });
    }

    const payload = buildAdminFieldQuestPayload(parsed.data);
    let locationPayload = {
      latitude: existingQuest?.latitude ?? null,
      longitude: existingQuest?.longitude ?? null,
    };

    if (
      payload.county_name &&
      payload.state_code &&
      isSupportedGeocacheState(payload.state_code)
    ) {
      const geocoded = await geocodeCountyCenter(payload.county_name, payload.state_code);
      payload.county_name = geocoded.countyName;
      locationPayload = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      };
    }

    const { error } = await supabase
      .from("field_quests")
      .update({
        ...payload,
        ...locationPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();

    const { error } = await supabase.from("field_quests").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
