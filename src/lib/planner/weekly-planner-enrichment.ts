import type { WeekPlannerOutput } from "@/lib/generations";
import { geocodeZipcode } from "@/lib/location-preferences";
import {
  getPlannerOpportunityMatches,
  type FamilyOpportunity,
} from "@/lib/nearby/family-opportunities";
import {
  getSouthernMarylandEventSources,
  getSouthernMarylandFamilyEvents,
} from "@/lib/nearby/live-family-events";
import { resolveLocationContext, type ResolvedLocationContext } from "@/lib/context/nearby-spots";
import { getNwsWeeklyForecast, type WeeklyForecastDay } from "@/lib/context/weather/nws";

type PlannerEnhancementInput = {
  focusArea: string;
  interests: string;
  locationLabel: string;
  homeZipcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMiles?: number | null;
  daysPerWeek: number;
  settingPreference: string;
  baseOutput: WeekPlannerOutput;
};

type DestinationCard = NonNullable<WeekPlannerOutput["dailyPlan"][number]["placeRecommendation"]>;
type EventCard = NonNullable<WeekPlannerOutput["dailyPlan"][number]["eventRecommendation"]>;

function addDays(dateValue: string, offset: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${dateValue}T12:00:00`));
}

function titleCaseWeather(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildForecastSummary(forecast: WeeklyForecastDay[]) {
  if (!forecast.length) {
    return "No live forecast was available, so the planner is keeping the week flexible.";
  }

  const outlook = forecast
    .slice(0, 3)
    .map((day) => `${day.dayLabel}: ${day.shortForecast}`)
    .join(" ");

  return `Weekly weather watch: ${outlook} Use the daily weather notes to decide when to lean outdoor and when to swap to indoor plans.`;
}

function toDestinationCard(item: FamilyOpportunity | null): DestinationCard | null {
  if (!item) return null;

  return {
    name: item.title,
    category: item.type.replaceAll("_", " "),
    locationLabel: item.locationLabel,
    whyItFits: item.reason,
    href: item.href,
    distanceMiles: item.distanceMiles
  };
}

function toEventCard(item: Awaited<ReturnType<typeof getSouthernMarylandFamilyEvents>>[number] | null): EventCard | null {
  if (!item) return null;

  return {
    title: item.title,
    locationLabel: item.locationLabel,
    eventDate: item.eventDate,
    eventTime: item.eventTime,
    sourceLabel: item.sourceLabel,
    href: item.href,
    note: item.note
  };
}

function buildWeatherNote(day: WeeklyForecastDay | null, locationLabel: string) {
  if (!day) {
    return `No live forecast was available for ${locationLabel}, so this day keeps an easy indoor/outdoor fallback.`;
  }

  const precipitationText =
    typeof day.precipitationChance === "number" ? ` ${day.precipitationChance}% rain chance.` : "";

  return `${titleCaseWeather(day.weatherCondition)} weather for ${day.dayLabel}: ${day.shortForecast}.${precipitationText}`.trim();
}

function chooseEventForDay(
  events: Awaited<ReturnType<typeof getSouthernMarylandFamilyEvents>>,
  eventDate: string,
  focusArea: string,
  interests: string,
  dailyFocus: string
) {
  const keywords = `${focusArea} ${interests} ${dailyFocus}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  const sameDayEvents = events.filter((event) => event.eventDate === eventDate);
  if (!sameDayEvents.length) return null;

  return sameDayEvents
    .map((event) => {
      const haystack = `${event.title} ${event.note} ${event.locationLabel}`.toLowerCase();
      const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 2 : 0), 0);
      return { event, score };
    })
    .sort((left, right) => right.score - left.score)[0]?.event ?? sameDayEvents[0];
}

function choosePlaceForDay(
  location: ResolvedLocationContext,
  focusArea: string,
  interests: string,
  dailyFocus: string,
  weatherCondition: string | null
) {
  return (
    getPlannerOpportunityMatches({
      location,
      interests: interests
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      weatherCondition,
      timeAvailable: "1-2 hours",
      budget: "low",
      energyLevel: "medium",
      travelDistance: "local",
      planStyle: dailyFocus,
      mainGoal: focusArea,
      extraContext: `${focusArea}. ${dailyFocus}.`
    })[0] ?? null
  );
}

