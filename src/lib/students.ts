import { z } from "zod";

export const rankLevels = ["Colt", "Bronco", "Mustang", "Stallion"] as const;
export type StudentRank = (typeof rankLevels)[number];
export const readingLevelOptions = [
  "just starting",
  "knows letter sounds",
  "knows simple words (3-5 letters)",
  "knows more complex words (5-12 letters)",
  "reads small books with a little help",
  "reads small books without help",
  "reads any book with some help",
  "reads any book without help"
] as const;
export type StudentReadingLevel = (typeof readingLevelOptions)[number];
export const defaultStudentReadingLevel: StudentReadingLevel = "reads small books with a little help";

export type StudentRecord = {
  id: string;
  user_id: string;
  household_id?: string;
  name: string;
  age: number;
  interests: string[];
  reading_level?: StudentReadingLevel | null;
  current_rank: StudentRank;
  completed_adventures_count: number;
  created_at: string;
  updated_at: string;
};

export type StudentAdventureCompletion = {
  id: string;
  student_id: string;
  generation_id: string;
  completed_at: string;
};

export type StudentProgressMilestone = {
  currentRank: StudentRank;
  nextRank: StudentRank | null;
  completedInRank: number;
  totalNeededForNextRank: number | null;
};

export const createStudentSchema = z.object({
  name: z.string().trim().min(1).max(80),
  age: z.coerce.number().int().min(3).max(18),
  interests: z.string().trim().max(240),
  readingLevel: z.enum(readingLevelOptions).default(defaultStudentReadingLevel)
});

export const updateStudentReadingLevelSchema = z.object({
  readingLevel: z.enum(readingLevelOptions)
});

export const completeAdventureSchema = z.object({
  studentId: z.string().uuid(),
  generationId: z.string().uuid()
});

export function parseInterests(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function normalizeStudentReadingLevel(value: string | null | undefined): StudentReadingLevel {
  return readingLevelOptions.find((option) => option === value) ?? defaultStudentReadingLevel;
}

export function getRankForCompletedAdventures(count: number): StudentRank {
  if (count >= 30) return "Stallion";
  if (count >= 15) return "Mustang";
  if (count >= 5) return "Bronco";
  return "Colt";
}

export function getBadgesForCompletedAdventures(count: number) {
  const badges: string[] = [];

  if (count >= 1) badges.push("First Trail");
  if (count >= 3) badges.push("Nature Noticer");
  if (count >= 6) badges.push("Trail Tracker");
  if (count >= 10) badges.push("Wild Stallion");

  return badges;
}

export function getRankDescription(rank: StudentRank) {
  switch (rank) {
    case "Colt":
      return "Just getting started and building confidence with outdoor learning.";
    case "Bronco":
      return "Growing stronger with steady adventure habits and new discoveries.";
    case "Mustang":
      return "Leading with curiosity, stamina, and a real feel for the outdoors.";
    case "Stallion":
      return "A seasoned explorer with a strong trail of completed adventures.";
    default:
      return "";
  }
}

export function getRankProgress(count: number): StudentProgressMilestone {
  if (count >= 30) {
    return {
      currentRank: "Stallion",
      nextRank: null,
      completedInRank: count - 30,
      totalNeededForNextRank: null
    };
  }

  if (count >= 15) {
    return {
      currentRank: "Mustang",
      nextRank: "Stallion",
      completedInRank: count - 15,
      totalNeededForNextRank: 15
    };
  }

  if (count >= 5) {
    return {
      currentRank: "Bronco",
      nextRank: "Mustang",
      completedInRank: count - 5,
      totalNeededForNextRank: 10
    };
  }

  return {
    currentRank: "Colt",
    nextRank: "Bronco",
    completedInRank: count,
    totalNeededForNextRank: 5
  };
}
