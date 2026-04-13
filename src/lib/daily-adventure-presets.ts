export const dailyAdventurePresetKeys = [
  "animal",
  "plant",
  "fish",
  "smithsonian",
  "quick",
  "rainy",
  "backyard",
  "weekend",
  "bird"
] as const;

export type DailyAdventurePresetKey = (typeof dailyAdventurePresetKeys)[number];

export type DailyAdventurePreset = {
  key: DailyAdventurePresetKey;
  label: string;
  shortLabel: string;
  subtitle: string;
  promptFocus: string[];
  titlePrefix: string;
  contentTemplate: "animal" | "bird" | "plant" | "fish" | "general" | "smithsonian";
  themeBinding: null | "animal" | "bird" | "plant" | "fish";
  generatorType:
    | "themedMissionGenerator"
    | "balancedAdventureGenerator"
    | "quickMissionGenerator"
    | "rainyDayGenerator"
    | "backyardGenerator"
    | "weekendPlannerGenerator"
    | "museumMissionGenerator";
  audienceModes: Array<"student" | "household">;
  weatherSensitivity: "low" | "medium" | "high";
  searchRadiusMode: "local" | "weekend_regional" | "destination";
};

export const dailyAdventurePresets: Record<DailyAdventurePresetKey, DailyAdventurePreset> = {
  animal: {
    key: "animal",
    label: "Animal mission",
    shortLabel: "Animal",
    subtitle: "Tracks, movement, habitat, and field signs",
    titlePrefix: "Animal Mission",
    contentTemplate: "animal",
    themeBinding: "animal",
    generatorType: "themedMissionGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "medium",
    searchRadiusMode: "local",
    promptFocus: [
      "Make a land-animal field mission the clear center of the plan.",
      "Focus on tracks, sign, movement, calls, feeding, shelter, or habitat clues.",
      "Do not turn this into a fishing or water-first outing unless water edges help observe the featured animal.",
      "Use a practical parent-friendly mission with clear clues to notice outdoors."
    ]
  },
  plant: {
    key: "plant",
    label: "Plant-focused mission",
    shortLabel: "Plant",
    subtitle: "Leaves, bark, flowers, seeds, and habitat clues",
    titlePrefix: "Plant Mission",
    contentTemplate: "plant",
    themeBinding: "plant",
    generatorType: "themedMissionGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "medium",
    searchRadiusMode: "local",
    promptFocus: [
      "Make a plant or tree identification mission the clear center of the plan.",
      "Emphasize leaf shape, bark, flowers, buds, seed pods, habitat, or seasonal plant clues.",
      "Do not use fishing language, fish species, or shoreline fishing advice unless the plant habitat truly depends on water edges.",
      "Keep the plan calm, observational, and practical for a family."
    ]
  },
  fish: {
    key: "fish",
    label: "Fish-focused mission",
    shortLabel: "Fish",
    subtitle: "Water access, aquatic signs, and shoreline observation",
    titlePrefix: "Fish Mission",
    contentTemplate: "fish",
    themeBinding: "fish",
    generatorType: "themedMissionGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "high",
    searchRadiusMode: "local",
    promptFocus: [
      "Make the mission clearly fish or aquatic-life focused.",
      "Emphasize shoreline, water movement, bait clues, fish habitat, or aquatic observation.",
      "If actual fishing is not practical, make it an aquatic field study rather than a generic nature walk.",
      "Gear and challenge language should feel connected to fishing or aquatic exploration."
    ]
  },
  smithsonian: {
    key: "smithsonian",
    label: "Smithsonian Museum Mission",
    shortLabel: "Smithsonian",
    subtitle: "DC museum field guide, scavenger hunt, and family talking prompts",
    titlePrefix: "Smithsonian Mission",
    contentTemplate: "smithsonian",
    themeBinding: null,
    generatorType: "museumMissionGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "low",
    searchRadiusMode: "destination",
    promptFocus: [
      "Make this a premium Smithsonian museum mission rather than a generic field trip.",
      "Use selected museum stops, student ages, interests, and available time to prioritize exhibits and pacing.",
      "Include scavenger-hunt style tasks, observation prompts, fun challenge items, and clear parent talking points.",
      "If history or culture is involved, include balanced age-appropriate perspective prompts that help families compare viewpoints respectfully.",
      "Do not fake live event data. Use a same-day arrival note for special exhibits if live data is not available."
    ]
  },
  quick: {
    key: "quick",
    label: "15-minute quick mission",
    shortLabel: "Quick mission",
    subtitle: "Fast outdoor reset with almost no setup",
    titlePrefix: "Quick Mission",
    contentTemplate: "general",
    themeBinding: null,
    generatorType: "quickMissionGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "medium",
    searchRadiusMode: "local",
    promptFocus: [
      "Keep the plan to about 15 minutes total.",
      "Use minimal gear and almost no setup.",
      "Center the plan on an immediate outdoor observation that can happen near the door.",
      "Make the challenge simple, concrete, and easy to finish right away.",
      "Avoid travel and avoid suggesting specialty equipment."
    ]
  },
  rainy: {
    key: "rainy",
    label: "Rainy day plan",
    shortLabel: "Rainy day",
    subtitle: "Indoor or covered nature learning first",
    titlePrefix: "Rainy Day",
    contentTemplate: "general",
    themeBinding: null,
    generatorType: "rainyDayGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "high",
    searchRadiusMode: "local",
    promptFocus: [
      "Make this a rainy-day-first plan.",
      "Prefer indoor, porch, window, or covered-space observation.",
      "Do not require extended outdoor time.",
      "The challenge should feel practical for a family stuck at home.",
      "The fallback plan should be the primary version, not an afterthought."
    ]
  },
  backyard: {
    key: "backyard",
    label: "Backyard nature",
    shortLabel: "Backyard",
    subtitle: "No-travel observation and journaling",
    titlePrefix: "Backyard Nature",
    contentTemplate: "general",
    themeBinding: null,
    generatorType: "backyardGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "medium",
    searchRadiusMode: "local",
    promptFocus: [
      "Make the plan work at home, in a backyard, driveway edge, porch, or very nearby patch of nature.",
      "Do not require travel.",
      "Emphasize noticing, tracking, and journaling over a big excursion.",
      "Use common household or backyard items only."
    ]
  },
  weekend: {
    key: "weekend",
    label: "Big weekend adventure",
    shortLabel: "Weekend adventure",
    subtitle: "Longer outing with stronger field-trip energy",
    titlePrefix: "Weekend Adventure",
    contentTemplate: "general",
    themeBinding: null,
    generatorType: "weekendPlannerGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "high",
    searchRadiusMode: "weekend_regional",
    promptFocus: [
      "Make this feel like a richer weekend field outing.",
      "Allow more time, more gear, and a stronger exploration arc.",
      "The mission should feel like a real destination-based nature experience.",
      "Include an optional field trip or local place type when useful."
    ]
  },
  bird: {
    key: "bird",
    label: "Bird-focused mission",
    shortLabel: "Bird focus",
    subtitle: "Observation, calls, behavior, and habitat",
    titlePrefix: "Bird Mission",
    contentTemplate: "bird",
    themeBinding: "bird",
    generatorType: "themedMissionGenerator",
    audienceModes: ["student", "household"],
    weatherSensitivity: "medium",
    searchRadiusMode: "local",
    promptFocus: [
      "Make birds the central focus.",
      "Emphasize looking for bird behavior, calls, flight patterns, nests, perches, or habitat clues.",
      "Make binoculars and a field journal feel relevant if appropriate.",
      "The discussion question should be about bird behavior or habitat."
    ]
  },
};

export function getDailyAdventurePreset(value?: string | null) {
  if (!value) return null;
  if (value === "fishing") return dailyAdventurePresets.fish;
  return dailyAdventurePresets[value as DailyAdventurePresetKey] ?? null;
}
