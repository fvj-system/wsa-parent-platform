import { z } from "zod";
import { milesBetweenPoints, type ResolvedLocationContext } from "@/lib/context/nearby-spots";

export const fieldQuestStatuses = ["draft", "published", "archived"] as const;
export type FieldQuestStatus = (typeof fieldQuestStatuses)[number];

export const fieldQuestDifficultyLevels = ["easy", "moderate", "challenging"] as const;
export type FieldQuestDifficultyLevel = (typeof fieldQuestDifficultyLevels)[number];

export const fieldQuestFilters = [
  "nearby",
  "backyard",
  "park",
  "creek",
  "history",
  "animal",
  "young-kids",
] as const;

export type FieldQuestFilter = (typeof fieldQuestFilters)[number];

export const fieldQuestEventTypes = [
  "page_view",
  "start",
  "completion",
  "signup_click",
  "signup_completed",
  "class_click",
  "app_open_click",
] as const;

export type FieldQuestEventType = (typeof fieldQuestEventTypes)[number];

export type FieldQuestChecklistItem = {
  id: string;
  label: string;
};

export type FieldQuestRecord = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  location_type: string;
  exact_location: string | null;
  state_code: string | null;
  county_name: string | null;
  latitude: number | null;
  longitude: number | null;
  difficulty_level: FieldQuestDifficultyLevel;
  estimated_time: string;
  age_range: string;
  subject_tags: string[];
  checklist_json: unknown;
  clue_text: string | null;
  requires_photo: boolean;
  requires_note: boolean;
  badge_name: string;
  badge_description: string;
  linked_class_id: string | null;
  is_backyard_friendly: boolean;
  is_park_quest: boolean;
  is_creek_water: boolean;
  is_history: boolean;
  is_animal: boolean;
  is_easy_young_kids: boolean;
  status: FieldQuestStatus;
  created_at: string;
  updated_at: string;
};

export type FieldQuestCompletionRecord = {
  id: string;
  quest_id: string;
  user_id: string;
  household_id: string;
  student_id: string;
  status: "completed";
  checklist_progress: unknown;
  note: string | null;
  photo_path: string | null;
  photo_url: string | null;
  completed_at: string;
  created_at: string;
  updated_at: string;
};

export type FieldQuestEventRecord = {
  id: string;
  quest_id: string | null;
  event_type: FieldQuestEventType;
  created_at: string;
};

export type FieldQuestWithDistance = FieldQuestRecord & {
  distance_miles: number | null;
};

export const fieldQuestAdminSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(3).max(160),
  short_description: z.string().trim().min(12).max(220),
  description: z.string().trim().min(20).max(2400),
  location_type: z.string().trim().min(3).max(120),
  exact_location: z.string().trim().max(240).optional().default(""),
  state_code: z.string().trim().max(8).optional().default(""),
  county_name: z.string().trim().max(80).optional().default(""),
  difficulty_level: z.enum(fieldQuestDifficultyLevels),
  estimated_time: z.string().trim().min(3).max(80),
  age_range: z.string().trim().min(2).max(80),
  subject_tags: z.string().trim().max(400).optional().default(""),
  checklist_lines: z.string().trim().min(3).max(2000),
  clue_text: z.string().trim().max(1200).optional().default(""),
  requires_photo: z.boolean().optional().default(false),
  requires_note: z.boolean().optional().default(false),
  badge_name: z.string().trim().min(3).max(120),
  badge_description: z.string().trim().min(8).max(240),
  linked_class_id: z.string().uuid().optional().or(z.literal("")).default(""),
  is_backyard_friendly: z.boolean().optional().default(false),
  is_park_quest: z.boolean().optional().default(false),
  is_creek_water: z.boolean().optional().default(false),
  is_history: z.boolean().optional().default(false),
  is_animal: z.boolean().optional().default(false),
  is_easy_young_kids: z.boolean().optional().default(false),
  status: z.enum(fieldQuestStatuses),
});

export const fieldQuestCompletionSchema = z.object({
  studentId: z.string().uuid(),
  checkedStepIds: z.array(z.string().trim().min(1)).min(1),
  note: z.string().trim().max(2000).optional().default(""),
});

export const fieldQuestEventSchema = z.object({
  questId: z.string().uuid().optional(),
  questSlug: z.string().trim().min(1).optional(),
  eventType: z.enum(fieldQuestEventTypes),
  studentId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
});

