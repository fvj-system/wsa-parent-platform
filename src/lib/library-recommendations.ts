import {
  defaultStudentReadingLevel,
  normalizeStudentReadingLevel,
  type StudentReadingLevel
} from "@/lib/students";

export type PlannerBookRecommendation = {
  label: string;
  author: string | null;
  readingLevelLabel: StudentReadingLevel;
  formatFit: string;
  whyItFits: string;
  librarySystem: string | null;
  libraryDirectoryUrl: string | null;
  libraryCatalogUrl: string | null;
  availabilityStatus: "Available today" | "In catalog" | "May require a hold" | "Check live availability";
  availabilityNote: string;
  libraryTip: string;
  catalogHint: string;
};

type LibrarySystemRecord = {
  key: string;
  librarySystem: string;
  countyLabel: string;
  state: "MD" | "VA";
  directoryUrl: string | null;
  catalogBaseUrl: string | null;
  catalogSearchUrl: string | null;
  supportsCatalogVerification: boolean;
  zipcodes?: string[];
  matches: string[];
};

type ReadingBand = "read_aloud" | "early_reader" | "developing_reader" | "independent_reader";
type RecommendationTopic =
  | "birds"
  | "turtles_reptiles_amphibians"
  | "mammals"
  | "fish_waterways"
  | "insects"
  | "plants_trees_wildflowers"
  | "weather_seasons"
  | "local_history"
  | "maryland_history"
  | "survival_outdoor_skills"
  | "museums_landmarks"
  | "colonial_early_america"
  | "general_nature_observation";

type LearnerContext = {
  name: string;
  age: number;
  readingLevel?: string | null;
};

type RecommendationTemplate = {
  label: string;
  author: string | null;
  formatFit: string;
};

type TopicProfile = {
  displayLabel: string;
  topicHint: string;
  templates: Record<ReadingBand, RecommendationTemplate>;
};

type TopicAnalysis = {
  topic: RecommendationTopic;
  displayLabel: string;
};

type LibraryCatalogVerification = {
  availabilityStatus: PlannerBookRecommendation["availabilityStatus"];
  availabilityNote: string;
  libraryCatalogUrl: string | null;
};

const readingLevelOrder: StudentReadingLevel[] = [
  "just starting",
  "knows letter sounds",
  "knows simple words (3-5 letters)",
  "knows more complex words (5-12 letters)",
  "reads small books with a little help",
  "reads small books without help",
  "reads any book with some help",
  "reads any book without help"
];

const marylandDirectoryUrl = "https://www.slrc.info/library-directory";
const stMarysDirectoryUrl = "https://www.slrc.info/library-directory/st.-marys-county-library";
const stMarysCatalogBaseUrl = "https://catalog.somd.lib.md.us/polaris/";

