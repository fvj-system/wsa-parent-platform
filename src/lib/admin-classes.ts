import { z } from "zod";

export const adminClassStatusValues = ["draft", "scheduled", "full", "cancelled", "completed", "archived"] as const;

export const adminClassFormSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  short_description: z.string().trim().max(240).optional().or(z.literal("")),
  class_date: z.string().trim().min(1),
  start_time: z.string().trim().min(1),
  end_time: z.string().trim().min(1),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  price_child: z.coerce.number().min(0).max(9999).optional(),
  price_family: z.coerce.number().min(0).max(9999).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  what_to_bring: z.string().trim().max(1000).optional().or(z.literal("")),
  age_range: z.string().trim().max(80).optional().or(z.literal("")),
  registration_link_child: z.string().trim().url().optional().or(z.literal("")),
  registration_link_family: z.string().trim().url().optional().or(z.literal("")),
  is_featured: z.boolean(),
  status: z.enum(adminClassStatusValues)
}).superRefine((value, ctx) => {
  if (!value.registration_link_child && !value.registration_link_family) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add at least one Jotform registration link.",
      path: ["registration_link_child"]
    });
  }

  if (value.price_family !== undefined && value.price_child !== undefined && value.price_family < value.price_child) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Family price should not be lower than the child price by accident. Double-check this amount.",
      path: ["price_family"]
    });
  }
});

export const adminBookingActionSchema = z.object({
  action: z.enum(["mark_attended", "mark_no_show", "cancel_booking", "mark_refunded"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  parentRating: z.coerce.number().int().min(1).max(5).optional()
});

export function slugifyClassTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function parseAgeRange(ageRange: string | undefined) {
  const normalized = ageRange?.trim() ?? "";
  const match = normalized.match(/(\d{1,2})\s*[-to]+\s*(\d{1,2})/i);
  if (!match) {
    return {
      age_min: null,
      age_max: null
    };
  }

  return {
    age_min: Number(match[1]),
    age_max: Number(match[2])
  };
}

export function buildAdminClassPayload(input: z.infer<typeof adminClassFormSchema>) {
  const slug = input.slug?.trim() || slugifyClassTitle(input.title);
  const parsedAges = parseAgeRange(input.age_range);
  const capacity = input.capacity ?? null;
  const priceChild = input.price_child ?? null;

  return {
    title: input.title,
    slug: slug || null,
    description: input.description || null,
    short_description: input.short_description || null,
    class_date: input.class_date,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location || null,
    price_child: priceChild,
    price_family: input.price_family ?? null,
    capacity,
    status: input.status,
    image_url: input.image_url || null,
    what_to_bring: input.what_to_bring || null,
    age_range: input.age_range || null,
    registration_link_child: input.registration_link_child || input.registration_link_family || null,
    registration_link_family: input.registration_link_family || input.registration_link_child || null,
    is_featured: input.is_featured,
    class_type: input.age_range ? "Family field class" : "Class",
    date: input.class_date,
    age_min: parsedAges.age_min,
    age_max: parsedAges.age_max,
    price_cents: priceChild !== null ? Math.round(priceChild * 100) : 0,
    max_capacity: capacity,
    spots_remaining: capacity,
    weather_note: null,
    internal_notes: null,
    waiver_required: true
  };
}
