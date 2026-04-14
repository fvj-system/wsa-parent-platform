import type { SupabaseClient } from "@supabase/supabase-js";
import { getHouseholdContext } from "@/lib/households";
import { getRankForCompletedAdventures, type StudentRecord } from "@/lib/students";
import {
  normalizeStudentAchievementRows,
  normalizeStudentBadgeRows,
  type AchievementRecord,
  type BadgeRecord,
  type StudentAchievementRecord,
  type StudentBadgeRecord
} from "@/lib/badges";
import { getGenerationOutput, getGenerationSummary, type GenerationRecord } from "@/lib/generations";

type AwardStudentRewardsInput = {
  supabase: SupabaseClient;
  userId: string;
  student: StudentRecord;
  sourceCompletionId?: string | null;
};

type RewardSummary = {
  updatedStudent: StudentRecord;
  newBadges: BadgeRecord[];
  newAchievements: AchievementRecord[];
  recentBadge: BadgeRecord | null;
};

function flattenStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(flattenStrings);
  return [];
}

function getAdventureKeywordCounts(generations: GenerationRecord[]) {
  const counts = {
    bird: 0,
    river: 0,
    forest: 0,
    pond: 0,
    weather: 0,
    knot: 0,
    night: 0
  };

  for (const generation of generations) {
    const text = [generation.title, getGenerationSummary(generation), ...flattenStrings(getGenerationOutput(generation))]
      .join(" ")
      .toLowerCase();

    if (/(bird|owl|hawk|eagle|sparrow|robin|feather)/.test(text)) counts.bird += 1;
    if (/(river|stream|creek|water|shore|wetland)/.test(text)) counts.river += 1;
    if (/(forest|tree|woodland|pine|oak|trail)/.test(text)) counts.forest += 1;
    if (/(pond|frog|toad|amphibian|lily|tadpole)/.test(text)) counts.pond += 1;
    if (/(weather|cloud|rain|wind|storm|sunny|forecast|season)/.test(text)) counts.weather += 1;
    if (/(knot|rope|lash|cordage|shelter)/.test(text)) counts.knot += 1;
    if (/(night|moon|nocturnal|evening|sunset|owl)/.test(text)) counts.night += 1;
  }

  return counts;
}

type DiscoveryRecord = {
  id: string;
  completion_id: string | null;
  title: string;
  summary: string | null;
  artifact_json: {
    selectedCategory?: string;
    identification?: string;
    result?: {
      category?: string;
      possible_identification?: string;
    };
    location?: {
      label?: string;
    };
  } | null;
};

function getDiscoveryKeywordCounts(discoveries: DiscoveryRecord[]) {
  const counts = {
    total: discoveries.length,
    bird: 0,
    butterfly: 0,
    track: 0,
    leaf: 0,
    pond: 0
  };

  for (const discovery of discoveries) {
    const text = [
      discovery.title,
      discovery.summary ?? "",
      discovery.artifact_json?.selectedCategory ?? "",
      discovery.artifact_json?.identification ?? "",
      discovery.artifact_json?.result?.possible_identification ?? "",
      discovery.artifact_json?.result?.category ?? "",
      discovery.artifact_json?.location?.label ?? ""
    ]
      .join(" ")
      .toLowerCase();

    if (/(bird|sparrow|hawk|owl|eagle|heron|duck|robin|bluebird|woodpecker)/.test(text)) counts.bird += 1;
    if (/(bug|bugs|butterfly|moth|caterpillar|dragonfly|damselfly|bee|beetle|insect)/.test(text)) counts.butterfly += 1;
    if (/(track|tracks|trail sign|scat|print|hoof|paw|footprint|trace)/.test(text)) counts.track += 1;
    if (/(leaf|tree|trees|oak|maple|pine|fern|plant|plants|flower|bloom|seed|acorn|mushroom)/.test(text)) counts.leaf += 1;
    if (/(pond|wetland|amphibian|frog|toad|tadpole|salamander|water|creek|stream)/.test(text)) counts.pond += 1;
  }

  return counts;
}

