import { z } from "zod";
import { dailyAdventurePresetKeys } from "@/lib/daily-adventure-presets";
import { getRegulationStatusLabel } from "@/lib/regulations/types";
import { smithsonianMuseumKeys } from "@/lib/smithsonian-museums";
import { readingLevelOptions } from "@/lib/students";

export const generationKinds = [
  "lesson",
  "animal_of_the_day",
  "bird_of_the_day",
  "plant_of_the_day",
  "fish_of_the_day",
  "week_plan",
  "daily_adventure"
] as const;
export type GenerationKind = (typeof generationKinds)[number];

export const animalInputSchema = z.object({
  animalName: z.string().trim().min(1).max(80),
  childAge: z.coerce.number().int().min(3).max(18),
  studentId: z.string().uuid().optional(),
  studentName: z.string().trim().min(1).max(80).optional(),
  locationLabel: z.string().trim().min(2).max(120).default("Southern Maryland"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMiles: z.coerce.number().int().min(1).max(50).default(10),
  weatherCondition: z.string().trim().max(60).default("clear")
});

export const recommendedSpotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  spotType: z.string().min(1),
  waterType: z.string().nullable(),
  locationLabel: z.string().min(1),
  distanceMiles: z.number().nullable(),
  description: z.string().min(1),
  reason: z.string().min(1),
  familyFriendly: z.boolean(),
  recommendedUseToday: z.string().min(1),
  accessNote: z.string().min(1),
  mapUrl: z.string().url(),
  linkLabel: z.string().min(1).optional()
});

export const speciesGalleryImageSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().min(1)
});

export const animalOutputSchema = z.object({
  animalName: z.string().min(1),
  scientificName: z.string().min(1).optional(),
  funFacts: z.array(z.string().min(1)).min(3).max(5),
  habitat: z.string().min(1),
  diet: z.string().min(1),
  tracksAndSign: z.string().min(1),
  kidChallenge: z.string().min(1),
  drawingPrompt: z.string().min(1),
  journalPrompt: z.string().min(1),
  safetyNote: z.string().min(1),
  facebookCaption: z.string().min(1),
  printableSummary: z.string().min(1),
  imageUrl: z.string().min(1).optional(),
  imageAlt: z.string().min(1).optional(),
  guideImageUrl: z.string().min(1).optional(),
  guideImageAlt: z.string().min(1).optional(),
  quickIdTip: z.string().min(1).optional(),
  photoSource: z.string().min(1).optional(),
  images: z.array(speciesGalleryImageSchema).optional(),
  likelyHabitatType: z.string().optional(),
  bestNearbyPlaceType: z.string().optional(),
  whyThisPlaceFits: z.string().optional(),
  bestTimeWindow: z.string().optional(),
  whatToBring: z.array(z.string().min(1)).optional(),
  recommendedNearbySpots: z.array(recommendedSpotSchema).optional()
});

export const weekPlannerInputSchema = z.object({
  planningMode: z.enum(["student", "family"]).default("student"),
  childAge: z.coerce.number().int().min(3).max(18).optional(),
  selectedStudentIds: z.array(z.string().uuid()).default([]),
  selectedStudentNames: z.array(z.string().trim().min(1).max(80)).default([]),
  selectedStudentAges: z.array(z.coerce.number().int().min(3).max(18)).default([]),
  selectedStudentReadingLevels: z.array(z.enum(readingLevelOptions)).default([]),
  focusArea: z.string().trim().min(2).max(120),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  preferredLessonLength: z.string().trim().min(2).max(60),
  interests: z.string().trim().min(2).max(240),
  settingPreference: z.string().trim().min(2).max(80),
  locationLabel: z.string().trim().min(2).max(120).default("Southern Maryland"),
  homeZipcode: z.string().trim().max(10).optional()
});

export const dailyPlanItemSchema = z.object({
  dayLabel: z.string().min(1),
  focus: z.string().min(1),
  activities: z.array(z.string().min(1)).min(2).max(4)
});

export const plannerBookRecommendationSchema = z.object({
  label: z.string().min(1),
  author: z.string().trim().nullable(),
  readingLevelLabel: z.enum(readingLevelOptions),
  formatFit: z.string().min(1),
  whyItFits: z.string().min(1),
  librarySystem: z.string().trim().nullable(),
  libraryDirectoryUrl: z.string().trim().nullable(),
  libraryCatalogUrl: z.string().trim().nullable(),
  availabilityStatus: z.enum(["Available today", "In catalog", "May require a hold", "Check live availability"]),
  availabilityNote: z.string().min(1),
  libraryTip: z.string().min(1),
  catalogHint: z.string().min(1)
});

export const weekPlannerOutputSchema = z.object({
  weeklyOverview: z.string().min(1),
  dailyPlan: z.array(dailyPlanItemSchema).min(1).max(7),
  suggestedFieldTrips: z.array(z.string().min(1)).min(2).max(5),
  materialsList: z.array(z.string().min(1)).min(3).max(12),
  parentNotes: z.string().min(1),
  printableSummary: z.string().min(1),
  bookRecommendations: z.array(plannerBookRecommendationSchema).max(3).default([])
});