function choosePlaySpotForDay(
  location: ResolvedLocationContext,
  dailyFocus: string,
  weatherCondition: string | null
) {
  return (
    getPlannerOpportunityMatches({
      location,
      interests: ["playground", "movement", "outdoor play"],
      weatherCondition,
      timeAvailable: "30 min",
      budget: "free",
      energyLevel: "high",
      travelDistance: "local",
      planStyle: dailyFocus,
      mainGoal: "kids play playground movement",
      extraContext: "playground run-around gross motor play"
    })[0] ?? null
  );
}

async function resolvePlannerLocation({
  locationLabel,
  latitude,
  longitude,
  homeZipcode,
  radiusMiles,
}: Pick<PlannerEnhancementInput, "locationLabel" | "latitude" | "longitude" | "homeZipcode" | "radiusMiles">) {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return resolveLocationContext({
      locationLabel,
      latitude,
      longitude,
      radiusMiles: radiusMiles ?? 25
    });
  }

  if (homeZipcode) {
    try {
      const geocoded = await geocodeZipcode(homeZipcode);
      return resolveLocationContext({
        locationLabel: geocoded.locationLabel,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        radiusMiles: radiusMiles ?? 25
      });
    } catch {
      // fall through to label-based resolution
    }
  }

  return resolveLocationContext({
    locationLabel,
    radiusMiles: radiusMiles ?? 25
  });
}

export async function buildWeeklyPlannerEnhancements(input: PlannerEnhancementInput) {
  const startDate = new Date().toISOString().slice(0, 10);
  const location = await resolvePlannerLocation(input);
  const forecast =
    location.latitude !== null && location.longitude !== null
      ? (await getNwsWeeklyForecast(location.latitude, location.longitude, input.daysPerWeek)) ?? []
      : [];
  const liveEvents = await getSouthernMarylandFamilyEvents(location, startDate, input.daysPerWeek);
  const regionalEventSources = getSouthernMarylandEventSources().slice(0, 8).map((source) => ({
    label: source.label,
    href: source.href,
    note: source.note
  }));

  const enrichedDailyPlan = input.baseOutput.dailyPlan.map((day, index) => {
    const date = addDays(startDate, index);
    const forecastDay = forecast.find((item) => item.date === date) ?? forecast[index] ?? null;
    const matchedEvent = chooseEventForDay(liveEvents, date, input.focusArea, input.interests, day.focus);
    const recommendedPlace = choosePlaceForDay(
      location,
      input.focusArea,
      input.interests,
      day.focus,
      forecastDay?.weatherCondition ?? null
    );
    const playSpot = choosePlaySpotForDay(location, day.focus, forecastDay?.weatherCondition ?? null);

    return {
      ...day,
      date,
      dayLabel: formatDayLabel(date),
      weatherSummary: buildWeatherNote(forecastDay, location.displayLabel),
      weatherMode: forecastDay?.recommendedSetting ?? (input.settingPreference.includes("indoor") ? "indoor" : "mixed"),
      placeRecommendation: toDestinationCard(recommendedPlace),
      playRecommendation: toDestinationCard(playSpot),
      eventRecommendation: toEventCard(matchedEvent),
      indoorBackup:
        day.indoorBackup ??
        (forecastDay?.recommendedSetting === "indoor"
          ? `Shift this day's big outing into a library, museum, or art-space block and keep the outdoor piece to a short observation stop.`
          : "Keep one easy indoor backup such as library time, sketching, building, or a themed documentary clip."),
    };
  });

  const uniqueTripTitles = Array.from(
    new Set(
      enrichedDailyPlan
        .flatMap((day) => [day.placeRecommendation?.name, day.playRecommendation?.name])
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 5);

  return {
    startDate,
    location,
    weatherSummary: buildForecastSummary(forecast),
    weeklyForecast: forecast.map((day) => ({
      date: day.date,
      dayLabel: day.dayLabel,
      shortForecast: day.shortForecast,
      weatherCondition: day.weatherCondition,
      recommendedSetting: day.recommendedSetting,
      highTemperature: day.highTemperature,
      lowTemperature: day.lowTemperature,
      precipitationChance: day.precipitationChance,
      sourceLabel: day.sourceLabel
    })),
    dailyPlan: enrichedDailyPlan,
    suggestedFieldTrips:
      uniqueTripTitles.length >= 2 ? uniqueTripTitles : input.baseOutput.suggestedFieldTrips,
    regionalEventSources,
    locationSummary: `Planner radius: about ${location.radiusMiles} miles around ${location.displayLabel}.`
  };
}