const librarySystemRecords: LibrarySystemRecord[] = [
  {
    key: "st_marys_md",
    librarySystem: "St. Mary's County Library",
    countyLabel: "St. Mary's County, Maryland",
    state: "MD",
    directoryUrl: stMarysDirectoryUrl,
    catalogBaseUrl: stMarysCatalogBaseUrl,
    catalogSearchUrl: `${stMarysCatalogBaseUrl}view.aspx?title=`,
    supportsCatalogVerification: true,
    zipcodes: ["20606", "20609", "20619", "20621", "20622", "20626", "20628", "20630", "20634", "20636", "20650", "20653", "20656", "20659", "20667", "20670", "20674", "20684", "20692"],
    matches: [
      "st. mary",
      "saint mary",
      "leonardtown",
      "lexington park",
      "california, md",
      "mechanicsville",
      "great mills",
      "charlotte hall",
      "hollywood, md",
      "loveville",
      "ridge, md",
      "piney point",
      "valley lee"
    ]
  },
  {
    key: "calvert_md",
    librarySystem: "Calvert Library",
    countyLabel: "Calvert County, Maryland",
    state: "MD",
    directoryUrl: `${marylandDirectoryUrl}/calvert-library`,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["calvert", "prince frederick", "lusby", "chesapeake beach", "north beach", "huntingtown", "solomons"]
  },
  {
    key: "charles_md",
    librarySystem: "Charles County Public Library",
    countyLabel: "Charles County, Maryland",
    state: "MD",
    directoryUrl: `${marylandDirectoryUrl}/charles-county-public-library`,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["charles county", "waldorf", "la plata", "indian head", "bryans road"]
  },
  {
    key: "anne_arundel_md",
    librarySystem: "Anne Arundel County Public Library",
    countyLabel: "Anne Arundel County, Maryland",
    state: "MD",
    directoryUrl: `${marylandDirectoryUrl}/anne-arundel-county-public-library`,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["anne arundel", "annapolis", "crofton", "severna park"]
  },
  {
    key: "prince_georges_md",
    librarySystem: "Prince George's County Memorial Library System",
    countyLabel: "Prince George's County, Maryland",
    state: "MD",
    directoryUrl: `${marylandDirectoryUrl}/prince-georges-county-memorial-library-system`,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["prince george", "bowie", "upper marlboro", "hyattsville", "college park", "laurel, md"]
  },
  {
    key: "montgomery_md",
    librarySystem: "Montgomery County Public Libraries",
    countyLabel: "Montgomery County, Maryland",
    state: "MD",
    directoryUrl: `${marylandDirectoryUrl}/montgomery-county-public-libraries`,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["montgomery county", "rockville", "silver spring", "bethesda", "gaithersburg"]
  },
  {
    key: "arlington_va",
    librarySystem: "Arlington Public Library",
    countyLabel: "Arlington, Virginia",
    state: "VA",
    directoryUrl: null,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["arlington", "rosslyn", "clarendon"]
  },
  {
    key: "fairfax_va",
    librarySystem: "Fairfax County Public Library",
    countyLabel: "Fairfax County, Virginia",
    state: "VA",
    directoryUrl: null,
    catalogBaseUrl: null,
    catalogSearchUrl: null,
    supportsCatalogVerification: false,
    matches: ["fairfax", "reston", "springfield", "vienna", "mclean", "alexandria, va"]
  }
];

const historyTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "If You Lived in Colonial Times",
    author: "Ann McGovern",
    formatFit: "Best as a parent read-aloud with picture support and short bursts of discussion."
  },
  early_reader: {
    label: "You Wouldn't Want to Be an American Colonist!",
    author: "Jacqueline Morley",
    formatFit: "Best for a newer reader who can handle short history scenes with a little help."
  },
  developing_reader: {
    label: "Who Was George Washington?",
    author: "Roberta Edwards",
    formatFit: "Best for a child who can manage short nonfiction chapters with occasional support."
  },
  independent_reader: {
    label: "Chains",
    author: "Laurie Halse Anderson",
    formatFit: "Best for an older reader who can hold onto a longer historical story and compare perspectives."
  }
};

const waterTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "Over and Under the Pond",
    author: "Kate Messner",
    formatFit: "Best as a picture-rich read-aloud while you talk through pond, marsh, and shoreline clues together."
  },
  early_reader: {
    label: "Pond Circle",
    author: "Betsy Franco",
    formatFit: "Best for a newer reader who benefits from short lines, repetition, and familiar pond-life images."
  },
  developing_reader: {
    label: "One Small Square: Pond",
    author: "Donald M. Silver",
    formatFit: "Best for a child ready to connect fish, insects, plants, and water habitats in one place."
  },
  independent_reader: {
    label: "Eyewitness: Fish",
    author: "Steve Parker",
    formatFit: "Best for a confident reader who can compare fish species, habitats, and waterways with more detail."
  }
};

const birdTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "National Geographic Little Kids First Big Book of Birds",
    author: "Catherine D. Hughes",
    formatFit: "Best as a parent-led picture-rich bird book with lots of quick stop-and-talk moments."
  },
  early_reader: {
    label: "National Geographic Readers: Birds",
    author: "Elizabeth Carney",
    formatFit: "Best for a beginning reader who needs strong photos and short information blocks."
  },
  developing_reader: {
    label: "National Geographic Kids Bird Guide of North America",
    author: "Jonathan Alderfer",
    formatFit: "Best for a child ready to compare field marks, habitats, and behavior notes."
  },
  independent_reader: {
    label: "Birds of Maryland Field Guide",
    author: "Stan Tekiela",
    formatFit: "Best for a strong reader who can use local field-guide clues instead of broad guesses."
  }
};

const reptileTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "Turtle Splash!: Countdown at the Pond",
    author: "Cathryn Falwell",
    formatFit: "Best as a parent read-aloud that clearly fits turtle, pond-life, and wetland observation days."
  },
  early_reader: {
    label: "National Geographic Readers: Turtles",
    author: "Laura Marsh",
    formatFit: "Best for a newer reader who needs short sentences and strong turtle photos."
  },
  developing_reader: {
    label: "Turtles",
    author: "Seymour Simon",
    formatFit: "Best for a child ready for short nonfiction sections about reptiles, shells, and habitats."
  },
  independent_reader: {
    label: "Peterson First Guide to Reptiles and Amphibians",
    author: "Robert C. Stebbins",
    formatFit: "Best for a stronger reader who can compare turtles, frogs, salamanders, and other field-guide clues."
  }
};

const plantTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "National Geographic Little Kids First Big Book of Nature",
    author: "Catherine D. Hughes",
    formatFit: "Best as a read-aloud with photo support while you talk about leaves, bark, flowers, and seasons."
  },
  early_reader: {
    label: "National Geographic Readers: Seed to Plant",
    author: "Kristin Baird Rattini",
    formatFit: "Best for short independent reading with help on harder plant words."
  },
  developing_reader: {
    label: "Planting the Wild Garden",
    author: "Kathryn O. Galbraith",
    formatFit: "Best for a child ready to connect seeds, plant growth, and habitat relationships."
  },
  independent_reader: {
    label: "Trees, Leaves, Flowers and Seeds",
    author: "DK",
    formatFit: "Best for a strong reader who can handle more precise plant vocabulary and visual comparisons."
  }
};

const scienceTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "National Geographic Little Kids First Big Book of Weather",
    author: "Karen de Seve",
    formatFit: "Best as a picture-rich read-aloud that keeps weather and seasonal science concrete."
  },
  early_reader: {
    label: "National Geographic Readers: Weather",
    author: "Kristin Baird Rattini",
    formatFit: "Best for a newer reader who needs short explanations and strong visuals."
  },
  developing_reader: {
    label: "The Magic School Bus Inside a Hurricane",
    author: "Joanna Cole",
    formatFit: "Best for a child ready to connect a science topic to systems, questions, and real observations."
  },
  independent_reader: {
    label: "Basher Science: Planet Earth",
    author: "Dan Green",
    formatFit: "Best for a confident reader who can follow deeper explanations and science vocabulary."
  }
};

const natureTemplates: Record<ReadingBand, RecommendationTemplate> = {
  read_aloud: {
    label: "National Geographic Little Kids First Big Book of Animals",
    author: "Catherine D. Hughes",
    formatFit: "Best as a parent read-aloud with plenty of pictures and quick nature chats."
  },
  early_reader: {
    label: "National Geographic Readers: Caterpillar to Butterfly",
    author: "Laura Marsh",
    formatFit: "Best for a child reading short sentences and simple nonfiction captions."
  },
  developing_reader: {
    label: "Over and Under the Woodland Pond",
    author: "Kate Messner",
    formatFit: "Best for a child ready for short sections, habitat clues, and gentle nature comparisons."
  },
  independent_reader: {
    label: "The Animal Book",
    author: "Steve Jenkins",
    formatFit: "Best for a strong reader who can handle richer wildlife facts and visual comparison."
  }
};

