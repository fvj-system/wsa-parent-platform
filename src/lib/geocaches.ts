import type { SupabaseClient } from "@supabase/supabase-js";
import {
  milesBetweenPoints,
  type ResolvedLocationContext,
} from "@/lib/context/nearby-spots";

import { WSA_FACEBOOK_URL } from "@/lib/social";

export const geocacheStateOptions = [
  { code: "MD", name: "Maryland" },
  { code: "VA", name: "Virginia" },
  { code: "WV", name: "West Virginia" },
  { code: "DE", name: "Delaware" },
  { code: "PA", name: "Pennsylvania" },
] as const;

export const geocacheTypeOptions = [
  { value: "message", label: "Hidden message" },
  { value: "treasure", label: "Small treasure" },
  { value: "nature_swap", label: "Nature swap" },
  { value: "field_note", label: "Field note" },
] as const;

export type GeocacheStateCode = (typeof geocacheStateOptions)[number]["code"];
export type GeocacheType = (typeof geocacheTypeOptions)[number]["value"];
export type GeocacheStatus = "active" | "found" | "archived";

export type GeocacheRecord = {
  id: string;
  user_id: string;
  household_id: string;
  title: string;
  cache_type: GeocacheType;
  state_code: GeocacheStateCode;
  county_name: string;
  location_hint: string;
  clue: string;
  vague_map_hint: string | null;
  treasure_note: string | null;
  family_friendly: boolean;
  latitude: number | null;
  longitude: number | null;
  image_path: string | null;
  image_url: string | null;
  status: GeocacheStatus;
  created_at: string;
  updated_at: string;
};

export type CountyContext = {
  countyName: string;
  stateCode: GeocacheStateCode;
  label: string;
} | null;

export type NearbyGeocacheRecord = GeocacheRecord & {
  distance_miles: number | null;
  is_same_county: boolean;
};

export function isSupportedGeocacheState(value: string): value is GeocacheStateCode {
  return geocacheStateOptions.some((option) => option.code === value);
}

export function getGeocacheStateName(stateCode: GeocacheStateCode) {
  return geocacheStateOptions.find((option) => option.code === stateCode)?.name ?? stateCode;
}

export function getGeocacheTypeLabel(cacheType: GeocacheType) {
  return geocacheTypeOptions.find((option) => option.value === cacheType)?.label ?? cacheType;
}

export function buildGeocacheFacebookCaption(cache: Pick<
  GeocacheRecord,
  "title" | "cache_type" | "county_name" | "state_code" | "location_hint" | "clue" | "treasure_note"
>) {
  const typeLabel = getGeocacheTypeLabel(cache.cache_type);
  const locationLabel = `${cache.county_name} County, ${cache.state_code}`;
  const treasureLine = cache.treasure_note?.trim()
    ? `Hidden item: ${cache.treasure_note.trim()}`
    : "Hidden item: a simple mystery surprise for another family to find.";

  return [
    `We just posted a Wild Stallion Academy Field Quest community clue in ${locationLabel}.`,
    `Area hint: ${cache.location_hint}`,
    `Clue: ${cache.clue}`,
    treasureLine,
    "Come join the WSA Field Quests trail and see if your family can solve it.",
    `Share it with Wild Stallion Academy here: ${WSA_FACEBOOK_URL}`
  ].join("\n");
}

export function normalizeCountyName(input: string) {
  const trimmed = input.replace(/\bcounty\b/gi, "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  return trimmed
    .split(" ")
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : ""))
    .join(" ");
}

export async function geocodeCountyCenter(
  countyName: string,
  stateCode: GeocacheStateCode,
) {
  const normalizedCounty = normalizeCountyName(countyName);
  if (!normalizedCounty) {
    throw new Error("Enter a real county name.");
  }

  const stateName = getGeocacheStateName(stateCode);
  const query = `${normalizedCounty} County, ${stateName}, USA`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Wild Stallion Academy geocache lookup",
      },
      next: { revalidate: 60 * 60 * 24 * 14 },
    },
  );

  if (!response.ok) {
    throw new Error("Could not place that county on the map yet.");
  }

  const payload = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  const match = payload[0];
  const latitude = match?.lat ? Number(match.lat) : null;
  const longitude = match?.lon ? Number(match.lon) : null;

  if (
    latitude === null ||
    longitude === null ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    throw new Error("Could not find that county yet. Try a nearby county name.");
  }

  return {
    countyName: normalizedCounty,
    latitude,
    longitude,
    label: `${normalizedCounty} County, ${stateCode}`,
  };
}