export const dailyAdventureInputSchema = z.object({
  requestDate: z.string().trim().min(1),
  plannerMode: z.enum(["standard", "advanced"]).default("standard"),
  targetType: z.enum(["student", "household"]).default("household"),
  targetId: z.string().uuid().optional(),
  householdMode: z.boolean().default(false),
  studentId: z.string().uuid().optional(),
  studentName: z.string().trim().min(1).max(80).optional(),
  studentAge: z.coerce.number().int().min(3).max(18).optional(),
  studentInterests: z.array(z.string().trim().min(1).max(80)).default([]),
  householdStudents: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(80),
        age: z.coerce.number().int().min(3).max(18),
        interests: z.array(z.string().trim().min(1).max(80)).default([]),
        readingLevel: z.enum(readingLevelOptions).optional()
      })
    )
    .default([]),
  preset: z.enum(dailyAdventurePresetKeys).optional(),
  museumKeys: z.array(z.enum(smithsonianMuseumKeys)).default([]),
  locationLabel: z.string().trim().min(2).max(120).default("Southern Maryland"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMiles: z.coerce.number().int().min(1).max(50).default(10),
  weatherCondition: z.string().trim().max(60).default("clear"),
  studentReadingLevel: z.enum(readingLevelOptions).optional(),
  homeZipcode: z.string().trim().max(10).optional(),
  selectedEventId: z.string().trim().min(1).max(120).optional(),
  timeAvailable: z.string().trim().min(1).max(40).optional(),
  budget: z.string().trim().min(1).max(40).optional(),
  energyLevel: z.string().trim().min(1).max(40).optional(),
  travelDistance: z.string().trim().min(1).max(40).optional(),
  targetFish: z.string().trim().min(1).max(80).optional(),
  planStyle: z.string().trim().min(1).max(60).optional(),
  mainGoal: z.string().trim().min(1).max(80).optional(),
  practicalNeeds: z.array(z.string().trim().min(1).max(60)).default([]),
  extraContext: z.string().trim().max(400).optional()
});

export type DailyAdventureOutput = {
  animalOfTheDay: string;
  morningQuestion: string;
  outdoorObservationActivity: string;
  natureJournalPrompt: string;
  discussionQuestion: string;
  challengeActivity: string;
  missionStops: string[];
  scavengerHuntTasks: string[];
  parentTalkingPoints: string[];
  specialExhibitNote: string | null;
  optionalFieldTripIdea: string | null;
  facebookCaption: string;
  bestTimeWindow: string | null;
  suggestedPlaceType: string | null;
  gearChecklist: string[];
  safetyNote: string | null;
  locationSummary: string | null;
  whyTheseSpotsWork: string | null;
  recommendedNearbySpots: Array<z.infer<typeof recommendedSpotSchema>>;
  fishingOutlook: string | null;
  likelySpecies: string[];
  fishingMainSpecies: string | null;
  fishingLiveBait: string | null;
  fishingArtificialBait: string | null;
  fishingBestPlace: string | null;
  fishingWhereToCast: string | null;
  fishingMainSpeciesDescription: string | null;
  fishingOtherLikelyFish: string[];
  fishOfTheDayImageUrl: string | null;
  fishOfTheDayImageAlt: string | null;
  liveBaitImageUrl: string | null;
  liveBaitImageAlt: string | null;
  artificialBaitImageUrl: string | null;
  artificialBaitImageAlt: string | null;
  bookRecommendation: z.infer<typeof plannerBookRecommendationSchema> | null;
  outingMode: string | null;
  fallbackPlan: string | null;
};

export const EMPTY_DAILY_ADVENTURE: DailyAdventureOutput = {
  animalOfTheDay: "",
  morningQuestion: "",
  outdoorObservationActivity: "",
  natureJournalPrompt: "",
  discussionQuestion: "",
  challengeActivity: "",
  missionStops: [],
  scavengerHuntTasks: [],
  parentTalkingPoints: [],
  specialExhibitNote: null,
  optionalFieldTripIdea: null,
  facebookCaption: "",
  bestTimeWindow: null,
  suggestedPlaceType: null,
  gearChecklist: [],
  safetyNote: null,
  locationSummary: null,
  whyTheseSpotsWork: null,
  recommendedNearbySpots: [],
  fishingOutlook: null,
  likelySpecies: [],
  fishingMainSpecies: null,
  fishingLiveBait: null,
  fishingArtificialBait: null,
  fishingBestPlace: null,
  fishingWhereToCast: null,
  fishingMainSpeciesDescription: null,
  fishingOtherLikelyFish: [],
  fishOfTheDayImageUrl: null,
  fishOfTheDayImageAlt: null,
  liveBaitImageUrl: null,
  liveBaitImageAlt: null,
  artificialBaitImageUrl: null,
  artificialBaitImageAlt: null,
  bookRecommendation: null,
  outingMode: null,
  fallbackPlan: null
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function coerceString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function coerceNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

export function coerceStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function coerceNearbySpots(value: unknown): DailyAdventureOutput["recommendedNearbySpots"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const parsed = recommendedSpotSchema.safeParse(item);
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is z.infer<typeof recommendedSpotSchema> => item !== null);
}