function getEarnedBadgeNames(
  total: number,
  counts: ReturnType<typeof getAdventureKeywordCounts>,
  discoveryCounts: ReturnType<typeof getDiscoveryKeywordCounts>
) {
  const earned = new Set<string>();

  if (counts.bird >= 3) earned.add("Bird Tracker");
  if (counts.river >= 3) earned.add("River Explorer");
  if (counts.forest >= 3) earned.add("Forest Scout");
  if (counts.pond >= 3) earned.add("Pond Observer");
  if (counts.weather >= 3) earned.add("Weather Watcher");
  if (counts.knot >= 1) earned.add("Knot Apprentice");
  if (counts.night >= 1) earned.add("Night Naturalist");
  if (total >= 5) earned.add("Trail Explorer");
  if (discoveryCounts.total >= 1) earned.add("First Discovery");
  if (discoveryCounts.bird >= 3) earned.add("Bird Spotter");
  if (discoveryCounts.butterfly >= 3) earned.add("Butterfly Finder");
  if (discoveryCounts.track >= 3) earned.add("Track Detective");
  if (discoveryCounts.leaf >= 3) earned.add("Leaf Explorer");
  if (discoveryCounts.pond >= 3) earned.add("Pond Watcher");
  if (discoveryCounts.total >= 5) earned.add("Backyard Naturalist");

  return earned;
}

function getEarnedAchievementKeys(
  total: number,
  counts: ReturnType<typeof getAdventureKeywordCounts>,
  discoveryCounts: ReturnType<typeof getDiscoveryKeywordCounts>,
  studentGenerations: GenerationRecord[],
  badgeCount: number,
  completionTypes: string[]
) {
  const earned = new Set<string>();

  if (total >= 1) earned.add("first_adventure");
  if (total >= 5) earned.add("five_adventures");
  if (total >= 10) earned.add("ten_adventures");
  if (counts.bird >= 1) earned.add("first_bird_study");
  if (
    studentGenerations.some((item) => {
      const output = getGenerationOutput(item) ?? {};
      return Boolean(
        typeof output === "object" &&
          output &&
          ("journalPrompt" in output || "natureJournalPrompt" in output)
      );
    })
  ) {
    earned.add("first_journal_reflection");
  }
  if (studentGenerations.some((item) => item.tool_type === "lesson" || item.tool_type === "week_plan")) earned.add("first_printable_lesson");
  if (studentGenerations.some((item) => item.tool_type === "week_plan")) earned.add("completed_week_plan");
  if (completionTypes.includes("in_person_class")) earned.add("first_in_person_class");
  if (discoveryCounts.total >= 1) earned.add("first_discovery");
  if (badgeCount >= 1) earned.add("earned_first_badge");

  return earned;
}

