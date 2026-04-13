import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnvironmentalContext } from "@/lib/context/engine";
import { findRecommendedSpots, resolveLocationContext, type LocationContextInput, type RecommendedSpot } from "@/lib/context/nearby-spots";
import { rankSpotsForWaterType } from "@/lib/fish-of-day/spot-ranking";
import { getWaterTypeLabel, inferWaterTypeFromRecommendedSpots, type WaterType } from "@/lib/fish-of-day/water-type";
import { getFishDataByName } from "@/lib/species/fish-data";

export type FishingContextInput = LocationContextInput & {
  requestDate: string;
  weatherCondition?: string | null;
  targetFish?: string | null;
};

export type FishingRecommendation = {
  locationSummary: string;
  waterType: WaterType;
  waterTypeLabel: string;
  bestTimeWindow: string;
  fishingOutlook: string;
  likelySpecies: string[];
  primarySpecies: string;
  liveBait: string;
  artificialBait: string;
  bestPlace: string;
  whereToCast: string;
  mainSpeciesDescription: string;
  gearChecklist: string[];
  outingMode: string;
  fallbackPlan: string;
  recommendedNearbySpots: RecommendedSpot[];
  safetyNote: string;
  supportLevel: "poor" | "fair" | "good";
  windExposure: "low" | "medium" | "high";
  temperature: number | null;
  precipitationChance: number | null;
};

export async function getFishingRecommendation(
  supabase: SupabaseClient,
  input: FishingContextInput
): Promise<FishingRecommendation> {
  const location = resolveLocationContext(input);
  const environmental = await getEnvironmentalContext(supabase, input);
  const forecastSummary = environmental.weather?.shortForecast ?? environmental.fallbackWeatherSummary.summary;
  const precipitationChance = environmental.weather?.precipitationChance ?? null;
  const spots = await findRecommendedSpots({
    supabase,
    location,
    activityTag: "fishing",
    habitatTags: ["lake", "creek", "river", "shoreline", "marsh"],
    limit: 4,
    requireFishing: true
  });
  const waterType = inferWaterTypeFromRecommendedSpots(spots);
  const rankedSpots = rankSpotsForWaterType(spots, waterType);

  const outingMode =
    environmental.fallbackWeatherSummary.supportLevel === "poor"
      ? "scouting or water observation"
      : environmental.fallbackWeatherSummary.windExposure === "high"
        ? "protected-bank fishing or scouting"
        : "active fishing";

  const likelySpecies = deriveLikelySpecies(rankedSpots, waterType);
  const requestedTargetFish = input.targetFish?.trim() || null;
  const primarySpecies = requestedTargetFish ?? likelySpecies[0] ?? "Local game fish";
  const targetFishProfile = requestedTargetFish ? getFishDataByName(requestedTargetFish) : null;
  const prioritizedSpecies = requestedTargetFish
    ? [requestedTargetFish, ...likelySpecies.filter((species) => species.toLowerCase() !== requestedTargetFish.toLowerCase())]
    : likelySpecies;
  const bestTimeWindow =
    environmental.fallbackWeatherSummary.supportLevel === "good"
      ? environmental.solunar.bestWindow
      : environmental.fallbackWeatherSummary.windExposure === "high"
        ? "a protected early-morning or evening window"
        : "a short morning or late-afternoon window";

  const conditionLead =
    environmental.fallbackWeatherSummary.supportLevel === "good"
      ? "Conditions look fairly supportive for a real fishing outing today."
      : environmental.fallbackWeatherSummary.supportLevel === "fair"
        ? "Conditions look usable, but this is more of a practical, flexible fishing day than a sure-bet day."
        : "Conditions are not working in your favor, so a scouting-style water outing is the safer call.";

  const waterLine = buildWaterLine(environmental.water, waterType);
  const waterTypeLine = buildWaterTypeLine(waterType, environmental.fallbackWeatherSummary.windExposure);

  const fishingOutlook = [
    conditionLead,
    `Best odds are likely during ${bestTimeWindow}.`,
    `Forecast summary: ${forecastSummary}`,
    waterTypeLine,
    waterLine,
    `Solunar note: ${environmental.solunar.summary}`,
    `Maryland context: ${environmental.marylandDnr.reportSummary}`,
    outingMode === "active fishing"
      ? "If the family has time, this is a reasonable day to actually fish."
      : `This looks better for ${outingMode} than for a long, exposed fishing attempt.`
  ].join(" ");

  const fallbackPlan =
    environmental.fallbackWeatherSummary.supportLevel === "poor"
      ? "Skip active fishing today and turn it into a shoreline scouting mission focused on bait movement, birds over the water, and safe access points."
      : "If the bite feels slow, switch to fish-habitat observation, shoreline sign spotting, and a short journal entry about what the water is doing.";

  return {
    locationSummary: `Using ${location.displayLabel} within about ${location.radiusMiles} miles for nearby water access.`,
    waterType,
    waterTypeLabel: getWaterTypeLabel(waterType),
    bestTimeWindow,
    fishingOutlook,
    likelySpecies: prioritizedSpecies,
    primarySpecies,
    liveBait: targetFishProfile?.bestBait ?? getLiveBaitSuggestion(waterType),
    artificialBait: targetFishProfile?.bestLures.slice(0, 2).join(" or ") ?? getArtificialBaitSuggestion(waterType),
    bestPlace:
      rankedSpots[0]?.name
        ? `${rankedSpots[0].name} (${getWaterTypeLabel(waterType)})`
        : `a ${getWaterTypeLabel(waterType).toLowerCase()} access point`,
    whereToCast: getWhereToCastSuggestion(waterType),
    mainSpeciesDescription: targetFishProfile
      ? `${primarySpecies} is your chosen target today. ${targetFishProfile.wsaAnglerTip}`
      : getMainSpeciesDescription(primarySpecies, waterType),
    gearChecklist: buildFishingGearChecklist(environmental.fallbackWeatherSummary.windExposure),
    outingMode,
    fallbackPlan,
    recommendedNearbySpots: rankedSpots,
    supportLevel: environmental.fallbackWeatherSummary.supportLevel,
    windExposure: environmental.fallbackWeatherSummary.windExposure,
    temperature: environmental.weather?.temperature ?? null,
    precipitationChance,
    safetyNote:
      environmental.fallbackWeatherSummary.windExposure === "high"
        ? "Choose protected banks or coves, keep kids away from slick edges, and avoid exposed shoreline if wind picks up."
        : `Check footing near water, keep children close at the edge, and treat access, weather, and water conditions as more important than any single fishing signal.${precipitationChance !== null ? ` Forecast precipitation chance is around ${precipitationChance}%.` : ""}`
  };
}