export function normalizeDailyAdventure(raw: unknown): DailyAdventureOutput {
  const source = isPlainObject(raw) ? raw : {};
  const bookRecommendation = plannerBookRecommendationSchema.safeParse(source.bookRecommendation);

  return {
    animalOfTheDay: coerceString(source.animalOfTheDay),
    morningQuestion: coerceString(source.morningQuestion),
    outdoorObservationActivity: coerceString(source.outdoorObservationActivity),
    natureJournalPrompt: coerceString(source.natureJournalPrompt),
    discussionQuestion: coerceString(source.discussionQuestion),
    challengeActivity: coerceString(source.challengeActivity),
    missionStops: coerceStringArray(source.missionStops),
    scavengerHuntTasks: coerceStringArray(source.scavengerHuntTasks),
    parentTalkingPoints: coerceStringArray(source.parentTalkingPoints),
    specialExhibitNote: coerceNullableString(source.specialExhibitNote),
    optionalFieldTripIdea: coerceNullableString(source.optionalFieldTripIdea),
    facebookCaption: coerceString(source.facebookCaption),
    bestTimeWindow: coerceNullableString(source.bestTimeWindow),
    suggestedPlaceType: coerceNullableString(source.suggestedPlaceType),
    gearChecklist: coerceStringArray(source.gearChecklist),
    safetyNote: coerceNullableString(source.safetyNote),
    locationSummary: coerceNullableString(source.locationSummary),
    whyTheseSpotsWork: coerceNullableString(source.whyTheseSpotsWork),
    recommendedNearbySpots: coerceNearbySpots(source.recommendedNearbySpots),
    fishingOutlook: coerceNullableString(source.fishingOutlook),
    likelySpecies: coerceStringArray(source.likelySpecies),
    fishingMainSpecies: coerceNullableString(source.fishingMainSpecies),
    fishingLiveBait: coerceNullableString(source.fishingLiveBait),
    fishingArtificialBait: coerceNullableString(source.fishingArtificialBait),
    fishingBestPlace: coerceNullableString(source.fishingBestPlace),
    fishingWhereToCast: coerceNullableString(source.fishingWhereToCast),
    fishingMainSpeciesDescription: coerceNullableString(source.fishingMainSpeciesDescription),
    fishingOtherLikelyFish: coerceStringArray(source.fishingOtherLikelyFish),
    fishOfTheDayImageUrl: coerceNullableString(source.fishOfTheDayImageUrl),
    fishOfTheDayImageAlt: coerceNullableString(source.fishOfTheDayImageAlt),
    liveBaitImageUrl: coerceNullableString(source.liveBaitImageUrl),
    liveBaitImageAlt: coerceNullableString(source.liveBaitImageAlt),
    artificialBaitImageUrl: coerceNullableString(source.artificialBaitImageUrl),
    artificialBaitImageAlt: coerceNullableString(source.artificialBaitImageAlt),
    bookRecommendation: bookRecommendation.success ? bookRecommendation.data : null,
    outingMode: coerceNullableString(source.outingMode),
    fallbackPlan: coerceNullableString(source.fallbackPlan)
  };
}

export function buildDailyAdventureOutput(raw: unknown): DailyAdventureOutput {
  return {
    ...EMPTY_DAILY_ADVENTURE,
    ...normalizeDailyAdventure(raw)
  };
}

const DAILY_ADVENTURE_REQUIRED_DEFAULTS = {
  animalOfTheDay: "Shoreline Scout Mission",
  morningQuestion: "What sign tells you this spot is worth your first cast or careful look today?",
  outdoorObservationActivity:
    "Work one practical family field mission with a clear target, a short observation window, and one useful thing to learn before heading home.",
  natureJournalPrompt:
    "Write down the best water, wildlife, or habitat clue you found first and how it changed your plan.",
  discussionQuestion:
    "Which clue from the bank, shoreline, or trail gave your family the clearest next move today?",
  challengeActivity:
    "Complete one short field challenge by testing a likely spot, comparing two habitat clues, and choosing the better option.",
  facebookCaption:
    "Wild Stallion Academy is heading out with a practical family field mission built for Southern Maryland waters and trails."
} satisfies Record<
  "animalOfTheDay" | "morningQuestion" | "outdoorObservationActivity" | "natureJournalPrompt" | "discussionQuestion" | "challengeActivity" | "facebookCaption",
  string
>;

function isWeakFishingValue(value: string | null | undefined) {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  return [
    "fish",
    "fishing",
    "local fish",
    "local game fish",
    "unknown",
    "n/a",
    "na",
    "none",
    "tbd",
    "varies"
  ].includes(normalized);
}

function isFishingAdventure(output: DailyAdventureOutput) {
  return (
    output.outingMode?.toLowerCase().includes("fish") === true ||
    output.suggestedPlaceType?.toLowerCase().includes("shore") === true ||
    output.suggestedPlaceType?.toLowerCase().includes("water") === true ||
    output.fishingOutlook !== null ||
    output.fishingMainSpecies !== null ||
    output.fishingLiveBait !== null ||
    output.fishingArtificialBait !== null ||
    output.fishingBestPlace !== null ||
    output.fishingWhereToCast !== null ||
    output.fishingMainSpeciesDescription !== null ||
    output.fishingOtherLikelyFish.length > 0 ||
    output.likelySpecies.length > 0
  );
}