export async function awardStudentRewards({ supabase, userId, student, sourceCompletionId }: AwardStudentRewardsInput): Promise<RewardSummary> {
  const householdId =
    student.household_id ?? (await getHouseholdContext(supabase, userId)).householdId;

  const { data: completionLinks, error: completionError } = await supabase
    .from("activity_completions")
    .select("id, generation_id, activity_type")
    .eq("household_id", householdId)
    .eq("student_id", student.id);

  if (completionError) throw new Error(completionError.message);

  const completionRows = completionLinks ?? [];
  const completionTypes = completionRows.map((item) => item.activity_type);
  const generationIds = completionRows.map((item) => item.generation_id).filter((value): value is string => Boolean(value));
  const discoveryCompletionIds = completionRows
    .filter((item) => item.activity_type === "nature_discovery")
    .map((item) => item.id);
  let completedGenerations: GenerationRecord[] = [];
  let discoveries: DiscoveryRecord[] = [];

  if (generationIds.length) {
    const { data, error } = await supabase
      .from("generations")
      .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
      .in("id", generationIds);

    if (error) throw new Error(error.message);
    completedGenerations = (data ?? []) as GenerationRecord[];
  }

  if (discoveryCompletionIds.length) {
    const { data, error } = await supabase
      .from("portfolio_entries")
      .select("id, completion_id, title, summary, artifact_json")
      .eq("student_id", student.id)
      .in("completion_id", discoveryCompletionIds);

    if (error) throw new Error(error.message);
    discoveries = (data ?? []) as DiscoveryRecord[];
  }

  const total = completionRows.filter((item) => item.activity_type !== "in_person_class").length;
  const keywordCounts = getAdventureKeywordCounts(completedGenerations);
  const discoveryCounts = getDiscoveryKeywordCounts(discoveries);
  const earnedBadgeNames = getEarnedBadgeNames(total, keywordCounts, discoveryCounts);

  const [{ data: badgeCatalog, error: badgeError }, { data: existingBadges, error: existingBadgesError }] = await Promise.all([
    supabase.from("badges").select("id, name, description, category, icon, criteria_json, created_at"),
    supabase
      .from("student_badges")
      .select("id, student_id, badge_id, earned_at, source_completion_id, created_at, badges:badges(id, name, description, category, icon, criteria_json, created_at)")
      .eq("student_id", student.id)
  ]);

  if (badgeError) throw new Error(badgeError.message);
  if (existingBadgesError) throw new Error(existingBadgesError.message);

  const badges = (badgeCatalog ?? []) as BadgeRecord[];
  const currentStudentBadges = normalizeStudentBadgeRows(existingBadges ?? []) as StudentBadgeRecord[];
  const existingBadgeIds = new Set(currentStudentBadges.map((item) => item.badge_id));
  const newBadgeRows = badges.filter((badge) => earnedBadgeNames.has(badge.name) && !existingBadgeIds.has(badge.id));

  if (newBadgeRows.length) {
    const { error } = await supabase.from("student_badges").insert(
      newBadgeRows.map((badge) => ({
        student_id: student.id,
        badge_id: badge.id,
        source_completion_id: sourceCompletionId ?? null
      }))
    );

    if (error) throw new Error(error.message);
  }

  const earnedAchievementKeys = getEarnedAchievementKeys(
    total,
    keywordCounts,
    discoveryCounts,
    completedGenerations,
    currentStudentBadges.length + newBadgeRows.length,
    completionTypes
  );
  const [{ data: achievementCatalog, error: achievementError }, { data: existingAchievements, error: existingAchievementsError }] = await Promise.all([
    supabase.from("achievements").select("id, key, name, description, earning_criteria, created_at"),
    supabase
      .from("student_achievements")
      .select("id, user_id, student_id, achievement_id, earned_at, achievements:achievements(id, key, name, description, earning_criteria, created_at)")
      .eq("household_id", householdId)
      .eq("student_id", student.id)
  ]);

  if (achievementError) throw new Error(achievementError.message);
  if (existingAchievementsError) throw new Error(existingAchievementsError.message);

  const achievements = (achievementCatalog ?? []) as AchievementRecord[];
  const currentAchievements = normalizeStudentAchievementRows(existingAchievements ?? []) as StudentAchievementRecord[];
  const existingAchievementIds = new Set(currentAchievements.map((item) => item.achievement_id));
  const newAchievementRows = achievements.filter(
    (achievement) => earnedAchievementKeys.has(achievement.key) && !existingAchievementIds.has(achievement.id)
  );

  if (newAchievementRows.length) {
    const { error } = await supabase.from("student_achievements").insert(
      newAchievementRows.map((achievement) => ({
        user_id: userId,
        household_id: householdId,
        student_id: student.id,
        achievement_id: achievement.id
      }))
    );

    if (error) throw new Error(error.message);
  }

  const updatedStudent = {
    ...student,
    completed_adventures_count: total,
    current_rank: getRankForCompletedAdventures(total)
  } satisfies StudentRecord;

  const { error: studentUpdateError } = await supabase
    .from("students")
    .update({
      completed_adventures_count: updatedStudent.completed_adventures_count,
      current_rank: updatedStudent.current_rank
    })
    .eq("household_id", householdId)
    .eq("id", student.id);

  if (studentUpdateError) throw new Error(studentUpdateError.message);

  return {
    updatedStudent,
    newBadges: newBadgeRows,
    newAchievements: newAchievementRows,
    recentBadge: newBadgeRows[0] ?? null
  };
}
