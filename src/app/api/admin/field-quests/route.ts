import { NextResponse } from "next/server";
import { buildAdminFieldQuestPayload } from "@/lib/admin-field-quests";
import { requireAdmin } from "@/lib/auth";
import { fieldQuestAdminSchema } from "@/lib/field-quests";
import { geocodeCountyCenter, isSupportedGeocacheState } from "@/lib/geocaches";

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const parsed = fieldQuestAdminSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Field Quest details." }, { status: 400 });
    }

    const payload = buildAdminFieldQuestPayload(parsed.data);
    let locationPayload: { latitude: number | null; longitude: number | null } = {
      latitude: null,
      longitude: null,
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

    const { data, error } = await supabase
      .from("field_quests")
      .insert({
        ...payload,
        ...locationPayload,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
