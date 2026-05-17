import { NextResponse } from "next/server";
import { z } from "zod";
import {
  geocodeCountyCenter,
  isSupportedGeocacheState,
  type GeocacheType,
} from "@/lib/geocaches";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";

const createGeocacheSchema = z.object({
  title: z.string().trim().min(3).max(120),
  cacheType: z.enum(["message", "treasure", "nature_swap", "field_note"]),
  stateCode: z.string().trim().refine((value) => isSupportedGeocacheState(value), {
    message: "Choose one of the supported states.",
  }),
  countyName: z.string().trim().min(2).max(80),
  locationHint: z.string().trim().min(6).max(160),
  clue: z.string().trim().min(12).max(800),
  treasureNote: z.string().trim().max(500).optional().default(""),
  familyFriendly: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createGeocacheSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid trail cache." },
        { status: 400 },
      );
    }

    const household = await getHouseholdContext(supabase, user.id);
    const geocodedCounty = await geocodeCountyCenter(
      parsed.data.countyName,
      parsed.data.stateCode,
    );

    const { error } = await supabase.from("geocaches").insert({
      user_id: user.id,
      household_id: household.householdId,
      title: parsed.data.title,
      cache_type: parsed.data.cacheType as GeocacheType,
      state_code: parsed.data.stateCode,
      county_name: geocodedCounty.countyName,
      location_hint: parsed.data.locationHint,
      clue: parsed.data.clue,
      treasure_note: parsed.data.treasureNote || null,
      family_friendly: parsed.data.familyFriendly,
      latitude: geocodedCounty.latitude,
      longitude: geocodedCounty.longitude,
      status: "active",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (/relation .*geocaches.* does not exist/i.test(error.message)) {
        return NextResponse.json(
          { error: "The geocache trail is not live in the database yet. Apply migration 0031 first." },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
