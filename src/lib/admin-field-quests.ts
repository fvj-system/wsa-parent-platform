import {
  fieldQuestAdminSchema,
  parseFieldQuestChecklist,
  parseFieldQuestTags,
} from "@/lib/field-quests";
import { z } from "zod";

export function buildAdminFieldQuestPayload(input: z.infer<typeof fieldQuestAdminSchema>) {
  return {
    slug: input.slug,
    title: input.title,
    short_description: input.short_description,
    description: input.description,
    location_type: input.location_type,
    exact_location: input.exact_location || null,
    state_code: input.state_code || null,
    county_name: input.county_name || null,
    difficulty_level: input.difficulty_level,
    estimated_time: input.estimated_time,
    age_range: input.age_range,
    subject_tags: parseFieldQuestTags(input.subject_tags),
    checklist_json: parseFieldQuestChecklist(input.checklist_lines),
    clue_text: input.clue_text || null,
    requires_photo: input.requires_photo,
    requires_note: input.requires_note,
    badge_name: input.badge_name,
    badge_description: input.badge_description,
    linked_class_id: input.linked_class_id || null,
    is_backyard_friendly: input.is_backyard_friendly,
    is_park_quest: input.is_park_quest,
    is_creek_water: input.is_creek_water,
    is_history: input.is_history,
    is_animal: input.is_animal,
    is_easy_young_kids: input.is_easy_young_kids,
    status: input.status,
  };
}
