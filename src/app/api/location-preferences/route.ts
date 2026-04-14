import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  geocodeZipcode,
  getUserLocationPreferences,
  isSearchRadiusMiles,
  parseLocationPreferences,
  reverseGeocodeLocation
} from "@/lib/location-preferences";

const searchRadiusSchema = z.number().refine((value) => isSearchRadiusMiles(value), {
  message: "Choose a supported search radius."
});

const zipcodeSchema = z.object({
  locationMode: z.literal("zipcode"),
  homeZipcode: z.string().trim().min(5, "Enter a valid 5-digit ZIP code."),
  searchRadiusMiles: searchRadiusSchema
});

const currentSchema = z.object({
  locationMode: z.literal("current"),
  currentLat: z.number().min(-90).max(90),
  currentLng: z.number().min(-180).max(180),
  searchRadiusMiles: searchRadiusSchema
});

const locationPreferencesSchema = z.union([zipcodeSchema, currentSchema]);

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const preferences = await getUserLocationPreferences(supabase, user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load location preferences.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const parsed = locationPreferencesSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid location preferences." }, { status: 400 });
    }

    const existing = await getUserLocationPreferences(supabase, user.id);
    let updatePayload: Record<string, unknown>;

    if (parsed.data.locationMode === "zipcode") {
      const geocoded = await geocodeZipcode(parsed.data.homeZipcode);
      updatePayload = {
        location_mode: "zipcode",
        home_zipcode: geocoded.zipcode,
        home_lat: geocoded.latitude,
        home_lng: geocoded.longitude,
        location_label: geocoded.locationLabel,
        search_radius_miles: parsed.data.searchRadiusMiles
      };
    } else {
      const label = await reverseGeocodeLocation(parsed.data.currentLat, parsed.data.currentLng);
      updatePayload = {
        location_mode: "current",
        current_lat: parsed.data.currentLat,
        current_lng: parsed.data.currentLng,
        location_label: label.locationLabel,
        home_zipcode: existing.homeZipcode,
        home_lat: existing.homeLat,
        home_lng: existing.homeLng,
        search_radius_miles: parsed.data.searchRadiusMiles
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("location_mode, home_zipcode, home_lat, home_lng, current_lat, current_lng, location_label, search_radius_miles")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: parseLocationPreferences(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save location preferences.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