export function applyFishingFallbacks(output: DailyAdventureOutput): DailyAdventureOutput {
  if (!isFishingAdventure(output)) {
    return output;
  }

  const likelySpecies = output.likelySpecies.length
    ? output.likelySpecies
    : output.fishingMainSpecies && !isWeakFishingValue(output.fishingMainSpecies)
      ? [output.fishingMainSpecies]
      : ["Bluegill", "White perch", "Largemouth bass"];

  const fishingMainSpecies =
    !isWeakFishingValue(output.fishingMainSpecies)
      ? output.fishingMainSpecies
      : likelySpecies[0] ?? "Bluegill";

  const otherLikelyFish = output.fishingOtherLikelyFish.length
    ? output.fishingOtherLikelyFish
    : likelySpecies.filter((species) => species !== fishingMainSpecies).slice(0, 4);

  return {
    ...output,
    fishingOutlook:
      !isWeakFishingValue(output.fishingOutlook)
        ? output.fishingOutlook
        : "Treat today as a simple Southern Maryland shoreline mission: fish low-light windows, target shade or current breaks, and move quickly if the water looks flat and lifeless.",
    likelySpecies,
    fishingMainSpecies,
    fishingLiveBait:
      !isWeakFishingValue(output.fishingLiveBait)
        ? output.fishingLiveBait
        : "Nightcrawlers under a float or small live minnows around cover.",
    fishingArtificialBait:
      !isWeakFishingValue(output.fishingArtificialBait)
        ? output.fishingArtificialBait
        : "A 1/16-ounce jig, small spinner, or compact soft plastic worked slowly near structure.",
    fishingBestPlace:
      !isWeakFishingValue(output.fishingBestPlace)
        ? output.fishingBestPlace
        : output.suggestedPlaceType
          ? `A ${output.suggestedPlaceType} with easy bank access, shade, and visible structure.`
          : "A protected shoreline, creek mouth, pond edge, or public fishing pier with easy family access.",
    fishingWhereToCast:
      !isWeakFishingValue(output.fishingWhereToCast)
        ? output.fishingWhereToCast
        : "Cast beside dock edges, brush, fallen trees, grass lines, riprap, or any seam where shallow water meets slightly deeper cover.",
    fishingMainSpeciesDescription:
      !isWeakFishingValue(output.fishingMainSpeciesDescription)
        ? output.fishingMainSpeciesDescription
        : `${fishingMainSpecies} often hold around cover, edges, and easy feeding lanes, so fish patiently around shade, structure, and calm pockets before moving on.`,
    fishingOtherLikelyFish: otherLikelyFish
  };
}

export const dailyAdventureOutputSchema = z.object({
  animalOfTheDay: z.string().trim().min(1),
  morningQuestion: z.string().trim().min(1),
  outdoorObservationActivity: z.string().trim().min(1),
  natureJournalPrompt: z.string().trim().min(1),
  discussionQuestion: z.string().trim().min(1),
  challengeActivity: z.string().trim().min(1),
  missionStops: z.array(z.string().trim().min(1)),
  scavengerHuntTasks: z.array(z.string().trim().min(1)),
  parentTalkingPoints: z.array(z.string().trim().min(1)),
  specialExhibitNote: z.string().trim().nullable(),
  optionalFieldTripIdea: z.string().trim().nullable(),
  facebookCaption: z.string().trim().min(1),
  bestTimeWindow: z.string().trim().nullable(),
  suggestedPlaceType: z.string().trim().nullable(),
  gearChecklist: z.array(z.string().trim().min(1)),
  safetyNote: z.string().trim().nullable(),
  locationSummary: z.string().trim().nullable(),
  whyTheseSpotsWork: z.string().trim().nullable(),
  recommendedNearbySpots: z.array(recommendedSpotSchema),
  fishingOutlook: z.string().trim().nullable(),
  likelySpecies: z.array(z.string().trim().min(1)),
  fishingMainSpecies: z.string().trim().nullable(),
  fishingLiveBait: z.string().trim().nullable(),
  fishingArtificialBait: z.string().trim().nullable(),
  fishingBestPlace: z.string().trim().nullable(),
  fishingWhereToCast: z.string().trim().nullable(),
  fishingMainSpeciesDescription: z.string().trim().nullable(),
  fishingOtherLikelyFish: z.array(z.string().trim().min(1)),
  fishOfTheDayImageUrl: z.string().trim().nullable(),
  fishOfTheDayImageAlt: z.string().trim().nullable(),
  liveBaitImageUrl: z.string().trim().nullable(),
  liveBaitImageAlt: z.string().trim().nullable(),
  artificialBaitImageUrl: z.string().trim().nullable(),
  artificialBaitImageAlt: z.string().trim().nullable(),
  bookRecommendation: plannerBookRecommendationSchema.nullable().default(null),
  outingMode: z.string().trim().nullable(),
  fallbackPlan: z.string().trim().nullable()
});

export function parseDailyAdventure(raw: unknown): DailyAdventureOutput {
  const merged = buildDailyAdventureOutput(raw);
  const withRequiredDefaults: DailyAdventureOutput = {
    ...merged,
    animalOfTheDay: merged.animalOfTheDay || DAILY_ADVENTURE_REQUIRED_DEFAULTS.animalOfTheDay,
    morningQuestion: merged.morningQuestion || DAILY_ADVENTURE_REQUIRED_DEFAULTS.morningQuestion,
    outdoorObservationActivity: merged.outdoorObservationActivity || DAILY_ADVENTURE_REQUIRED_DEFAULTS.outdoorObservationActivity,
    natureJournalPrompt: merged.natureJournalPrompt || DAILY_ADVENTURE_REQUIRED_DEFAULTS.natureJournalPrompt,
    discussionQuestion: merged.discussionQuestion || DAILY_ADVENTURE_REQUIRED_DEFAULTS.discussionQuestion,
    challengeActivity: merged.challengeActivity || DAILY_ADVENTURE_REQUIRED_DEFAULTS.challengeActivity,
    facebookCaption: merged.facebookCaption || DAILY_ADVENTURE_REQUIRED_DEFAULTS.facebookCaption
  };

  return dailyAdventureOutputSchema.parse(applyFishingFallbacks(withRequiredDefaults));
}

