import { z } from "zod";

export const discoveryCatalogCategories = ["animals", "bugs", "trees", "birds", "fish", "plants", "mushrooms"] as const;
export type DiscoveryCatalogCategory = (typeof discoveryCatalogCategories)[number];

export const discoveryCatalogCategorySchema = z.enum(discoveryCatalogCategories);

export type DiscoveryRecord = {
  id: string;
  user_id: string;
  household_id?: string;
  student_id: string | null;
  category: DiscoveryCatalogCategory;
  image_path?: string | null;
  common_name: string;
  scientific_name: string | null;
  confidence_level: "low" | "medium" | "high";
  image_url: string;
  image_alt: string | null;
  notes: string | null;
  result_json: Record<string, unknown>;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  observed_at: string;
  created_at: string;
};

export function mapDiscoverModeToCatalogCategory(value: string): DiscoveryCatalogCategory {
  const normalized = value.trim().toLowerCase();

  if (["bird", "birds"].includes(normalized)) return "birds";
  if (["fish"].includes(normalized)) return "fish";
  if (["mushroom", "mushrooms", "fungus", "fungi"].includes(normalized)) return "mushrooms";
  if (["tree", "trees", "leaf", "leaves"].includes(normalized)) return "trees";
  if (["plant", "plants", "flower", "flowers"].includes(normalized)) return "plants";
  if (["bug", "bugs", "butterfly", "butterflies", "insect", "insects", "beetle", "bee", "moth"].includes(normalized)) return "bugs";
  return "animals";
}

export function getDiscoveryCategoryLabel(category: DiscoveryCatalogCategory) {
  switch (category) {
    case "animals":
      return "Animals";
    case "bugs":
      return "Bugs";
    case "trees":
      return "Trees";
    case "birds":
      return "Birds";
    case "fish":
      return "Fish";
    case "plants":
      return "Plants";
    case "mushrooms":
      return "Mushrooms";
  }
}

export function buildMushroomSafetyNote(safetyNote: string) {
  const warning = "Never use this app result to decide whether a mushroom is safe to eat.";
  return safetyNote.includes(warning) ? safetyNote : `${safetyNote} ${warning}`.trim();
}
