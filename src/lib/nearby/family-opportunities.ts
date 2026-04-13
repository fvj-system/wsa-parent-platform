import {
  milesBetweenPoints,
  type RecommendedSpot,
  type ResolvedLocationContext,
} from "@/lib/context/nearby-spots";

export type FamilyOpportunity = {
  id: string;
  title: string;
  type:
    | "museum"
    | "history_site"
    | "nature_center"
    | "park"
    | "kids_programs"
    | "festival_calendar"
    | "lecture_calendar";
  locationLabel: string;
  reason: string;
  distanceMiles: number | null;
  href: string;
  ctaLabel: string;
  familyFit: string;
  practicalNote: string;
  tags: string[];
};

type PlannerMode = "standard" | "advanced";
type PlannerWeather = "clear" | "mixed" | "windy" | "rainy" | "stormy";
type PlannerTime = "30 min" | "1-2 hours" | "half day" | "full day";
type PlannerBudget = "free" | "low" | "medium" | "high";
type PlannerEnergy = "low" | "medium" | "high";
type PlannerTravel = "backyard" | "local" | "regional" | "far";
type PlannerSetting = "indoor" | "outdoor" | "mixed";

type PlannerOpportunityRecord = Omit<
  FamilyOpportunity,
  "distanceMiles"
> & {
  latitude: number | null;
  longitude: number | null;
  weatherFits: PlannerWeather[];
  timeFits: PlannerTime[];
  budgetFits: PlannerBudget[];
  energyFits: PlannerEnergy[];
  travelFits: PlannerTravel[];
  setting: PlannerSetting;
};

export type PlannerOpportunityFilters = {
  location: ResolvedLocationContext;
  interests?: string[];
  preset?: string | null;
  weatherCondition?: string | null;
  timeAvailable?: string | null;
  budget?: string | null;
  energyLevel?: string | null;
  travelDistance?: string | null;
  plannerMode?: PlannerMode | null;
  planStyle?: string | null;
  mainGoal?: string | null;
  practicalNeeds?: string[];
  extraContext?: string | null;
};