export const fishOutputSchema = z.object({
  fishName: z.string().min(1),
  scientificName: z.string().min(1).optional(),
  speciesSlug: z.string().min(1),
  waterType: z.string().min(1),
  broadExplanation: z.string().min(1),
  likelyHabitat: z.string().min(1),
  bestNearbyPlaceType: z.string().min(1),
  bestTimeWindow: z.string().min(1),
  fishingOutlook: z.string().min(1),
  bestUseOfOuting: z.string().min(1),
  likelyRelatedSpecies: z.array(z.string().min(1)).min(1).max(5),
  bestBeginnerBait: z.string().min(1),
  optionalLure: z.string().min(1),
  basicTackleSuggestion: z.string().min(1),
  whyThisFitsToday: z.string().min(1),
  safetyAccessNote: z.string().min(1),
  quickChallenge: z.string().min(1),
  flavorProfile: z.string().min(1),
  bestCookingMethods: z.array(z.string().min(1)).min(1).max(4),
  preparationTips: z.string().min(1),
  bestSeason: z.string().min(1),
  wsaAnglerTip: z.string().min(1),
  regulationStatus: z.enum(["in_season", "out_of_season", "protected", "limited", "unknown"]),
  seasonNote: z.string().min(1),
  bagLimitNote: z.string().min(1),
  sizeLimitNote: z.string().min(1),
  protectedNote: z.string().min(1),
  gearRuleNote: z.string().min(1),
  regulationSource: z.string().min(1),
  regulationSourceUrl: z.string().min(1),
  regulationLastChecked: z.string().min(1),
  facebookCaption: z.string().min(1),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1),
  guideImageUrl: z.string().min(1).optional(),
  guideImageAlt: z.string().min(1).optional(),
  quickIdTip: z.string().min(1).optional(),
  photoSource: z.string().min(1).optional(),
  images: z.array(speciesGalleryImageSchema).optional(),
  recommendedNearbySpots: z.array(recommendedSpotSchema).optional()
});

export const birdOutputSchema = z.object({
  birdName: z.string().min(1),
  scientificName: z.string().min(1).optional(),
  broadExplanation: z.string().min(1),
  likelyHabitat: z.string().min(1),
  bestNearbyPlaceType: z.string().min(1),
  bestTimeWindow: z.string().min(1),
  fieldMarks: z.array(z.string().min(1)).min(2).max(5),
  listeningFor: z.string().min(1),
  familyChallenge: z.string().min(1),
  journalPrompt: z.string().min(1),
  safetyNote: z.string().min(1),
  facebookCaption: z.string().min(1),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1),
  guideImageUrl: z.string().min(1).optional(),
  guideImageAlt: z.string().min(1).optional(),
  quickIdTip: z.string().min(1).optional(),
  photoSource: z.string().min(1).optional(),
  images: z.array(speciesGalleryImageSchema).optional(),
  recommendedNearbySpots: z.array(recommendedSpotSchema).optional()
});

export const plantOutputSchema = z.object({
  plantName: z.string().min(1),
  scientificName: z.string().min(1).optional(),
  broadExplanation: z.string().min(1),
  likelyHabitat: z.string().min(1),
  bestNearbyPlaceType: z.string().min(1),
  bestTimeWindow: z.string().min(1),
  keyFeatures: z.array(z.string().min(1)).min(2).max(5),
  seasonalNote: z.string().min(1),
  familyChallenge: z.string().min(1),
  journalPrompt: z.string().min(1),
  safetyNote: z.string().min(1),
  facebookCaption: z.string().min(1),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1),
  guideImageUrl: z.string().min(1).optional(),
  guideImageAlt: z.string().min(1).optional(),
  quickIdTip: z.string().min(1).optional(),
  photoSource: z.string().min(1).optional(),
  images: z.array(speciesGalleryImageSchema).optional(),
  recommendedNearbySpots: z.array(recommendedSpotSchema).optional()
});

export type AnimalInput = z.infer<typeof animalInputSchema>;
export type AnimalOutput = z.infer<typeof animalOutputSchema>;
export type WeekPlannerInput = z.infer<typeof weekPlannerInputSchema>;
export type WeekPlannerOutput = z.infer<typeof weekPlannerOutputSchema>;
export type DailyAdventureInput = z.infer<typeof dailyAdventureInputSchema>;
export type FishOutput = z.infer<typeof fishOutputSchema>;
export type BirdOutput = z.infer<typeof birdOutputSchema>;
export type PlantOutput = z.infer<typeof plantOutputSchema>;

export type GenerationRecord = {
  id: string;
  user_id: string;
  household_id?: string;
  student_id: string | null;
  tool_type: GenerationKind;
  title: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  created_at: string;
};