const topicProfiles: Record<RecommendationTopic, TopicProfile> = {
  birds: {
    displayLabel: "birdwatching focus",
    topicHint: "birds, nests, feathers, migration, Maryland bird guides, or backyard birdwatching",
    templates: birdTemplates
  },
  turtles_reptiles_amphibians: {
    displayLabel: "turtle, reptile, amphibian, or pond-life focus",
    topicHint: "turtles, frogs, salamanders, reptiles, amphibians, wetlands, ponds, or marsh life",
    templates: reptileTemplates
  },
  mammals: {
    displayLabel: "mammal and wildlife-tracking focus",
    topicHint: "mammals, tracks, habitats, woodland animals, or local wildlife guides",
    templates: natureTemplates
  },
  fish_waterways: {
    displayLabel: "fish, stream, bay, or shoreline focus",
    topicHint: "fish, ponds, rivers, marshes, Chesapeake Bay, streams, shoreline life, or waterways",
    templates: waterTemplates
  },
  insects: {
    displayLabel: "bug and insect focus",
    topicHint: "bugs, butterflies, bees, insects, pond insects, or pollinator life",
    templates: natureTemplates
  },
  plants_trees_wildflowers: {
    displayLabel: "plant, tree, or wildflower focus",
    topicHint: "trees, wildflowers, seeds, gardens, leaves, bark, or plant identification",
    templates: plantTemplates
  },
  weather_seasons: {
    displayLabel: "weather or seasonal science focus",
    topicHint: "weather, seasons, clouds, storms, climate, or seasonal patterns",
    templates: scienceTemplates
  },
  local_history: {
    displayLabel: "local history focus",
    topicHint: "local history, county history, landmarks, museums, historical sites, or regional stories",
    templates: historyTemplates
  },
  maryland_history: {
    displayLabel: "Maryland history focus",
    topicHint: "Maryland history, Chesapeake Bay history, Southern Maryland, St. Mary's City, or regional landmarks",
    templates: historyTemplates
  },
  survival_outdoor_skills: {
    displayLabel: "outdoor skills focus",
    topicHint: "outdoor skills, camping, field craft, safety, survival basics, or practical nature skills",
    templates: natureTemplates
  },
  museums_landmarks: {
    displayLabel: "museum or landmark focus",
    topicHint: "museum exhibits, landmarks, galleries, monuments, or field-trip interpretation",
    templates: historyTemplates
  },
  colonial_early_america: {
    displayLabel: "colonial or early America focus",
    topicHint: "colonial America, early America, founding-era history, settlement stories, or museum history",
    templates: historyTemplates
  },
  general_nature_observation: {
    displayLabel: "general nature observation focus",
    topicHint: "local wildlife, habitats, field guides, or outdoor nature study",
    templates: natureTemplates
  }
};

const topicPriorityOrder: RecommendationTopic[] = [
  "turtles_reptiles_amphibians",
  "birds",
  "fish_waterways",
  "plants_trees_wildflowers",
  "maryland_history",
  "local_history",
  "colonial_early_america",
  "museums_landmarks",
  "survival_outdoor_skills",
  "weather_seasons",
  "mammals",
  "insects",
  "general_nature_observation"
];

const topicKeywordRules: Array<{ topic: RecommendationTopic; pattern: RegExp; weight: number }> = [
  {
    topic: "turtles_reptiles_amphibians",
    pattern:
      /\b(turtle|terrapin|painted turtle|box turtle|snapping turtle|slider|reptile|amphibian|frog|toad|salamander|newt|vernal pool|wetland|wetlands)\b/i,
    weight: 8
  },
  {
    topic: "birds",
    pattern:
      /\b(bird|birding|songbird|owl|hawk|eagle|duck|goose|heron|egret|osprey|sparrow|warbler|woodpecker|nest|migration|feather)\b/i,
    weight: 7
  },
  {
    topic: "fish_waterways",
    pattern:
      /\b(fish|fishing|angler|pond|creek|stream|river|bay|marsh|shore|shoreline|waterway|waterways|water|tide|estuary|aquatic|pier|dock|wetland|wetlands|chesapeake)\b/i,
    weight: 6
  },
  {
    topic: "plants_trees_wildflowers",
    pattern:
      /\b(plant|plants|tree|trees|wildflower|wildflowers|flower|flowers|garden|gardens|seed|seeds|leaf|leaves|bark|botany|fern|moss)\b/i,
    weight: 6
  },
  {
    topic: "maryland_history",
    pattern:
      /\b(maryland|southern maryland|st\.?\s*mary'?s|saint mary'?s|chesapeake bay history|annapolis|leonardtown|calvert|patuxent)\b/i,
    weight: 7
  },
  {
    topic: "colonial_early_america",
    pattern:
      /\b(colonial|early america|revolution|revolutionary|founding|founders|settler|settlement|1776|george washington|thomas jefferson)\b/i,
    weight: 7
  },
  {
    topic: "museums_landmarks",
    pattern:
      /\b(museum|museums|smithsonian|gallery|galleries|exhibit|exhibits|portrait|landmark|monument|historic site|memorial|zoo)\b/i,
    weight: 6
  },
  {
    topic: "local_history",
    pattern:
      /\b(local history|history walk|county history|heritage|courthouse|lighthouse|fort|battlefield|historic|history)\b/i,
    weight: 5
  },
  {
    topic: "survival_outdoor_skills",
    pattern:
      /\b(survival|bushcraft|campfire|shelter|navigation|compass|first aid|outdoor skill|outdoor skills|tracking|trail craft)\b/i,
    weight: 6
  },
  {
    topic: "weather_seasons",
    pattern:
      /\b(weather|season|seasons|storm|cloud|rain|wind|forecast|climate|spring|summer|fall|autumn|winter)\b/i,
    weight: 5
  },
  {
    topic: "mammals",
    pattern:
      /\b(mammal|mammals|deer|fox|otter|beaver|rabbit|squirrel|raccoon|muskrat|coyote|bat)\b/i,
    weight: 5
  },
  {
    topic: "insects",
    pattern:
      /\b(insect|insects|bug|bugs|butterfly|butterflies|bee|bees|dragonfly|dragonflies|beetle|beetles|pollinator|pollinators)\b/i,
    weight: 5
  }
];