const OPPORTUNITIES: PlannerOpportunityRecord[] = [
  {
    id: "calvert-marine-museum",
    title: "Calvert Marine Museum",
    type: "museum",
    locationLabel: "Solomons, MD",
    latitude: 38.3215,
    longitude: -76.4519,
    reason:
      "A strong Southern Maryland museum stop for Chesapeake Bay wildlife, fossil history, boats, and kid-friendly regional learning.",
    href: "https://www.calvertmarinemuseum.com/",
    ctaLabel: "Museum",
    familyFit:
      "Best for families who want one reliable anchor stop with animals, history, and indoor backup in the same outing.",
    practicalNote:
      "Good rainy-day fallback, restrooms are straightforward, and Solomons makes it easy to pair with a waterfront walk or lunch.",
    tags: [
      "museum",
      "animals",
      "marine life",
      "fossils",
      "history",
      "science",
      "chesapeake",
      "indoor backup",
    ],
    weatherFits: ["clear", "mixed", "windy", "rainy", "stormy"],
    timeFits: ["30 min", "1-2 hours", "half day"],
    budgetFits: ["low", "medium"],
    energyFits: ["low", "medium"],
    travelFits: ["local", "regional", "far"],
    setting: "indoor",
  },
  {
    id: "historic-st-marys-city",
    title: "Historic St. Mary's City",
    type: "history_site",
    locationLabel: "St. Mary's City, MD",
    latitude: 38.1888,
    longitude: -76.4274,
    reason:
      "One of the best local choices for Maryland history, colonial-era interpretation, archaeology, and place-based learning that feels real instead of textbook-only.",
    href: "https://www.hsmcdigshistory.org/events/",
    ctaLabel: "Events",
    familyFit:
      "Great when the family wants history, walking, and story-rich stops without losing the outdoor feel.",
    practicalNote:
      "Works best with moderate energy and comfortable shoes; pair it with one focused question instead of trying to cover every exhibit.",
    tags: [
      "history",
      "maryland history",
      "colonial",
      "archaeology",
      "museum",
      "walking",
      "field trip",
    ],
    weatherFits: ["clear", "mixed", "windy"],
    timeFits: ["1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low"],
    energyFits: ["medium", "high"],
    travelFits: ["local", "regional", "far"],
    setting: "mixed",
  },
  {
    id: "jefferson-patterson-park",
    title: "Jefferson Patterson Park and Museum",
    type: "history_site",
    locationLabel: "St. Leonard, MD",
    latitude: 38.4045,
    longitude: -76.5122,
    reason:
      "A useful all-around local pick for trails, archaeology, estuary learning, and calm mixed-age observation.",
    href: "https://www.jefpat.maryland.gov/",
    ctaLabel: "Site",
    familyFit:
      "Fits families who want outdoor space, history, and nature study without committing to a huge destination day.",
    practicalNote:
      "Easy to turn into either a short walk or a half-day outing depending on energy and weather.",
    tags: [
      "history",
      "archaeology",
      "nature",
      "trails",
      "estuary",
      "museum",
      "mixed ages",
    ],
    weatherFits: ["clear", "mixed", "windy"],
    timeFits: ["1-2 hours", "half day"],
    budgetFits: ["free", "low"],
    energyFits: ["low", "medium"],
    travelFits: ["local", "regional"],
    setting: "mixed",
  },
  {
    id: "greenwell-foundation",
    title: "Greenwell Foundation Nature Center",
    type: "nature_center",
    locationLabel: "Hollywood, MD",
    latitude: 38.345,
    longitude: -76.5445,
    reason:
      "A calmer family nature option with shoreline, trails, and simple outdoor learning for mixed-age kids.",
    href: "https://www.greenwellfoundation.org/",
    ctaLabel: "Site",
    familyFit:
      "Best when you want a gentle nature day, light walking, and a place that still works if attention spans are short.",
    practicalNote:
      "Good for lower-energy outings and easier restroom/transition planning than a wilder trail day.",
    tags: [
      "nature",
      "wildlife",
      "shoreline",
      "walking",
      "calm",
      "mixed ages",
      "observation",
    ],
    weatherFits: ["clear", "mixed"],
    timeFits: ["30 min", "1-2 hours", "half day"],
    budgetFits: ["free", "low"],
    energyFits: ["low", "medium"],
    travelFits: ["local", "regional"],
    setting: "outdoor",
  },
  {
    id: "point-lookout-state-park",
    title: "Point Lookout State Park",
    type: "park",
    locationLabel: "Scotland, MD",
    latitude: 38.0417,
    longitude: -76.3274,
    reason:
      "A bigger Southern Maryland outing for shoreline habitat, birding, fishing-adjacent learning, and Civil War history in one place.",
    href: "https://dnr.maryland.gov/publiclands/Pages/southern/pointlookout.aspx",
    ctaLabel: "Park",
    familyFit:
      "A strong full outing when the family wants both history and outdoor exploration instead of choosing just one.",
    practicalNote:
      "Works best with moderate energy, sun/wind prep, and a realistic plan for beach exposure and walking distance.",
    tags: [
      "park",
      "history",
      "birding",
      "shoreline",
      "fishing",
      "wildlife",
      "civil war",
      "full outing",
    ],
    weatherFits: ["clear", "mixed", "windy"],
    timeFits: ["1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low"],
    energyFits: ["medium", "high"],
    travelFits: ["regional", "far"],
    setting: "outdoor",
  },
  {
    id: "annmarie-garden",
    title: "Annmarie Sculpture Garden & Arts Center",
    type: "kids_programs",
    locationLabel: "Solomons, MD",
    latitude: 38.3597,
    longitude: -76.4614,
    reason:
      "A reliable art-and-nature stop with family programs, festivals, and a flexible mix of indoor and outdoor space.",
    href: "https://www.annmariegarden.org/annmarie2/event-info-0",
    ctaLabel: "Events",
    familyFit:
      "Helpful when some kids want creative work, some need movement, and the weather might not fully cooperate.",
    practicalNote:
      "Good choice for mixed attention spans because you can shorten or extend the day without losing the point of the outing.",
    tags: [
      "art",
      "nature",
      "kids programs",
      "festivals",
      "creative",
      "mixed indoor and outdoor",
    ],
    weatherFits: ["clear", "mixed", "rainy"],
    timeFits: ["1-2 hours", "half day"],
    budgetFits: ["low", "medium"],
    energyFits: ["low", "medium"],
    travelFits: ["local", "regional"],
    setting: "mixed",
  },
  {
    id: "piney-point-lighthouse",
    title: "Piney Point Lighthouse Museum",
    type: "museum",
    locationLabel: "Piney Point, MD",
    latitude: 38.1392,
    longitude: -76.5358,
    reason:
      "A smaller local history stop that works well for maritime stories, navigation, and a shorter family museum mission.",
    href: "https://www.stmaryscountymd.gov/Recreate/Museums/PineyPoint/",
    ctaLabel: "Museum",
    familyFit:
      "Best when you want local history with lighter pacing and less walking than a larger destination day.",
    practicalNote:
      "Easy to pair with a waterfront drive or another nearby stop if the family wants a short but meaningful outing.",
    tags: [
      "museum",
      "history",
      "maritime",
      "navigation",
      "lighthouse",
      "short outing",
    ],
    weatherFits: ["clear", "mixed"],
    timeFits: ["30 min", "1-2 hours"],
    budgetFits: ["free", "low"],
    energyFits: ["low", "medium"],
    travelFits: ["local", "regional"],
    setting: "mixed",
  },
  {
    id: "st-clements-island-museum",
    title: "St. Clement's Island Museum",
    type: "museum",
    locationLabel: "Coltons Point, MD",
    latitude: 38.2435,
    longitude: -76.7511,
    reason:
      "A useful history anchor for river geography, early Maryland stories, and quieter museum-style family learning.",
    href: "https://www.stmaryscountymd.gov/Recreate/Museums/StClementsIsland/",
    ctaLabel: "Museum",
    familyFit:
      "Works well for calmer history days, especially if you want to keep the outing smaller and more focused.",
    practicalNote:
      "Better as a purposeful short history outing than an all-day marathon.",
    tags: [
      "history",
      "maryland history",
      "museum",
      "river",
      "calm",
      "short outing",
    ],
    weatherFits: ["clear", "mixed", "rainy"],
    timeFits: ["30 min", "1-2 hours"],
    budgetFits: ["free", "low"],
    energyFits: ["low", "medium"],
    travelFits: ["local", "regional"],
    setting: "mixed",
  },
  {
    id: "stmarys-museum-calendar",
    title: "St. Mary's County Museum Calendar",
    type: "festival_calendar",
    locationLabel: "St. Mary's County, MD",
    latitude: null,
    longitude: null,
    reason:
      "The best official place to check what local museum programming, family events, and county museum happenings are active right now.",
    href: "https://www.stmaryscountymd.gov/Recreate/Museums/Calendar/",
    ctaLabel: "Calendar",
    familyFit:
      "Useful when you want a real same-week museum event instead of guessing which local stop might have programming.",
    practicalNote:
      "Check this before leaving home if you want the day tied to a scheduled museum activity.",
    tags: [
      "museum calendar",
      "events",
      "history",
      "family events",
      "official source",
    ],
    weatherFits: ["clear", "mixed", "windy", "rainy", "stormy"],
    timeFits: ["30 min", "1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low", "medium"],
    energyFits: ["low", "medium", "high"],
    travelFits: ["local", "regional", "far"],
    setting: "mixed",
  },
  {
    id: "maryland-dnr-unit-calendars",
    title: "Maryland DNR Unit Calendars",
    type: "festival_calendar",
    locationLabel: "Maryland public lands",
    latitude: null,
    longitude: null,
    reason:
      "An official DNR planning source for ranger programs, nature events, public land activities, and seasonal outdoor opportunities.",
    href: "https://dnr.maryland.gov/Pages/unit-calendars.aspx",
    ctaLabel: "Calendars",
    familyFit:
      "Strong when the family wants park programming, wildlife learning, or outdoor events with a real official schedule behind them.",
    practicalNote:
      "Best checked before a park outing if you want the day connected to ranger-led or seasonal programming.",
    tags: [
      "dnr",
      "park events",
      "nature programs",
      "wildlife",
      "fishing",
      "official source",
    ],
    weatherFits: ["clear", "mixed", "windy", "rainy"],
    timeFits: ["30 min", "1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low"],
    energyFits: ["low", "medium", "high"],
    travelFits: ["local", "regional", "far"],
    setting: "mixed",
  },
  {
    id: "historic-st-marys-city-events",
    title: "Historic St. Mary's City Events",
    type: "festival_calendar",
    locationLabel: "St. Mary's City, MD",
    latitude: null,
    longitude: null,
    reason:
      "An official way to catch living-history events, interpretation days, and history programming at one of the region's strongest educational sites.",
    href: "https://www.hsmcdigshistory.org/events/",
    ctaLabel: "Events",
    familyFit:
      "Useful when you want history to feel active and event-based instead of just walking through exhibits.",
    practicalNote:
      "Check the events schedule before heading out if you want special programming or re-enactors instead of a standard site visit.",
    tags: [
      "history events",
      "living history",
      "maryland history",
      "official source",
      "family events",
    ],
    weatherFits: ["clear", "mixed", "windy", "rainy"],
    timeFits: ["30 min", "1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low", "medium"],
    energyFits: ["low", "medium", "high"],
    travelFits: ["local", "regional", "far"],
    setting: "mixed",
  },
  {
    id: "stmarys-parks-rec-events",
    title: "St. Mary's County Parks & Recreation Events",
    type: "festival_calendar",
    locationLabel: "St. Mary's County, MD",
    latitude: null,
    longitude: null,
    reason:
      "A strong official local source for county events, family programs, seasonal activities, and lower-friction community outings.",
    href: "https://www.stmaryscountymd.gov/Recreate/Events/",
    ctaLabel: "Events",
    familyFit:
      "Helpful when you want a real family outing on the calendar but do not want to build the whole day from scratch.",
    practicalNote:
      "Good backup source when weather, energy, or time make a bigger destination less realistic.",
    tags: [
      "parks and rec",
      "community events",
      "family events",
      "kids programs",
      "official source",
    ],
    weatherFits: ["clear", "mixed", "windy", "rainy"],
    timeFits: ["30 min", "1-2 hours", "half day"],
    budgetFits: ["free", "low", "medium"],
    energyFits: ["low", "medium", "high"],
    travelFits: ["local", "regional"],
    setting: "mixed",
  },
  {
    id: "maryland-dnr-park-events",
    title: "Maryland DNR Park Events",
    type: "festival_calendar",
    locationLabel: "Maryland State Parks",
    latitude: null,
    longitude: null,
    reason:
      "A direct DNR page for park events, interpretive programs, and public-land outings that feel regionally grounded and real.",
    href: "https://dnr.maryland.gov/publiclands/Pages/park-events.aspx",
    ctaLabel: "Park events",
    familyFit:
      "Great for families trying to match a park day with a real public program instead of a generic visit.",
    practicalNote:
      "Worth checking when you want a park event, guided walk, or seasonal program to shape the day.",
    tags: [
      "dnr",
      "park events",
      "hiking",
      "wildlife",
      "nature programs",
      "official source",
    ],
    weatherFits: ["clear", "mixed", "windy", "rainy"],
    timeFits: ["30 min", "1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low"],
    energyFits: ["low", "medium", "high"],
    travelFits: ["local", "regional", "far"],
    setting: "mixed",
  },
  {
    id: "maryland-dnr-outdoors",
    title: "Maryland DNR Outdoors Guide",
    type: "park",
    locationLabel: "Maryland public lands",
    latitude: null,
    longitude: null,
    reason:
      "A practical Maryland DNR source for fishing, paddling, wildlife watching, trails, and public-land activity ideas by outing type.",
    href: "https://dnr.maryland.gov/publiclands/Pages/outdoors.aspx",
    ctaLabel: "Outdoors guide",
    familyFit:
      "Useful when the family wants a skill-based or outdoors-first day and needs official options instead of random search results.",
    practicalNote:
      "A good planning source for fishing, paddling, hiking, and wildlife days before narrowing down one final destination.",
    tags: [
      "dnr",
      "outdoors",
      "fishing",
      "paddling",
      "hiking",
      "wildlife",
      "official source",
    ],
    weatherFits: ["clear", "mixed", "windy"],
    timeFits: ["30 min", "1-2 hours", "half day", "full day"],
    budgetFits: ["free", "low"],
    energyFits: ["medium", "high"],
    travelFits: ["local", "regional", "far"],
    setting: "outdoor",
  },
];

