import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import type { StudentAchievementRecord, StudentBadgeRecord } from "@/lib/badges";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { generationKindLabel, type GenerationRecord } from "@/lib/generations";
import type { StudentRecord } from "@/lib/students";

export type PortfolioNoteRecord = {
  id: string;
  user_id: string;
  household_id?: string;
  student_id: string;
  related_completion_id: string | null;
  related_generation_id: string | null;
  note: string;
  created_at: string;
};

export type PortfolioRangeKey = "7d" | "30d" | "month" | "custom";

export type PortfolioRange = {
  key: PortfolioRangeKey;
  startDate: string;
  endDate: string;
  label: string;
};

export type PortfolioOverviewCard = {
  student: StudentRecord;
  completionCount: number;
  badgeCount: number;
  classCount: number;
  recentActivityTitle: string | null;
};

export function getPortfolioRange(params: {
  range?: string;
  start?: string;
  end?: string;
}): PortfolioRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = today.toISOString().slice(0, 10);

  if (params.range === "custom" && params.start && params.end) {
    return {
      key: "custom",
      startDate: params.start,
      endDate: params.end,
      label: `${formatDateLabel(params.start)} to ${formatDateLabel(params.end)}`
    };
  }

  if (params.range === "month") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    return {
      key: "month",
      startDate: firstDay,
      endDate,
      label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(today)
    };
  }

  if (params.range === "30d") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    const value = startDate.toISOString().slice(0, 10);
    return {
      key: "30d",
      startDate: value,
      endDate,
      label: `Last 30 days (${formatDateLabel(value)} to ${formatDateLabel(endDate)})`
    };
  }

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 6);
  const value = startDate.toISOString().slice(0, 10);
  return {
    key: "7d",
    startDate: value,
    endDate,
    label: `Last 7 days (${formatDateLabel(value)} to ${formatDateLabel(endDate)})`
  };
}

export function isWithinRange(value: string, range: PortfolioRange) {
  const date = value.slice(0, 10);
  return date >= range.startDate && date <= range.endDate;
}

export function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function getCompletionLabel(activityType: ActivityCompletionRecord["activity_type"]) {
  switch (activityType) {
    case "daily_adventure":
      return "Daily Adventure";
    case "animal_of_the_day":
      return "Animal Study";
    case "nature_discovery":
      return "Nature Discovery";
    case "week_planner":
      return "Week Plan";
    case "lesson_generator":
      return "Lesson";
    case "in_person_class":
      return "In-Person Class";
    case "field_quest":
      return "Field Quest";
    default:
      return activityType;
  }
}

export function summarizePortfolioNarrative(input: {
  student: StudentRecord;
  range: PortfolioRange;
  completions: ActivityCompletionRecord[];
  linkedGenerations: GenerationRecord[];
  badges: StudentBadgeRecord[];
  achievements: StudentAchievementRecord[];
  classBookings: Array<ClassBookingRecord & { classes?: ClassRecord | null }>;
}) {
  const { student, range, completions, linkedGenerations, badges, achievements, classBookings } = input;

  if (!completions.length && !badges.length && !classBookings.length) {
    return `${student.name} does not have completed portfolio activity recorded for ${range.label} yet. Add a note or mark an adventure complete to begin the learning record.`;
  }

  const counts = completions.reduce<Record<string, number>>((acc, item) => {
    acc[item.activity_type] = (acc[item.activity_type] ?? 0) + 1;
    return acc;
  }, {});

  const parts = [
    `${student.name} completed ${completions.length} learning activit${completions.length === 1 ? "y" : "ies"} during ${range.label}.`
  ];

  if (counts.daily_adventure) {
    parts.push(`${counts.daily_adventure} ${counts.daily_adventure === 1 ? "daily adventure" : "daily adventures"} were marked complete.`);
  }

  if (counts.animal_of_the_day) {
    parts.push(`${counts.animal_of_the_day} animal ${counts.animal_of_the_day === 1 ? "study was" : "studies were"} completed.`);
  }

  if (counts.nature_discovery) {
    parts.push(`${counts.nature_discovery} ${counts.nature_discovery === 1 ? "nature discovery was" : "nature discoveries were"} saved into the student record.`);
  }

  if (counts.lesson_generator || counts.week_planner) {
    const lessonCount = (counts.lesson_generator ?? 0) + (counts.week_planner ?? 0);
    parts.push(`${lessonCount} lesson-oriented ${lessonCount === 1 ? "plan was" : "plans were"} completed.`);
  }

  if (classBookings.length) {
    parts.push(`${student.name} attended ${classBookings.length} in-person ${classBookings.length === 1 ? "class" : "classes"}.`);
  }

  if (badges.length) {
    parts.push(`Badges earned in this period: ${badges.map((item) => item.badges?.name).filter(Boolean).join(", ")}.`);
  }

  if (achievements.length) {
    parts.push(`Recent milestones included ${achievements.map((item) => item.achievements?.name).filter(Boolean).join(", ")}.`);
  }

  if (linkedGenerations.length && !completions.length) {
    parts.push(`${linkedGenerations.length} student-linked generations were saved for follow-through.`);
  }

  return parts.join(" ");
}

export function filterPortfolioGenerations(
  generations: GenerationRecord[],
  completions: ActivityCompletionRecord[],
  range: PortfolioRange
) {
  const completionGenerationIds = new Set(
    completions.map((item) => item.generation_id).filter((value): value is string => Boolean(value))
  );

  return generations.filter((item) => !completionGenerationIds.has(item.id) && isWithinRange(item.created_at, range));
}

export function groupCompletedGenerations(completions: ActivityCompletionRecord[], generations: GenerationRecord[]) {
  const generationMap = new Map(generations.map((item) => [item.id, item]));

  return {
    dailyAdventures: completions.filter((item) => item.activity_type === "daily_adventure").map((item) => generationMap.get(item.generation_id ?? "")).filter(Boolean) as GenerationRecord[],
    animalStudies: completions.filter((item) => item.activity_type === "animal_of_the_day").map((item) => generationMap.get(item.generation_id ?? "")).filter(Boolean) as GenerationRecord[],
    lessons: completions.filter((item) => item.activity_type === "lesson_generator").map((item) => generationMap.get(item.generation_id ?? "")).filter(Boolean) as GenerationRecord[],
    weekPlans: completions.filter((item) => item.activity_type === "week_planner").map((item) => generationMap.get(item.generation_id ?? "")).filter(Boolean) as GenerationRecord[]
  };
}

export function summarizeOverviewCard(input: {
  student: StudentRecord;
  completions: ActivityCompletionRecord[];
  badges: StudentBadgeRecord[];
}) {
  return {
    student: input.student,
    completionCount: input.completions.length,
    badgeCount: input.badges.length,
    classCount: input.completions.filter((item) => item.activity_type === "in_person_class").length,
    recentActivityTitle: input.completions[0]?.title ?? null
  } satisfies PortfolioOverviewCard;
}

export function getGenerationBadgeLabel(generation: GenerationRecord) {
  return generationKindLabel(generation.tool_type);
}
