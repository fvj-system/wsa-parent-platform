import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getNormalizedImageType,
  isSupportedImageType,
  MAX_UPLOAD_BYTES,
} from "@/lib/image-upload";
import { createSignedStorageUrl } from "@/lib/storage";
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
  vagueMapHint: z.string().trim().max(500).optional().default(""),
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

    const formData = await request.formData();
    const rawPayload = formData.get("payload");
    const image = formData.get("image");

    if (typeof rawPayload !== "string") {
      return NextResponse.json({ error: "Invalid community clue request." }, { status: 400 });
    }

    const parsed = createGeocacheSchema.safeParse(JSON.parse(rawPayload));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid community clue." },
        { status: 400 },
      );
    }

    const household = await getHouseholdContext(supabase, user.id);
    const geocodedCounty = await geocodeCountyCenter(
      parsed.data.countyName,
      parsed.data.stateCode,
    );

    let imagePath: string | null = null;
    let imageUrl: string | null = null;

    if (image instanceof File && image.size > 0) {
      const normalizedType = getNormalizedImageType(image);
      if (!isSupportedImageType(normalizedType)) {
        return NextResponse.json(
          { error: "Use a JPG, PNG, WEBP, or GIF image for the hiding spot photo." },
          { status: 400 },
        );
      }

      if (image.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "That hiding spot photo is too large. Try a smaller image." },
          { status: 400 },
        );
      }

      const extension = image.name.includes(".")
        ? image.name.slice(image.name.lastIndexOf(".")).toLowerCase()
        : ".jpg";
      imagePath = `${user.id}/geocaches/${crypto.randomUUID()}${extension}`;
      const bytes = Buffer.from(await image.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("leaf-photos")
        .upload(imagePath, bytes, {
          contentType: image.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      imageUrl = await createSignedStorageUrl(supabase, "leaf-photos", imagePath);
    }

    const { error } = await supabase.from("geocaches").insert({
      user_id: user.id,
      household_id: household.householdId,
      title: parsed.data.title,
      cache_type: parsed.data.cacheType as GeocacheType,
      state_code: parsed.data.stateCode,
      county_name: geocodedCounty.countyName,
      location_hint: parsed.data.locationHint,
      clue: parsed.data.clue,
      vague_map_hint: parsed.data.vagueMapHint || null,
      treasure_note: parsed.data.treasureNote || null,
      family_friendly: parsed.data.familyFriendly,
      latitude: geocodedCounty.latitude,
      longitude: geocodedCounty.longitude,
      image_path: imagePath,
      image_url: imageUrl,
      status: "active",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (/relation .*geocaches.* does not exist/i.test(error.message)) {
        return NextResponse.json(
          { error: "The community clue trail is not live in the database yet. Apply migrations 0031 and 0032 first." },
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