export type DailyAdventureGenerationInput = {
  requestDate: string;
  plannerMode?: "standard" | "advanced";
  targetType?: "student" | "household";
  targetId?: string;
  householdMode?: boolean;
  studentId?: string;
  studentName?: string;
  studentAge?: number;
  studentInterests?: string[];
  householdStudents?: Array<{
    id?: string;
    name: string;
    age: number;
    interests: string[];
    readingLevel?: (typeof readingLevelOptions)[number];
  }>;
  preset?: (typeof dailyAdventurePresetKeys)[number];
  museumKeys?: Array<(typeof smithsonianMuseumKeys)[number]>;
  studentReadingLevel?: (typeof readingLevelOptions)[number];
  homeZipcode?: string;
  selectedEventId?: string;
  timeAvailable?: string;
  budget?: string;
  energyLevel?: string;
  travelDistance?: string;
  targetFish?: string;
  planStyle?: string;
  mainGoal?: string;
  practicalNeeds?: string[];
  extraContext?: string;
};

export const animalOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    animalName: { type: "string" },
    funFacts: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5
    },
    habitat: { type: "string" },
    diet: { type: "string" },
    tracksAndSign: { type: "string" },
    kidChallenge: { type: "string" },
    drawingPrompt: { type: "string" },
    journalPrompt: { type: "string" },
    safetyNote: { type: "string" },
    facebookCaption: { type: "string" },
    printableSummary: { type: "string" },
    imageUrl: { type: "string" },
    imageAlt: { type: "string" },
    likelyHabitatType: { type: "string" },
    bestNearbyPlaceType: { type: "string" },
    whyThisPlaceFits: { type: "string" },
    bestTimeWindow: { type: "string" },
    whatToBring: {
      type: "array",
      items: { type: "string" }
    },
    recommendedNearbySpots: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          spotType: { type: "string" },
          waterType: { type: ["string", "null"] },
          locationLabel: { type: "string" },
          distanceMiles: { type: ["number", "null"] },
          description: { type: "string" },
          reason: { type: "string" },
          familyFriendly: { type: "boolean" },
          recommendedUseToday: { type: "string" },
          accessNote: { type: "string" },
          mapUrl: { type: "string" }
        },
        required: ["id", "name", "spotType", "waterType", "locationLabel", "distanceMiles", "description", "reason", "familyFriendly", "recommendedUseToday", "accessNote", "mapUrl"]
      }
    }
  },
  required: [
    "animalName",
    "funFacts",
    "habitat",
    "diet",
    "tracksAndSign",
    "kidChallenge",
    "drawingPrompt",
    "journalPrompt",
    "safetyNote",
    "facebookCaption",
    "printableSummary",
    "imageUrl",
    "imageAlt",
    "likelyHabitatType",
    "bestNearbyPlaceType",
    "whyThisPlaceFits",
    "bestTimeWindow",
    "whatToBring",
    "recommendedNearbySpots"
  ]
} as const;

export const weekPlannerOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    weeklyOverview: { type: "string" },
    dailyPlan: {
      type: "array",
      minItems: 1,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dayLabel: { type: "string" },
          focus: { type: "string" },
          activities: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4
          }
        },
        required: ["dayLabel", "focus", "activities"]
      }
    },
    suggestedFieldTrips: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 5
    },
    materialsList: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 12
    },
    parentNotes: { type: "string" },
    printableSummary: { type: "string" }
  },
  required: [
    "weeklyOverview",
    "dailyPlan",
    "suggestedFieldTrips",
    "materialsList",
    "parentNotes",
    "printableSummary"
  ]
} as const;

