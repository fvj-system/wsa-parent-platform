export const CLASS_PRICING = {
  perChildCents: 1500,
  familyCents: 2500,
  familyChildCap: 4
} as const;

export type ClassPricingMode = "per_child" | "family";

export type ClassPricingSummary = {
  attendeeCount: number;
  mode: ClassPricingMode;
  totalCents: number;
  breakdownLabel: string;
};

export function calculateClassRegistrationPrice(attendeeCount: number): ClassPricingSummary {
  const count = Math.max(0, attendeeCount);

  if (count <= 1) {
    return {
      attendeeCount: count,
      mode: "per_child",
      totalCents: count * CLASS_PRICING.perChildCents,
      breakdownLabel: count === 1 ? "$15 for 1 child" : "Select at least one child"
    };
  }

  if (count <= CLASS_PRICING.familyChildCap) {
    return {
      attendeeCount: count,
      mode: "family",
      totalCents: CLASS_PRICING.familyCents,
      breakdownLabel: `$25 family rate for ${count} children`
    };
  }

  const extraChildren = count - CLASS_PRICING.familyChildCap;
  const extraTotal = extraChildren * CLASS_PRICING.perChildCents;
  return {
    attendeeCount: count,
    mode: "family",
    totalCents: CLASS_PRICING.familyCents + extraTotal,
    breakdownLabel: `$25 family rate for first 4 children + $15 each for ${extraChildren} additional child${extraChildren === 1 ? "" : "ren"}`
  };
}

export function formatPrice(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amountCents / 100);
}