function getReadingBand(readingLevel: StudentReadingLevel): ReadingBand {
  switch (readingLevel) {
    case "just starting":
    case "knows letter sounds":
      return "read_aloud";
    case "knows simple words (3-5 letters)":
    case "knows more complex words (5-12 letters)":
      return "early_reader";
    case "reads small books with a little help":
    case "reads small books without help":
      return "developing_reader";
    case "reads any book with some help":
    case "reads any book without help":
      return "independent_reader";
    default:
      return "developing_reader";
  }
}

function pickBestTopic(scores: Map<RecommendationTopic, number>) {
  let bestTopic: RecommendationTopic = "general_nature_observation";
  let bestScore = 0;

  for (const topic of topicPriorityOrder) {
    const score = scores.get(topic) ?? 0;
    if (score > bestScore) {
      bestTopic = topic;
      bestScore = score;
    }
  }

  return bestTopic;
}

function analyzeTopic(topicText: string, topicSignals: Array<string | null | undefined> = []): TopicAnalysis {
  const normalizedSignals = topicSignals
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const fallbackText = topicText.trim();
  const signals = normalizedSignals.length ? normalizedSignals : [fallbackText];
  const scores = new Map<RecommendationTopic, number>();

  signals.forEach((signal, index) => {
    const priorityWeight = Math.max(1, 6 - index);
    for (const rule of topicKeywordRules) {
      if (rule.pattern.test(signal)) {
        scores.set(rule.topic, (scores.get(rule.topic) ?? 0) + rule.weight * priorityWeight);
      }
    }
  });

  const topic = pickBestTopic(scores);
  return {
    topic,
    displayLabel: topicProfiles[topic].displayLabel
  };
}

function resolveLibrarySystem(locationLabel: string, homeZipcode?: string | null) {
  const normalizedZip = homeZipcode?.replace(/\D/g, "").slice(0, 5) ?? "";
  const normalizedLocation = locationLabel.toLowerCase();
  const text = `${normalizedLocation} ${normalizedZip}`;

  const match = librarySystemRecords.find(
    (entry) =>
      (normalizedZip ? entry.zipcodes?.includes(normalizedZip) : false) ||
      entry.matches.some((value) => text.includes(value))
  );

  if (!match) {
    return {
      key: "unknown",
      librarySystem: null,
      countyLabel: null,
      directoryUrl: marylandDirectoryUrl,
      catalogBaseUrl: null,
      catalogSearchUrl: null,
      supportsCatalogVerification: false,
      state: "MD" as const,
      matches: []
    };
  }

  return match;
}

function buildCatalogHint(topic: RecommendationTopic, readingBand: ReadingBand) {
  const topicHint = topicProfiles[topic].topicHint;
  const formatHint =
    readingBand === "read_aloud"
      ? "picture books or photo-heavy read-aloud nonfiction"
      : readingBand === "early_reader"
        ? "early readers with short sentences"
        : readingBand === "developing_reader"
          ? "short nonfiction chapters or early chapter books"
          : "strong nonfiction or narrative nonfiction";

  return `Search the catalog for ${formatHint} about ${topicHint}.`;
}

function buildRecommendationTemplate(topic: RecommendationTopic, readingBand: ReadingBand): RecommendationTemplate {
  return topicProfiles[topic].templates[readingBand];
}

function buildCatalogSearchUrl(baseUrl: string | null, title: string) {
  if (!baseUrl) return null;
  return `${baseUrl}${encodeURIComponent(title)}`;
}

function decodeHtmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

async function verifyStMarysCatalogTitle(title: string): Promise<LibraryCatalogVerification> {
  const searchUrl = buildCatalogSearchUrl(`${stMarysCatalogBaseUrl}view.aspx?title=`, title);

  if (!searchUrl) {
    return {
      availabilityStatus: "Check live availability",
      availabilityNote: "Open the St. Mary's catalog to verify the exact title and current status.",
      libraryCatalogUrl: null
    };
  }

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": process.env.WSA_ENV_DATA_USER_AGENT ?? "WildStallionAcademyAI/1.0"
      },
      next: {
        revalidate: 60 * 60 * 6
      }
    });

    if (!response.ok) {
      return {
        availabilityStatus: "Check live availability",
        availabilityNote: "The public St. Mary's catalog search could not be confirmed right now.",
        libraryCatalogUrl: searchUrl
      };
    }

    const html = await response.text();
    const text = decodeHtmlToText(html);
    const normalizedText = text.toLowerCase();
    const normalizedTitle = title.toLowerCase();
    const titleFound = normalizedText.includes(normalizedTitle);
    const availableNowMatch = normalizedText.match(/available now\s*\(?\s*(\d+)\s*\)?/i);
    const availableNowCount = availableNowMatch ? Number(availableNowMatch[1]) : 0;

    if (!titleFound) {
      return {
        availabilityStatus: "Check live availability",
        availabilityNote: "The exact title was not confidently confirmed in the public St. Mary's search response.",
        libraryCatalogUrl: searchUrl
      };
    }

    if (availableNowCount > 0) {
      return {
        availabilityStatus: "Check live availability",
        availabilityNote:
          "The public COSMOS search shows an 'Available Now' result for this title search, but the app is not yet proving same-branch shelf pickup copy-by-copy. Open the catalog page to confirm today's exact status.",
        libraryCatalogUrl: searchUrl
      };
    }

    if (/place a hold|hold requests|on the wait list|availability/i.test(normalizedText)) {
      return {
        availabilityStatus: "May require a hold",
        availabilityNote:
          "The exact title appears in the public COSMOS catalog, but same-day pickup was not confirmed from the public page. Be ready to place a hold.",
        libraryCatalogUrl: searchUrl
      };
    }

    return {
      availabilityStatus: "In catalog",
      availabilityNote: "The exact title appears in the public COSMOS catalog. Open the catalog to check branch-level live status.",
      libraryCatalogUrl: searchUrl
    };
  } catch {
    return {
      availabilityStatus: "Check live availability",
      availabilityNote: "The St. Mary's catalog could not be checked right now, so use the direct catalog search link.",
      libraryCatalogUrl: searchUrl
    };
  }
}

async function verifyLibraryRecommendation(
  libraryRecord: ReturnType<typeof resolveLibrarySystem>,
  title: string
): Promise<LibraryCatalogVerification> {
  if (libraryRecord.key === "st_marys_md") {
    return verifyStMarysCatalogTitle(title);
  }

  return {
    availabilityStatus: libraryRecord.catalogSearchUrl ? "Check live availability" : "In catalog",
    availabilityNote: libraryRecord.catalogSearchUrl
      ? `Use ${libraryRecord.librarySystem} catalog search to confirm whether this title is available today.`
      : libraryRecord.librarySystem
        ? `${libraryRecord.librarySystem} is mapped from the saved household location, but live public catalog verification is not wired in yet.`
        : "The household location maps to a library directory reference, but live catalog verification is not available yet.",
    libraryCatalogUrl: buildCatalogSearchUrl(libraryRecord.catalogSearchUrl, title)
  };
}