export const dailyAdventureOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    animalOfTheDay: { type: "string" },
    morningQuestion: { type: "string" },
    outdoorObservationActivity: { type: "string" },
    natureJournalPrompt: { type: "string" },
    discussionQuestion: { type: "string" },
    challengeActivity: { type: "string" },
    missionStops: { type: ["array", "null"], items: { type: "string" } },
    scavengerHuntTasks: { type: ["array", "null"], items: { type: "string" } },
    parentTalkingPoints: { type: ["array", "null"], items: { type: "string" } },
    specialExhibitNote: { type: ["string", "null"] },
    optionalFieldTripIdea: { type: "string" },
    facebookCaption: { type: "string" },
    bestTimeWindow: { type: ["string", "null"] },
    suggestedPlaceType: { type: ["string", "null"] },
    gearChecklist: { type: ["array", "null"], items: { type: "string" } },
    safetyNote: { type: ["string", "null"] },
    locationSummary: { type: ["string", "null"] },
    whyTheseSpotsWork: { type: ["string", "null"] },
    recommendedNearbySpots: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          spotType: { type: "string" },
          waterType: { type: ["string", "null"] },
          locationLabel: { type: "string" },
          distanceMiles: { type: ["number", "null"] },
          description: { type: "string" },
          reason: { type: "string" },
          familyFriendly: { type: "boolean" },
          recommendedUseToday: { type: "string" },
          accessNote: { type: "string" },
          mapUrl: { type: "string" }
        },
        required: ["id", "name", "spotType", "waterType", "locationLabel", "distanceMiles", "description", "reason", "familyFriendly", "recommendedUseToday", "accessNote", "mapUrl"]
      }
    },
    fishingOutlook: { type: ["string", "null"] },
    likelySpecies: { type: ["array", "null"], items: { type: "string" } },
    fishingMainSpecies: { type: ["string", "null"] },
    fishingLiveBait: { type: ["string", "null"] },
    fishingArtificialBait: { type: ["string", "null"] },
    fishingBestPlace: { type: ["string", "null"] },
    fishingWhereToCast: { type: ["string", "null"] },
    fishingMainSpeciesDescription: { type: ["string", "null"] },
    fishingOtherLikelyFish: { type: ["array", "null"], items: { type: "string" } },
    fishOfTheDayImageUrl: { type: ["string", "null"] },
    fishOfTheDayImageAlt: { type: ["string", "null"] },
    liveBaitImageUrl: { type: ["string", "null"] },
    liveBaitImageAlt: { type: ["string", "null"] },
    artificialBaitImageUrl: { type: ["string", "null"] },
    artificialBaitImageAlt: { type: ["string", "null"] },
    outingMode: { type: ["string", "null"] },
    fallbackPlan: { type: ["string", "null"] }
  },
  required: [
    "animalOfTheDay",
    "morningQuestion",
    "outdoorObservationActivity",
    "natureJournalPrompt",
    "discussionQuestion",
    "challengeActivity",
    "missionStops",
    "scavengerHuntTasks",
    "parentTalkingPoints",
    "specialExhibitNote",
    "optionalFieldTripIdea",
    "facebookCaption",
    "bestTimeWindow",
    "suggestedPlaceType",
    "gearChecklist",
    "safetyNote",
    "locationSummary",
    "whyTheseSpotsWork",
    "recommendedNearbySpots",
    "fishingOutlook",
    "likelySpecies",
    "fishingMainSpecies",
    "fishingLiveBait",
    "fishingArtificialBait",
    "fishingBestPlace",
    "fishingWhereToCast",
    "fishingMainSpeciesDescription",
    "fishingOtherLikelyFish",
    "fishOfTheDayImageUrl",
    "fishOfTheDayImageAlt",
    "liveBaitImageUrl",
    "liveBaitImageAlt",
    "artificialBaitImageUrl",
    "artificialBaitImageAlt",
    "outingMode",
    "fallbackPlan"
  ]
} as const;

export const fishOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
    properties: {
      fishName: { type: "string" },
      speciesSlug: { type: "string" },
      waterType: { type: "string" },
      broadExplanation: { type: "string" },
    likelyHabitat: { type: "string" },
    bestNearbyPlaceType: { type: "string" },
      bestTimeWindow: { type: "string" },
      fishingOutlook: { type: "string" },
      bestUseOfOuting: { type: "string" },
      likelyRelatedSpecies: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    bestBeginnerBait: { type: "string" },
    optionalLure: { type: "string" },
    basicTackleSuggestion: { type: "string" },
    whyThisFitsToday: { type: "string" },
    safetyAccessNote: { type: "string" },
    quickChallenge: { type: "string" },
    flavorProfile: { type: "string" },
    bestCookingMethods: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    preparationTips: { type: "string" },
    bestSeason: { type: "string" },
    wsaAnglerTip: { type: "string" },
    regulationStatus: { type: "string", enum: ["in_season", "out_of_season", "protected", "limited", "unknown"] },
    seasonNote: { type: "string" },
    bagLimitNote: { type: "string" },
    sizeLimitNote: { type: "string" },
    protectedNote: { type: "string" },
    gearRuleNote: { type: "string" },
    regulationSource: { type: "string" },
    regulationSourceUrl: { type: "string" },
    regulationLastChecked: { type: "string" },
    facebookCaption: { type: "string" },
    imageUrl: { type: "string" },
    imageAlt: { type: "string" },
    recommendedNearbySpots: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
            id: { type: "string" },
            name: { type: "string" },
            spotType: { type: "string" },
            waterType: { type: ["string", "null"] },
            locationLabel: { type: "string" },
          distanceMiles: { type: ["number", "null"] },
          description: { type: "string" },
          reason: { type: "string" },
          familyFriendly: { type: "boolean" },
          recommendedUseToday: { type: "string" },
          accessNote: { type: "string" },
          mapUrl: { type: "string" }
        },
          required: ["id", "name", "spotType", "waterType", "locationLabel", "distanceMiles", "description", "reason", "familyFriendly", "recommendedUseToday", "accessNote", "mapUrl"]
      }
    }
  },
  required: [
      "fishName",
      "speciesSlug",
      "waterType",
      "broadExplanation",
    "likelyHabitat",
    "bestNearbyPlaceType",
      "bestTimeWindow",
      "fishingOutlook",
      "bestUseOfOuting",
    "likelyRelatedSpecies",
    "bestBeginnerBait",
    "optionalLure",
    "basicTackleSuggestion",
    "whyThisFitsToday",
    "safetyAccessNote",
    "quickChallenge",
    "flavorProfile",
    "bestCookingMethods",
    "preparationTips",
    "bestSeason",
    "wsaAnglerTip",
    "regulationStatus",
    "seasonNote",
    "bagLimitNote",
    "sizeLimitNote",
    "protectedNote",
    "gearRuleNote",
    "regulationSource",
    "regulationSourceUrl",
    "regulationLastChecked",
    "facebookCaption",
    "imageUrl",
    "imageAlt",
    "recommendedNearbySpots"
  ]
} as const;

