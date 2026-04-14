import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveLocationContext, type ResolvedLocationContext } from "@/lib/context/nearby-spots";

export type LocationMode = "zipcode" | "current";

export const SEARCH_RADIUS_OPTIONS = [10, 25, 50, 100, 200, 300] as const;
export type SearchRadiusMiles = (typeof SEARCH_RADIUS_OPTIONS)[number];

export type LocationPreferences = {
  locationMode: LocationMode;
  homeZipcode: string | null;
  homeLat: number | null;
  homeLng: number | null;
  currentLat: number | null;
  currentLng: number | null;
  locationLabel: string | null;
  searchRadiusMiles: SearchRadiusMiles;
};

type ProfileLocationRow = {
  location_mode?: string | null;
  home_zipcode?: string | null;
  home_lat?: number | null;
  home_lng?: number | null;
  current_lat?: number | null;
  current_lng?: number | null;
  location_label?: string | null;
  search_radius_miles?: number | null;
};

export type ResolvedUserLocationPreference = {
  preferences: LocationPreferences;
  location: ResolvedLocationContext;
  activeSource: "current" | "zipcode" | "fallback";
  statusLabel: string;
  needsSetup: boolean;
};

export function getDefaultLocationPreferences(): LocationPreferences {
  return {
    locationMode: "zipcode",
    homeZipcode: null,
    homeLat: null,
    homeLng: null,
    currentLat: null,
    currentLng: null,
    locationLabel: process.env.WSA_DEFAULT_REGION || "Delaware, Maryland, and Virginia",
    searchRadiusMiles: 25
  };
}

export function isSearchRadiusMiles(value: number | null | undefined): value is SearchRadiusMiles {
  return SEARCH_RADIUS_OPTIONS.some((option) => option === value);
}

export function parseLocationPreferences(row: ProfileLocationRow | null | undefined): LocationPreferences {
  const defaults = getDefaultLocationPreferences();
  const radius = row?.search_radius_miles;
  return {
    locationMode: row?.location_mode === "current" ? "current" : "zipcode",
    homeZipcode: row?.home_zipcode?.trim() || null,
    homeLat: typeof row?.home_lat === "number" ? row.home_lat : null,
    homeLng: typeof row?.home_lng === "number" ? row.home_lng : null,
    currentLat: typeof row?.current_lat === "number" ? row.current_lat : null,
    currentLng: typeof row?.current_lng === "number" ? row.current_lng : null,
    locationLabel: row?.location_label?.trim() || defaults.locationLabel,
    searchRadiusMiles: isSearchRadiusMiles(radius) ? radius : defaults.searchRadiusMiles
  };
}

export async function getUserLocationPreferences(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("location_mode, home_zipcode, home_lat, home_lng, current_lat, current_lng, location_label, search_radius_miles")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (/column .*location_mode.* does not exist/i.test(error.message)) {
      return getDefaultLocationPreferences();
    }
    throw new Error(error.message);
  }

  return parseLocationPreferences((data ?? null) as ProfileLocationRow | null);
}

export function resolveUserLocationPreference(preferences: LocationPreferences): ResolvedUserLocationPreference {
  const fallbackLabel = process.env.WSA_DEFAULT_REGION || "Delaware, Maryland, and Virginia";
  const currentReady = preferences.currentLat !== null && preferences.currentLng !== null;
  const homeReady = preferences.homeLat !== null && preferences.homeLng !== null;

  if (preferences.locationMode === "current" && currentReady) {
    const location = resolveLocationContext({
      locationLabel: preferences.locationLabel || "Current location",
      latitude: preferences.currentLat,
      longitude: preferences.currentLng,
      radiusMiles: preferences.searchRadiusMiles
    });

    return {
      preferences,
      location,
      activeSource: "current",
      statusLabel: "Using current location",
      needsSetup: false
    };
  }

  if (homeReady) {
    const homeLabel = preferences.locationLabel || preferences.homeZipcode || fallbackLabel;
    const location = resolveLocationContext({
      locationLabel: homeLabel,
      latitude: preferences.homeLat,
      longitude: preferences.homeLng,
      radiusMiles: preferences.searchRadiusMiles
    });

    return {
      preferences,
      location,
      activeSource: "zipcode",
      statusLabel: `Using ${homeLabel}`,
      needsSetup: false
    };
  }

  return {
    preferences,
    location: resolveLocationContext({
      locationLabel: fallbackLabel,
      radiusMiles: preferences.searchRadiusMiles
    }),
    activeSource: "fallback",
    statusLabel: "Set a ZIP code or current location",
    needsSetup: true
  };
}

export async function geocodeZipcode(zipcode: string) {
  const normalizedZipcode = zipcode.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(normalizedZipcode)) {
    throw new Error("Enter a valid 5-digit ZIP code.");
  }

  const response = await fetch(`https://api.zippopotam.us/us/${normalizedZipcode}`, {
    headers: {
      Accept: "application/json"
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    throw new Error("That ZIP code could not be located.");
  }

  const payload = (await response.json()) as {
    places?: Array<{
      latitude?: string;
      longitude?: string;
      "place name"?: string;
      "state abbreviation"?: string;
    }>;
  };

  const place = payload.places?.[0];
  const latitude = place?.latitude ? Number(place.latitude) : null;
  const longitude = place?.longitude ? Number(place.longitude) : null;

  if (latitude === null || Number.isNaN(latitude) || longitude === null || Number.isNaN(longitude)) {
    throw new Error("ZIP coordinates were unavailable.");
  }

  return {
    zipcode: normalizedZipcode,
    latitude,
    longitude,
    locationLabel: [place?.["place name"], place?.["state abbreviation"]].filter(Boolean).join(", ") || normalizedZipcode
  };
}

export async function reverseGeocodeLocation(latitude: number, longitude: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Wild Stallion Academy AI"
      },
      next: { revalidate: 60 * 60 * 6 }
    }
  );

  if (!response.ok) {
    return {
      locationLabel: `Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
    };
  }

  const payload = (await response.json()) as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      hamlet?: string;
      state?: string;
    };
  };

  const city =
    payload.address?.city ||
    payload.address?.town ||
    payload.address?.village ||
    payload.address?.hamlet;
  const state = payload.address?.state;

  return {
    locationLabel: [city, state].filter(Boolean).join(", ") || `Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
  };
}