async function buildRecommendation({
  topicAnalysis,
  readingLevel,
  learningFocus,
  libraryRecord,
  householdLabel
}: {
  topicAnalysis: TopicAnalysis;
  readingLevel: StudentReadingLevel;
  learningFocus: string;
  libraryRecord: ReturnType<typeof resolveLibrarySystem>;
  householdLabel?: string;
}): Promise<PlannerBookRecommendation> {
  const readingBand = getReadingBand(readingLevel);
  const template = buildRecommendationTemplate(topicAnalysis.topic, readingBand);
  const verification = await verifyLibraryRecommendation(libraryRecord, template.label);
  const normalizedFocus = learningFocus.trim().replace(/\s+/g, " ");
  const focusExcerpt =
    normalizedFocus.length > 120 ? `${normalizedFocus.slice(0, 117).trim()}...` : normalizedFocus;
  const focusSuffix = focusExcerpt ? ` It supports this plan: ${focusExcerpt}` : "";

  return {
    label: householdLabel ? `${householdLabel}: ${template.label}` : template.label,
    author: template.author,
    readingLevelLabel: readingLevel,
    formatFit: template.formatFit,
    whyItFits: `This book fits today's ${topicAnalysis.displayLabel} and matches this reading stage.${focusSuffix}`,
    librarySystem: libraryRecord.librarySystem,
    libraryDirectoryUrl: libraryRecord.directoryUrl,
    libraryCatalogUrl: verification.libraryCatalogUrl,
    availabilityStatus: verification.availabilityStatus,
    availabilityNote: verification.availabilityNote,
    libraryTip: libraryRecord.librarySystem
      ? `Mapped from the household ZIP/location to ${libraryRecord.librarySystem}${libraryRecord.directoryUrl ? " using the Maryland library directory reference." : "."}`
      : "The app could not confidently map this household to one specific public library system, so it falls back to the Maryland library directory.",
    catalogHint: buildCatalogHint(topicAnalysis.topic, readingBand)
  };
}

export async function buildDailyPlannerBookRecommendation({
  locationLabel,
  homeZipcode,
  topicText,
  topicSignals,
  studentReadingLevel,
  householdReadingLevels,
  householdMode
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  topicSignals?: Array<string | null | undefined>;
  studentReadingLevel?: string | null;
  householdReadingLevels?: Array<string | null | undefined>;
  householdMode?: boolean;
}): Promise<PlannerBookRecommendation> {
  const topicAnalysis = analyzeTopic(topicText, topicSignals);
  const libraryRecord = resolveLibrarySystem(locationLabel, homeZipcode);
  const readingLevel = householdMode
    ? Array.from(new Set((householdReadingLevels ?? []).map((value) => normalizeStudentReadingLevel(value))))
        .sort((left, right) => readingLevelOrder.indexOf(left) - readingLevelOrder.indexOf(right))[0] ?? defaultStudentReadingLevel
    : normalizeStudentReadingLevel(studentReadingLevel);

  return buildRecommendation({
    topicAnalysis,
    readingLevel,
    learningFocus: topicText,
    libraryRecord,
    householdLabel: householdMode ? "Family read-aloud" : undefined
  });
}

export async function buildWeeklyPlannerBookRecommendations({
  locationLabel,
  homeZipcode,
  topicText,
  topicSignals,
  learners
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  topicSignals?: Array<string | null | undefined>;
  learners: LearnerContext[];
}): Promise<PlannerBookRecommendation[]> {
  const topicAnalysis = analyzeTopic(topicText, topicSignals);
  const libraryRecord = resolveLibrarySystem(locationLabel, homeZipcode);
  const normalizedLearners = learners.length
    ? learners
    : [{ name: "Student", age: 8, readingLevel: defaultStudentReadingLevel }];
  const normalizedLevels = normalizedLearners.map((learner) => normalizeStudentReadingLevel(learner.readingLevel));
  const orderedLevels = [...normalizedLevels].sort(
    (left, right) => readingLevelOrder.indexOf(left) - readingLevelOrder.indexOf(right)
  );
  const uniqueLevels = Array.from(new Set(orderedLevels));

  const recommendations: PlannerBookRecommendation[] = [];

  recommendations.push(
    await buildRecommendation({
      topicAnalysis,
      readingLevel: uniqueLevels[0] ?? defaultStudentReadingLevel,
      learningFocus: topicText,
      libraryRecord,
      householdLabel: normalizedLearners.length > 1 ? "Family read-aloud" : undefined
    })
  );

  if (normalizedLearners.length > 1 && uniqueLevels.length > 1) {
    recommendations.push(
      await buildRecommendation({
        topicAnalysis,
        readingLevel: uniqueLevels[uniqueLevels.length - 1],
        learningFocus: topicText,
        libraryRecord,
        householdLabel: "Independent follow-up"
      })
    );
  }

  return recommendations.slice(0, 2);
}
