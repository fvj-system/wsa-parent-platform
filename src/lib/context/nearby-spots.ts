import type { SupabaseClient } from "@supabase/supabase-js";
import { inferWaterTypeFromSpotType, type WaterType } from "@/lib/fish-of-day/water-type";

export type NearbySpotRecord = {
  id: string;
  name: string;
  spot_type: string;
  location_label: string;
  latitude: number | null;
  longitude: number | null;
  habitat_tags: string[];
  activity_tags: string[];
  description: string | null;
  family_friendly: boolean;
  fishing_relevant: boolean;
  birding_relevant: boolean;
  notes: string | null;
  created_at: string;
};

export type LocationContextInput = {
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMiles?: number | null;
};

export type ResolvedLocationContext = {
  displayLabel: string;
  latitude: number | null;
  longitude: number | null;
  radiusMiles: number;
  source: "coordinates" | "region_match" | "fallback";
};

export type RecommendedSpot = {
  id: string;
  name: string;
  spotType: string;
  waterType: string | null;
  locationLabel: string;
  distanceMiles: number | null;
  description: string;
  reason: string;
  familyFriendly: boolean;
  recommendedUseToday: string;
  accessNote: string;
  mapUrl: string;
  linkLabel?: string;
};

const regionCenters: Array<{ keywords: string[]; label: string; latitude: number; longitude: number }> = [
  { keywords: ["southern maryland", "southern md"], label: "Southern Maryland", latitude: 38.4012, longitude: -76.6413 },
  { keywords: ["leonardtown"], label: "Leonardtown, MD", latitude: 38.2912, longitude: -76.6355 },
  { keywords: ["solomons"], label: "Solomons, MD", latitude: 38.3228, longitude: -76.4522 },
  { keywords: ["lexington park"], label: "Lexington Park, MD", latitude: 38.2668, longitude: -76.4513 },
  { keywords: ["prince frederick"], label: "Prince Frederick, MD", latitude: 38.5404, longitude: -76.5844 },
  { keywords: ["charlotte hall"], label: "Charlotte Hall, MD", latitude: 38.4846, longitude: -76.7844 },
  { keywords: ["california"], label: "California, MD", latitude: 38.3004, longitude: -76.5075 }
];

export function resolveLocationContext(input: LocationContextInput): ResolvedLocationContext {
  const radiusMiles = input.radiusMiles && input.radiusMiles > 0 ? input.radiusMiles : 10;

  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    return {
      displayLabel: input.locationLabel?.trim() || "Current location",
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMiles,
      source: "coordinates"
    };
  }

  const normalized = input.locationLabel?.trim().toLowerCase() ?? "";
  const matchedRegion = regionCenters.find((region) => region.keywords.some((keyword) => normalized.includes(keyword)));

  if (matchedRegion) {
    return {
      displayLabel: input.locationLabel?.trim() || matchedRegion.label,
      latitude: matchedRegion.latitude,
      longitude: matchedRegion.longitude,
      radiusMiles,
      source: "region_match"
    };
  }

  return {
    displayLabel: input.locationLabel?.trim() || "Southern Maryland",
    latitude: regionCenters[0].latitude,
    longitude: regionCenters[0].longitude,
    radiusMiles,
    source: "fallback"
  };
}

export function milesBetweenPoints(
  fromLat: number,
  fromLng: number,
  toLat: number | null,
  toLng: number | null
) {
  if (toLat === null || toLng === null) return null;

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
}

export function getSpotMapUrl(spot: Pick<NearbySpotRecord, "name" | "latitude" | "longitude" | "location_label">) {
  if (spot.latitude !== null && spot.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name} ${spot.location_label}`)}`;
}

type NearbySpotQuery = {
  supabase: SupabaseClient;
  location: ResolvedLocationContext;
  activityTag?: string;
  habitatTags?: string[];
  preferredWaterType?: WaterType | null;
  limit?: number;
  requireFishing?: boolean;
  requireBirding?: boolean;
};