export function getFieldQuestSelect() {
  return [
    "id",
    "slug",
    "title",
    "short_description",
    "description",
    "location_type",
    "exact_location",
    "state_code",
    "county_name",
    "latitude",
    "longitude",
    "difficulty_level",
    "estimated_time",
    "age_range",
    "subject_tags",
    "checklist_json",
    "clue_text",
    "requires_photo",
    "requires_note",
    "badge_name",
    "badge_description",
    "linked_class_id",
    "is_backyard_friendly",
    "is_park_quest",
    "is_creek_water",
    "is_history",
    "is_animal",
    "is_easy_young_kids",
    "status",
    "created_at",
    "updated_at",
  ].join(", ");
}

export function slugifyFieldQuestTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function parseFieldQuestTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function parseFieldQuestChecklist(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((label, index) => ({
      id: `step-${index + 1}`,
      label,
    }));
}

export function normalizeFieldQuestChecklistItems(value: unknown): FieldQuestChecklistItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { id?: unknown; label?: unknown };
      const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : `step-${index + 1}`;
      const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
      if (!label) return null;
      return { id, label };
    })
    .filter((item): item is FieldQuestChecklistItem => Boolean(item));
}

export function getFieldQuestLocationLabel(quest: Pick<FieldQuestRecord, "exact_location" | "location_type" | "county_name" | "state_code">) {
  const exact = quest.exact_location?.trim();
  if (exact) return exact;
  const county = quest.county_name?.trim();
  const state = quest.state_code?.trim();
  if (county && state) return `${quest.location_type} · ${county} County, ${state}`;
  return quest.location_type;
}

export function getFieldQuestFilterLabel(filter: FieldQuestFilter) {
  switch (filter) {
    case "nearby":
      return "Nearby";
    case "backyard":
      return "Backyard friendly";
    case "park":
      return "Park quest";
    case "creek":
      return "Creek / water quest";
    case "history":
      return "History quest";
    case "animal":
      return "Animal quest";
    case "young-kids":
      return "Easy for young kids";
  }
}

export function matchesFieldQuestFilter(
  quest: FieldQuestWithDistance,
  filter: FieldQuestFilter,
  nearbyRadius = 75,
) {
  switch (filter) {
    case "nearby":
      return typeof quest.distance_miles === "number" && quest.distance_miles <= nearbyRadius;
    case "backyard":
      return quest.is_backyard_friendly;
    case "park":
      return quest.is_park_quest;
    case "creek":
      return quest.is_creek_water;
    case "history":
      return quest.is_history;
    case "animal":
      return quest.is_animal;
    case "young-kids":
      return quest.is_easy_young_kids;
  }
}

export function attachFieldQuestDistances(
  quests: FieldQuestRecord[],
  location: ResolvedLocationContext,
): FieldQuestWithDistance[] {
  return quests.map((quest) => ({
    ...quest,
    distance_miles:
      location.latitude !== null && location.longitude !== null
        ? (() => {
            const distance = milesBetweenPoints(
              location.latitude,
              location.longitude,
              quest.latitude,
              quest.longitude,
            );
            return typeof distance === "number"
              ? Math.round(distance * 10) / 10
              : null;
          })()
        : null,
  }));
}

export function buildFieldQuestEvidenceSummary(
  quest: FieldQuestRecord,
  checklistItems: FieldQuestChecklistItem[],
) {
  const subjectText = quest.subject_tags.length ? quest.subject_tags.join(", ") : "outdoor learning";
  const stepSummary = checklistItems.slice(0, 3).map((item) => item.label).join("; ");
  return `${quest.title} supported ${subjectText}. Key steps included ${stepSummary}.`;
}

export function buildFieldQuestCompletionNotes(
  quest: FieldQuestRecord,
  checklistItems: FieldQuestChecklistItem[],
  note: string,
) {
  const base = [
    `Field Quest subjects: ${quest.subject_tags.join(", ") || "outdoor learning"}.`,
    checklistItems.length
      ? `Checklist completed: ${checklistItems.map((item) => item.label).join(" | ")}.`
      : "",
    note.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return base.slice(0, 600);
}

export function buildFieldQuestBadgeCriteria(quest: FieldQuestRecord) {
  return {
    source: "field_quest",
    questId: quest.id,
    questSlug: quest.slug,
  };
}
