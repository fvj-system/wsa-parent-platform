export const WSA_FACEBOOK_URL =
  process.env.NEXT_PUBLIC_WSA_FACEBOOK_URL || "https://www.facebook.com/profile.php?id=61584880110893";

export function getFacebookShareUrl(url: string, quote?: string) {
  const params = new URLSearchParams({ u: url });
  if (quote?.trim()) {
    params.set("quote", quote.trim());
  }
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}