export const birdOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    birdName: { type: "string" },
    broadExplanation: { type: "string" },
    likelyHabitat: { type: "string" },
    bestNearbyPlaceType: { type: "string" },
    bestTimeWindow: { type: "string" },
    fieldMarks: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
    listeningFor: { type: "string" },
    familyChallenge: { type: "string" },
    journalPrompt: { type: "string" },
    safetyNote: { type: "string" },
    facebookCaption: { type: "string" },
    imageUrl: { type: "string" },
    imageAlt: { type: "string" },
    recommendedNearbySpots: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          spotType: { type: "string" },
          waterType: { type: ["string", "null"] },
          locationLabel: { type: "string" },
          distanceMiles: { type: ["number", "null"] },
          description: { type: "string" },
          reason: { type: "string" },
          familyFriendly: { type: "boolean" },
          recommendedUseToday: { type: "string" },
          accessNote: { type: "string" },
          mapUrl: { type: "string" }
        },
        required: ["id", "name", "spotType", "waterType", "locationLabel", "distanceMiles", "description", "reason", "familyFriendly", "recommendedUseToday", "accessNote", "mapUrl"]
      }
    }
  },
  required: [
    "birdName",
    "broadExplanation",
    "likelyHabitat",
    "bestNearbyPlaceType",
    "bestTimeWindow",
    "fieldMarks",
    "listeningFor",
    "familyChallenge",
    "journalPrompt",
    "safetyNote",
    "facebookCaption",
    "imageUrl",
    "imageAlt",
    "recommendedNearbySpots"
  ]
} as const;

export const plantOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    plantName: { type: "string" },
    broadExplanation: { type: "string" },
    likelyHabitat: { type: "string" },
    bestNearbyPlaceType: { type: "string" },
    bestTimeWindow: { type: "string" },
    keyFeatures: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
    seasonalNote: { type: "string" },
    familyChallenge: { type: "string" },
    journalPrompt: { type: "string" },
    safetyNote: { type: "string" },
    facebookCaption: { type: "string" },
    imageUrl: { type: "string" },
    imageAlt: { type: "string" },
    recommendedNearbySpots: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          spotType: { type: "string" },
          waterType: { type: ["string", "null"] },
          locationLabel: { type: "string" },
          distanceMiles: { type: ["number", "null"] },
          description: { type: "string" },
          reason: { type: "string" },
          familyFriendly: { type: "boolean" },
          recommendedUseToday: { type: "string" },
          accessNote: { type: "string" },
          mapUrl: { type: "string" }
        },
        required: ["id", "name", "spotType", "waterType", "locationLabel", "distanceMiles", "description", "reason", "familyFriendly", "recommendedUseToday", "accessNote", "mapUrl"]
      }
    }
  },
  required: [
    "plantName",
    "broadExplanation",
    "likelyHabitat",
    "bestNearbyPlaceType",
    "bestTimeWindow",
    "keyFeatures",
    "seasonalNote",
    "familyChallenge",
    "journalPrompt",
    "safetyNote",
    "facebookCaption",
    "imageUrl",
    "imageAlt",
    "recommendedNearbySpots"
  ]
} as const;

export function generationKindLabel(kind: GenerationKind) {
  switch (kind) {
    case "animal_of_the_day":
      return "Animal of the Day";
    case "bird_of_the_day":
      return "Bird of the Day";
    case "plant_of_the_day":
      return "Plant of the Day";
    case "fish_of_the_day":
      return "Fish of the Day";
    case "daily_adventure":
      return "Daily Adventure";
    case "week_plan":
      return "Week Planner";
    case "lesson":
      return "Lesson";
    default:
      return kind;
  }
}

export function getGenerationInput(generation: GenerationRecord) {
  return generation.input_json;
}

export function getGenerationOutput(generation: GenerationRecord) {
  return generation.output_json;
}

export function getGenerationSummary(generation: GenerationRecord) {
  const output = getGenerationOutput(generation);

  switch (generation.tool_type) {
    case "animal_of_the_day":
      return summarizeAnimalOutput(output as AnimalOutput);
    case "bird_of_the_day":
      return summarizeBirdOutput(output as BirdOutput);
    case "plant_of_the_day":
      return summarizePlantOutput(output as PlantOutput);
    case "fish_of_the_day":
      return summarizeFishOutput(output as FishOutput);
    case "week_plan":
      return summarizeWeekPlannerOutput(output as WeekPlannerOutput);
    case "daily_adventure":
      return summarizeDailyAdventureOutput(output as DailyAdventureOutput);
    case "lesson":
      return String(output.printableSummary || output.objective || generation.title);
    default:
      return generation.title;
  }
}

export function summarizeAnimalOutput(output: AnimalOutput) {
  return `${output.animalName}: ${output.funFacts[0]}`;
}

export function summarizeWeekPlannerOutput(output: WeekPlannerOutput) {
  return output.weeklyOverview;
}

export function summarizeDailyAdventureOutput(output: DailyAdventureOutput) {
  return `${output.animalOfTheDay}: ${output.challengeActivity}`;
}

export function summarizeFishOutput(output: FishOutput) {
  return `${output.fishName}: ${getRegulationStatusLabel(output.regulationStatus)}. ${output.fishingOutlook}`;
}

export function summarizeBirdOutput(output: BirdOutput) {
  return `${output.birdName}: ${output.broadExplanation}`;
}

export function summarizePlantOutput(output: PlantOutput) {
  return `${output.plantName}: ${output.broadExplanation}`;
}
