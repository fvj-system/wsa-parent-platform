import type { SupabaseClient } from "@supabase/supabase-js";

export async function createSignedStorageUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600
) {
  if (!path) return null;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export function extractStoragePathFromLegacyUrl(value: string | null | undefined, bucket: string) {
  if (!value) return null;

  const marker = `/object/public/${bucket}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex >= 0) {
    return decodeURIComponent(value.slice(markerIndex + marker.length));
  }

  const signedMarker = `/object/sign/${bucket}/`;
  const signedMarkerIndex = value.indexOf(signedMarker);
  if (signedMarkerIndex >= 0) {
    const pathWithQuery = value.slice(signedMarkerIndex + signedMarker.length);
    return decodeURIComponent(pathWithQuery.split("?")[0] ?? "");
  }

  return null;
}