export async function resolveCountyContextFromLocation(
  location: ResolvedLocationContext,
): Promise<CountyContext> {
  if (location.latitude === null || location.longitude === null) {
    return null;
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Wild Stallion Academy county lookup",
      },
      next: { revalidate: 60 * 60 * 6 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    address?: {
      county?: string;
      state?: string;
      country_code?: string;
    };
  };

  const rawCounty = payload.address?.county ?? "";
  const stateCode = payload.address?.country_code?.toUpperCase() === "US"
    ? geocacheStateOptions.find(
        (option) => option.name.toLowerCase() === (payload.address?.state ?? "").toLowerCase(),
      )?.code
    : undefined;

  if (!rawCounty || !stateCode) {
    return null;
  }

  const countyName = normalizeCountyName(rawCounty);
  if (!countyName || !isSupportedGeocacheState(stateCode)) {
    return null;
  }

  return {
    countyName,
    stateCode,
    label: `${countyName} County, ${stateCode}`,
  };
}

export async function listVisibleGeocaches(
  supabase: SupabaseClient,
  limit = 60,
) {
  const { data, error } = await supabase
    .from("geocaches")
    .select(
      "id, user_id, household_id, title, cache_type, state_code, county_name, location_hint, clue, vague_map_hint, treasure_note, family_friendly, latitude, longitude, image_path, image_url, status, created_at, updated_at",
    )
    .in("status", ["active", "found"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/relation .*geocaches.* does not exist/i.test(error.message)) {
      return [] as GeocacheRecord[];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as GeocacheRecord[];
}

export async function listHouseholdGeocaches(
  supabase: SupabaseClient,
  householdId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("geocaches")
    .select(
      "id, user_id, household_id, title, cache_type, state_code, county_name, location_hint, clue, vague_map_hint, treasure_note, family_friendly, latitude, longitude, image_path, image_url, status, created_at, updated_at",
    )
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/relation .*geocaches.* does not exist/i.test(error.message)) {
      return [] as GeocacheRecord[];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as GeocacheRecord[];
}

export function getNearbyGeocaches(
  geocaches: GeocacheRecord[],
  location: ResolvedLocationContext,
  countyContext: CountyContext,
  limit = 6,
): NearbyGeocacheRecord[] {
  const nearbyRadius = Math.max(location.radiusMiles + 25, 60);

  return geocaches
    .map((item) => {
      const sameCounty =
        countyContext !== null &&
        item.state_code === countyContext.stateCode &&
        normalizeCountyName(item.county_name) === countyContext.countyName;
      const distanceMiles =
        location.latitude !== null && location.longitude !== null
          ? milesBetweenPoints(
              location.latitude,
              location.longitude,
              item.latitude,
              item.longitude,
            )
          : null;
      const nearbyByDistance =
        typeof distanceMiles === "number" && distanceMiles <= nearbyRadius;

      return {
        item,
        sameCounty,
        distanceMiles,
        nearbyByDistance,
      };
    })
    .filter((entry) => entry.sameCounty || entry.nearbyByDistance)
    .sort((left, right) => {
      if (left.sameCounty !== right.sameCounty) {
        return left.sameCounty ? -1 : 1;
      }

      const leftDistance = left.distanceMiles ?? Number.MAX_SAFE_INTEGER;
      const rightDistance = right.distanceMiles ?? Number.MAX_SAFE_INTEGER;
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return right.item.created_at.localeCompare(left.item.created_at);
    })
    .slice(0, limit)
    .map((entry) => ({
      ...entry.item,
      distance_miles:
        typeof entry.distanceMiles === "number"
          ? Math.round(entry.distanceMiles * 10) / 10
          : null,
      is_same_county: entry.sameCounty,
    }));
}