function buildKeywordSet(input: Array<string | null | undefined>) {
  return input
    .flatMap((value) =>
      String(value ?? "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .filter((value, index, array) => array.indexOf(value) === index);
}

function normalizeWeather(value?: string | null): PlannerWeather {
  return value === "mixed" ||
    value === "windy" ||
    value === "rainy" ||
    value === "stormy"
    ? value
    : "clear";
}

function normalizeTime(value?: string | null): PlannerTime {
  return value === "30 min" ||
    value === "half day" ||
    value === "full day"
    ? value
    : "1-2 hours";
}

function normalizeBudget(value?: string | null): PlannerBudget {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "free";
}

function normalizeEnergy(value?: string | null): PlannerEnergy {
  return value === "low" || value === "high" ? value : "medium";
}

function normalizeTravel(value?: string | null): PlannerTravel {
  return value === "backyard" ||
    value === "regional" ||
    value === "far"
    ? value
    : "local";
}

function scoreOpportunity(
  item: PlannerOpportunityRecord,
  {
    interests = [],
    preset,
    weatherCondition,
    timeAvailable,
    budget,
    energyLevel,
    travelDistance,
    plannerMode,
    planStyle,
    mainGoal,
    practicalNeeds = [],
    extraContext,
  }: Omit<PlannerOpportunityFilters, "location">,
) {
  const keywords = buildKeywordSet([
    ...interests,
    preset,
    planStyle,
    mainGoal,
    extraContext,
    ...practicalNeeds,
  ]);
  const tagSet = buildKeywordSet([
    item.title,
    item.reason,
    item.familyFit,
    item.practicalNote,
    ...item.tags,
  ]);
  const weather = normalizeWeather(weatherCondition);
  const time = normalizeTime(timeAvailable);
  const money = normalizeBudget(budget);
  const energy = normalizeEnergy(energyLevel);
  const travel = normalizeTravel(travelDistance);

  let score = 0;

  if (item.weatherFits.includes(weather)) score += 4;
  if (item.timeFits.includes(time)) score += 4;
  if (item.budgetFits.includes(money)) score += 3;
  if (item.energyFits.includes(energy)) score += 3;
  if (item.travelFits.includes(travel)) score += 3;

  if (weather === "rainy" || weather === "stormy") {
    if (item.setting === "indoor") score += 3;
    if (item.setting === "outdoor") score -= 4;
  }

  if (travel === "backyard" && item.travelFits.includes("backyard")) score += 3;
  if (plannerMode === "advanced") score += 1;

  for (const keyword of keywords) {
    if (tagSet.includes(keyword)) score += 2;
  }

  if (
    preset === "fish" &&
    item.tags.some((tag) =>
      ["fishing", "shoreline", "wildlife", "dnr", "paddling"].includes(tag),
    )
  ) {
    score += 4;
  }

  if (
    preset === "bird" &&
    item.tags.some((tag) => ["birding", "wildlife", "nature"].includes(tag))
  ) {
    score += 4;
  }

  if (
    preset === "plant" &&
    item.tags.some((tag) => ["nature", "trails", "garden"].includes(tag))
  ) {
    score += 3;
  }

  if (
    planStyle === "history" &&
    item.tags.some((tag) => ["history", "maryland history", "living history"].includes(tag))
  ) {
    score += 5;
  }

  if (
    planStyle === "skill-building" &&
    item.tags.some((tag) =>
      ["fishing", "paddling", "wildlife", "hiking", "outdoors"].includes(tag),
    )
  ) {
    score += 4;
  }

  if (
    practicalNeeds.some((need) => /restroom|stroller|food|short/i.test(need)) &&
    item.setting !== "outdoor"
  ) {
    score += 2;
  }

  return score;
}

function toFamilyOpportunity(
  item: PlannerOpportunityRecord,
  location: ResolvedLocationContext,
): FamilyOpportunity {
  const distanceMiles =
    location.latitude !== null &&
    location.longitude !== null &&
    item.latitude !== null &&
    item.longitude !== null
      ? Math.round(
          milesBetweenPoints(
            location.latitude,
            location.longitude,
            item.latitude,
            item.longitude,
          )! * 10,
        ) / 10
      : null;

  return {
    id: item.id,
    title: item.title,
    type: item.type,
    locationLabel: item.locationLabel,
    reason: item.reason,
    distanceMiles,
    href: item.href,
    ctaLabel: item.ctaLabel,
    familyFit: item.familyFit,
    practicalNote: item.practicalNote,
    tags: item.tags,
  };
}

export function getNearbyFamilyOpportunities(location: ResolvedLocationContext) {
  return OPPORTUNITIES.map((item) => toFamilyOpportunity(item, location))
    .sort((left, right) => {
      if (left.distanceMiles === null && right.distanceMiles === null) {
        return left.title.localeCompare(right.title);
      }
      if (left.distanceMiles === null) return 1;
      if (right.distanceMiles === null) return -1;
      return left.distanceMiles - right.distanceMiles;
    })
    .slice(0, 10);
}

export function getPlannerOpportunityMatches({
  location,
  interests = [],
  preset,
  weatherCondition,
  timeAvailable,
  budget,
  energyLevel,
  travelDistance,
  plannerMode,
  planStyle,
  mainGoal,
  practicalNeeds = [],
  extraContext,
}: PlannerOpportunityFilters) {
  return OPPORTUNITIES.map((item) => ({
    item: toFamilyOpportunity(item, location),
    score: scoreOpportunity(item, {
      interests,
      preset,
      weatherCondition,
      timeAvailable,
      budget,
      energyLevel,
      travelDistance,
      plannerMode,
      planStyle,
      mainGoal,
      practicalNeeds,
      extraContext,
    }),
  }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.item.distanceMiles === null && right.item.distanceMiles === null) {
        return left.item.title.localeCompare(right.item.title);
      }
      if (left.item.distanceMiles === null) return 1;
      if (right.item.distanceMiles === null) return -1;
      return left.item.distanceMiles - right.item.distanceMiles;
    })
    .slice(0, 6)
    .map((entry) => entry.item);
}

export function buildRecommendedSpotsFromFamilyOpportunities(
  items: FamilyOpportunity[],
): RecommendedSpot[] {
  return items.map((item) => ({
    id: item.id,
    name: item.title,
    spotType: item.type,
    waterType: null,
    locationLabel: item.locationLabel,
    distanceMiles: item.distanceMiles,
    description: item.reason,
    reason: item.familyFit,
    familyFriendly: true,
    recommendedUseToday: item.familyFit,
    accessNote: item.practicalNote,
    mapUrl: item.href,
    linkLabel: item.ctaLabel,
  }));
}