export async function findRecommendedSpots({
  supabase,
  location,
  activityTag,
  habitatTags = [],
  preferredWaterType = null,
  limit = 4,
  requireFishing = false,
  requireBirding = false
}: NearbySpotQuery): Promise<RecommendedSpot[]> {
  const { data, error } = await supabase
    .from("nearby_spots")
    .select(
      "id, name, spot_type, location_label, latitude, longitude, habitat_tags, activity_tags, description, family_friendly, fishing_relevant, birding_relevant, notes, created_at"
    );

  if (error) {
    throw new Error(error.message);
  }

  const spots = (data ?? []) as NearbySpotRecord[];
  const filtered = spots
    .filter((spot) => (!requireFishing || spot.fishing_relevant) && (!requireBirding || spot.birding_relevant))
    .map((spot) => {
      const distanceMiles =
        location.latitude !== null && location.longitude !== null
          ? milesBetweenPoints(location.latitude, location.longitude, spot.latitude, spot.longitude)
          : null;

      const matchingHabitatCount = habitatTags.filter((tag) => spot.habitat_tags.includes(tag)).length;
      const activityMatch = activityTag && spot.activity_tags.includes(activityTag) ? 1 : 0;
      const waterType = inferWaterTypeFromSpotType(spot.spot_type);
      const waterTypeMatch = preferredWaterType && waterType === preferredWaterType ? 4 : 0;
      const distanceScore =
        distanceMiles === null ? 0 : distanceMiles <= location.radiusMiles ? Math.max(0, 12 - distanceMiles) : -8;
      const relevanceScore = matchingHabitatCount * 3 + activityMatch * 3 + waterTypeMatch + (spot.family_friendly ? 1 : 0) + distanceScore;

      return { spot, distanceMiles, relevanceScore };
    })
    .filter((item) => item.relevanceScore > -4)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return filtered.map(({ spot, distanceMiles }) => ({
    id: spot.id,
    name: spot.name,
    spotType: spot.spot_type,
    waterType: inferWaterTypeFromSpotType(spot.spot_type),
    locationLabel: spot.location_label,
    distanceMiles: distanceMiles === null ? null : Math.round(distanceMiles * 10) / 10,
    description: spot.description ?? spot.notes ?? "A family-friendly local nature stop.",
    reason: buildSpotReason(spot, habitatTags, activityTag),
    familyFriendly: spot.family_friendly,
    recommendedUseToday: getRecommendedUseToday(spot, activityTag),
    accessNote: buildAccessNote(spot),
    mapUrl: getSpotMapUrl(spot),
    linkLabel: "Open in Maps"
  }));
}

function buildSpotReason(spot: NearbySpotRecord, habitatTags: string[], activityTag?: string) {
  const reasons: string[] = [];
  const matchingHabitat = habitatTags.filter((tag) => spot.habitat_tags.includes(tag));

  if (matchingHabitat.length) {
    reasons.push(`This spot matches the ${matchingHabitat.join(", ")} habitat you are most likely to need today.`);
  }

  if (activityTag && spot.activity_tags.includes(activityTag)) {
    reasons.push(`It is one of the better nearby places for ${activityTag.replaceAll("_", " ")}.`);
  }

  if (spot.family_friendly) {
    reasons.push("It also looks workable for a family outing without too much complexity.");
  }

  return reasons.join(" ") || "It is a practical nearby place to try first today.";
}

function getRecommendedUseToday(spot: NearbySpotRecord, activityTag?: string) {
  const waterType = inferWaterTypeFromSpotType(spot.spot_type);
  if (activityTag === "fishing") {
    if (waterType === "shoreline") return "Best for a short tidal shoreline session, bait-watch, or sheltered scout.";
    if (waterType === "river" || waterType === "creek") return "Best for current-reading, short casts, or family scouting along calmer edges.";
    return "Best for a calm family bank-fishing stop close to simple access and fish cover.";
  }

  if (activityTag === "birding") {
    return spot.birding_relevant
      ? "Best for quiet watching, listening, and short journal notes."
      : "Best for a general observation walk.";
  }

  if (activityTag === "amphibians") {
    return "Best for careful edge observation rather than a fast moving walk.";
  }

  return "Best for a short family observation stop.";
}

function buildAccessNote(spot: NearbySpotRecord) {
  if (spot.notes?.trim()) return spot.notes.trim();
  if (spot.family_friendly) return "Family-friendly access looks better here than at a rougher backcountry stop.";
  return "Check access, footing, and closures before heading out.";
}