function getLiveBaitSuggestion(waterType: WaterType) {
  switch (waterType) {
    case "pond":
    case "lake":
      return "Nightcrawlers or small minnows";
    case "creek":
      return "Red worms or small live minnows";
    case "river":
      return "Cut bait or live minnows";
    case "shoreline":
      return "Bloodworms, peeler crab, or shrimp";
  }
}

function getArtificialBaitSuggestion(waterType: WaterType) {
  switch (waterType) {
    case "pond":
    case "lake":
      return "Small jig, inline spinner, or soft plastic worm";
    case "creek":
      return "Inline spinner or small jig";
    case "river":
      return "Jighead with soft plastic or diving crankbait";
    case "shoreline":
      return "Small jig, spoon, or soft plastic paddle tail";
  }
}

function getWhereToCastSuggestion(waterType: WaterType) {
  switch (waterType) {
    case "pond":
      return "Cast along weed edges, shade lines, and fallen cover.";
    case "lake":
      return "Cast toward structure, drop-offs, and protected coves.";
    case "creek":
      return "Cast into slow pockets, bends, and current breaks.";
    case "river":
      return "Cast into seams, eddies, and deeper bank-side holes.";
    case "shoreline":
      return "Cast near creek mouths, riprap, grass edges, or moving bait.";
  }
}

function getMainSpeciesDescription(species: string, waterType: WaterType) {
  const waterLabel = getWaterTypeLabel(waterType).toLowerCase();
  return `${species} is a practical target in this kind of ${waterLabel}, especially where food, cover, and calmer water meet.`;
}

function buildFishingGearChecklist(windExposure: "low" | "medium" | "high") {
  const items = ["Water bottle", "Small tackle or observation pouch", "Notebook", "Hand towel"];
  if (windExposure !== "low") items.push("Wind layer");
  items.push("Closed-toe shoes");
  return items;
}

function deriveLikelySpecies(spots: RecommendedSpot[], waterType: WaterType) {
  const species = new Set<string>();
  const text = spots.map((spot) => `${spot.name} ${spot.description} ${spot.reason}`).join(" ").toLowerCase();

  if (waterType === "pond") {
    species.add("Largemouth bass");
    species.add("Bluegill");
    species.add("Channel catfish");
  }

  if (waterType === "lake") {
    species.add("Crappie");
    species.add("Yellow perch");
    species.add("Bluegill");
  }

  if (waterType === "creek") {
    species.add("Sunfish");
    species.add("Small bass");
    if (/(cold|trout)/.test(text)) species.add("Trout");
  }

  if (waterType === "river") {
    species.add("Channel catfish");
    species.add("White perch");
    species.add("Bass");
  }

  if (waterType === "shoreline") {
    species.add("White perch");
    species.add("Spot");
    species.add("Croaker");
    species.add("Striped bass");
  }

  return Array.from(species).slice(0, 4);
}

function buildWaterTypeLine(waterType: WaterType, windExposure: "low" | "medium" | "high") {
  switch (waterType) {
    case "pond":
      return "This looks like a pond-style day, so shaded banks, weed edges, and calm cover are the smartest first targets.";
    case "lake":
      return "This looks more like a lake outing, so protected coves, brush, and structure near a little depth deserve the first casts.";
    case "creek":
      return "This looks like creek water, so slow pockets, root cover, and gentle current breaks matter more than long casts.";
    case "river":
      return "This looks like a river day, so deeper holes, calmer seams, and banks that break current are more useful than exposed fast water.";
    case "shoreline":
      return windExposure === "high"
        ? "This looks like a shoreline day, but wind matters, so protected access points and calmer tidal edges are the better family choice."
        : "This looks like a shoreline day, so bait movement, creek mouths, and easy tidal access points are worth checking first.";
  }
}

function buildWaterLine(
  water:
    | {
        streamflow: string | null;
        gageHeight: string | null;
        waterTrend: string;
      }
    | null
    | undefined,
  waterType: WaterType
) {
  if (water?.streamflow || water?.gageHeight) {
    return `Water summary: ${water.waterTrend} ${water.streamflow ? `Flow is around ${water.streamflow}.` : ""} ${water.gageHeight ? `Stage is about ${water.gageHeight}.` : ""}`.trim();
  }

  if (waterType === "pond" || waterType === "lake") {
    return "No live water reading was available nearby, so calm banks, shade, and visible fish cover matter more today.";
  }

  if (waterType === "creek" || waterType === "river") {
    return "No live water reading was available nearby, so let the family judge current speed, clarity, and safe access on arrival.";
  }

  return "No live water reading was available nearby, so wind, bait movement, and safe shoreline access matter more today.";
}
