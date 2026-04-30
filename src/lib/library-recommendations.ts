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

type SomdCatalogSearchResult = {
  title: string;
  author: string | null;
  description: string | null;
  audienceNote: string | null;
  availableCopies: number | null;
  totalCopies: number | null;
  libraryCatalogUrl: string | null;
  searchUrl: string;
};

type TopicProfile = {
  theme: string;
  category: string;
  displayLabel: string;
  topicHint: string;
  templates: Record<ReadingBand, RecommendationTemplate>;
};

export type PlannerThemeContext = {
  theme: string;
  category: string;
  context: string | null;
  bucket: RecommendationTopic;
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
const somdCatalogBaseUrl = "https://catalog.somd.lib.md.us/polaris/";
const somdCatalogSearchBaseUrl =
  `${somdCatalogBaseUrl}search/searchresults.aspx?ctx=1.1033.0.0.1&type=Keyword&sort=RELEVANCE&limit=TOM%3d*&query=&page=0`;

const librarySystemRecords: LibrarySystemRecord[] = [
  {
    key: "st_marys_md",
    librarySystem: "St. Mary's County Library",
    countyLabel: "St. Mary's County, Maryland",
    state: "MD",
    directoryUrl: stMarysDirectoryUrl,
    catalogBaseUrl: somdCatalogBaseUrl,
    catalogSearchUrl: somdCatalogSearchBaseUrl,
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
    catalogBaseUrl: somdCatalogBaseUrl,
    catalogSearchUrl: somdCatalogSearchBaseUrl,
    supportsCatalogVerification: true,
    matches: ["calvert", "prince frederick", "lusby", "chesapeake beach", "north beach", "huntingtown", "solomons"]
  },
  {
    key: "charles_md",
    librarySystem: "Charles County Public Library",
    countyLabel: "Charles County, Maryland",
    state: "MD",
    directoryUrl: `${marylandDirectoryUrl}/charles-county-public-library`,
    catalogBaseUrl: somdCatalogBaseUrl,
    catalogSearchUrl: somdCatalogSearchBaseUrl,
    supportsCatalogVerification: true,
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
    theme: "birds",
    category: "wildlife",
    displayLabel: "birdwatching focus",
    topicHint: "birds, nests, feathers, migration, Maryland bird guides, or backyard birdwatching",
    templates: birdTemplates
  },
  turtles_reptiles_amphibians: {
    theme: "turtles",
    category: "reptiles",
    displayLabel: "turtle, reptile, amphibian, or pond-life focus",
    topicHint: "turtles, frogs, salamanders, reptiles, amphibians, wetlands, ponds, or marsh life",
    templates: reptileTemplates
  },
  mammals: {
    theme: "mammals",
    category: "wildlife",
    displayLabel: "mammal and wildlife-tracking focus",
    topicHint: "mammals, tracks, habitats, woodland animals, or local wildlife guides",
    templates: natureTemplates
  },
  fish_waterways: {
    theme: "fish and waterways",
    category: "aquatic life",
    displayLabel: "fish, stream, bay, or shoreline focus",
    topicHint: "fish, ponds, rivers, marshes, Chesapeake Bay, streams, shoreline life, or waterways",
    templates: waterTemplates
  },
  insects: {
    theme: "insects",
    category: "wildlife",
    displayLabel: "bug and insect focus",
    topicHint: "bugs, butterflies, bees, insects, pond insects, or pollinator life",
    templates: natureTemplates
  },
  plants_trees_wildflowers: {
    theme: "plants and wildflowers",
    category: "botany",
    displayLabel: "plant, tree, or wildflower focus",
    topicHint: "trees, wildflowers, seeds, gardens, leaves, bark, or plant identification",
    templates: plantTemplates
  },
  weather_seasons: {
    theme: "weather and seasons",
    category: "science",
    displayLabel: "weather or seasonal science focus",
    topicHint: "weather, seasons, clouds, storms, climate, or seasonal patterns",
    templates: scienceTemplates
  },
  local_history: {
    theme: "local history",
    category: "history",
    displayLabel: "local history focus",
    topicHint: "local history, county history, landmarks, museums, historical sites, or regional stories",
    templates: historyTemplates
  },
  maryland_history: {
    theme: "Maryland history",
    category: "history",
    displayLabel: "Maryland history focus",
    topicHint: "Maryland history, Chesapeake Bay history, Southern Maryland, St. Mary's City, or regional landmarks",
    templates: historyTemplates
  },
  survival_outdoor_skills: {
    theme: "outdoor survival skills",
    category: "outdoor skills",
    displayLabel: "outdoor skills focus",
    topicHint: "outdoor skills, camping, field craft, safety, survival basics, or practical nature skills",
    templates: natureTemplates
  },
  museums_landmarks: {
    theme: "museums and landmarks",
    category: "history",
    displayLabel: "museum or landmark focus",
    topicHint: "museum exhibits, landmarks, galleries, monuments, or field-trip interpretation",
    templates: historyTemplates
  },
  colonial_early_america: {
    theme: "colonial and early America",
    category: "history",
    displayLabel: "colonial or early America focus",
    topicHint: "colonial America, early America, founding-era history, settlement stories, or museum history",
    templates: historyTemplates
  },
  general_nature_observation: {
    theme: "general nature observation",
    category: "wildlife",
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

const contextKeywordRules: Array<{ context: string; pattern: RegExp }> = [
  { context: "pond", pattern: /\b(pond|vernal pool)\b/i },
  { context: "wetland", pattern: /\b(wetland|wetlands|marsh|bog)\b/i },
  { context: "stream", pattern: /\b(creek|stream|river)\b/i },
  { context: "shoreline", pattern: /\b(shore|shoreline|bay|pier|dock|estuary)\b/i },
  { context: "forest", pattern: /\b(forest|woods|woodland)\b/i },
  { context: "field", pattern: /\b(field|meadow|prairie)\b/i },
  { context: "garden", pattern: /\b(garden|flower bed)\b/i },
  { context: "museum", pattern: /\b(museum|gallery|exhibit|smithsonian|zoo)\b/i },
  { context: "colonial site", pattern: /\b(colonial site|historic site|settlement|fort|st\.?\s*mary'?s city)\b/i },
  { context: "trail", pattern: /\b(trail|park path|path)\b/i }
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

function analyzeTopicBucket(topicText: string, topicSignals: Array<string | null | undefined> = []) {
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
  return topic;
}

function deriveThemeContextValue(topicText: string, topicSignals: Array<string | null | undefined> = []) {
  const signals = [...topicSignals, topicText]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const signal of signals) {
    for (const rule of contextKeywordRules) {
      if (rule.pattern.test(signal)) {
        return rule.context;
      }
    }
  }

  return null;
}

export function buildPlannerThemeContext(
  topicText: string,
  topicSignals: Array<string | null | undefined> = []
): PlannerThemeContext {
  const bucket = analyzeTopicBucket(topicText, topicSignals);
  const profile = topicProfiles[bucket];

  return {
    theme: profile.theme,
    category: profile.category,
    context: deriveThemeContextValue(topicText, topicSignals),
    bucket
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
  if (baseUrl.includes("searchresults.aspx")) {
    return `${baseUrl}&term=${encodeURIComponent(title)}&by=TI`;
  }
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

function extractCookieHeader(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    return headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
  }

  const raw = response.headers.get("set-cookie");
  if (!raw) return "";

  return raw
    .split(/,(?=[^;,]+=)/)
    .map((value) => value.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function buildSomdCatalogSearchUrl(term: string, by: "KW" | "TI" = "KW") {
  return `${somdCatalogSearchBaseUrl}&term=${encodeURIComponent(term)}&by=${by}`;
}

function parseSomdCatalogResults(html: string, searchUrl: string): SomdCatalogSearchResult[] {
  const blocks = html.match(/<div class="content-module content-module--search-result">[\s\S]*?<hr \/>[\s\S]*?<\/div>\s*/gi) ?? [];
  const parsedResults: SomdCatalogSearchResult[] = [];

  for (const block of blocks) {
    const titleMatch = block.match(
      /nsm-brief-primary-title-group[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    );

    if (!titleMatch) {
      continue;
    }

    const authorMatch = block.match(
      /nsm-brief-primary-author-group[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    );
    const descriptionMatch = block.match(/nsm-short-item nsm-e1">([\s\S]*?)<\/span>/i);
    const audienceMatch = block.match(
      /Target Audience Note:\s*<\/span><span[^>]*>([\s\S]*?)<\/span>/i,
    );
    const availabilityMatch = block.match(
      /Tri-County Availability:\s*<\/span><span[^>]*>\s*<span[^>]*>(\d+)\s*\(of\s*(\d+)\)\s*<\/span>/i,
    );

    parsedResults.push({
      title: decodeHtmlToText(titleMatch[2]),
      author: authorMatch ? decodeHtmlToText(authorMatch[1]).replace(/,\s*author\.?$/i, "").trim() : null,
      description: descriptionMatch ? decodeHtmlToText(descriptionMatch[1]) : null,
      audienceNote: audienceMatch ? decodeHtmlToText(audienceMatch[1]) : null,
      availableCopies: availabilityMatch ? Number(availabilityMatch[1]) : null,
      totalCopies: availabilityMatch ? Number(availabilityMatch[2]) : null,
      libraryCatalogUrl: titleMatch[1].startsWith("http")
        ? titleMatch[1]
        : `${somdCatalogBaseUrl}${titleMatch[1].replace(/^\/+/, "")}`,
      searchUrl,
    });
  }

  return parsedResults;
}

async function fetchSomdCatalogResults(term: string, by: "KW" | "TI" = "KW") {
  const searchUrl = buildSomdCatalogSearchUrl(term, by);
  const headers = {
    Accept: "text/html",
    "User-Agent": process.env.WSA_ENV_DATA_USER_AGENT ?? "WildStallionAcademyAI/1.0",
  };

  const initialResponse = await fetch(searchUrl, {
    headers,
    next: {
      revalidate: 60 * 60 * 6,
    },
  });

  if (!initialResponse.ok) {
    return {
      searchUrl,
      results: [] as SomdCatalogSearchResult[],
    };
  }

  const ajaxHeaders: Record<string, string> = {
    ...headers,
    Referer: searchUrl,
  };
  const cookieHeader = extractCookieHeader(initialResponse);

  if (cookieHeader) {
    ajaxHeaders.Cookie = cookieHeader;
  }

  const ajaxResponse = await fetch(`${somdCatalogBaseUrl}search/components/ajaxResults.aspx?page=1`, {
    headers: ajaxHeaders,
    next: {
      revalidate: 60 * 60 * 6,
    },
  });

  if (!ajaxResponse.ok) {
    return {
      searchUrl,
      results: [] as SomdCatalogSearchResult[],
    };
  }

  const html = await ajaxResponse.text();
  return {
    searchUrl,
    results: parseSomdCatalogResults(html, searchUrl),
  };
}

function buildSomdCatalogSearchTerms(topic: RecommendationTopic, readingBand: ReadingBand) {
  switch (topic) {
    case "birds":
      return readingBand === "independent_reader"
        ? ["birds field guide", "birds north america"]
        : readingBand === "developing_reader"
          ? ["birds kids", "birds juvenile nonfiction"]
          : ["birds children", "birds readers"];
    case "turtles_reptiles_amphibians":
      return readingBand === "independent_reader"
        ? ["reptiles amphibians field guide", "turtles frogs salamanders"]
        : ["turtles kids", "frogs salamanders children"];
    case "fish_waterways":
      return readingBand === "independent_reader"
        ? ["fish field guide", "pond stream fish"]
        : ["fish kids", "pond life children"];
    case "plants_trees_wildflowers":
      return readingBand === "independent_reader"
        ? ["trees wildflowers field guide", "plants botany kids"]
        : ["trees flowers kids", "plants children"];
    case "weather_seasons":
      return readingBand === "independent_reader"
        ? ["weather climate kids", "storms weather science"]
        : ["weather kids", "seasons children"];
    case "maryland_history":
      return readingBand === "independent_reader"
        ? ["Maryland history juvenile", "Chesapeake Bay history kids"]
        : ["Maryland history kids", "Southern Maryland children"];
    case "local_history":
      return readingBand === "independent_reader"
        ? ["local history kids", "community history juvenile"]
        : ["community history children", "local history kids"];
    case "colonial_early_america":
      return readingBand === "independent_reader"
        ? ["colonial America juvenile", "American Revolution kids"]
        : ["colonial America kids", "early America children"];
    case "museums_landmarks":
      return ["museum kids", "landmarks history children"];
    case "survival_outdoor_skills":
      return readingBand === "independent_reader"
        ? ["outdoor survival kids", "camping field skills"]
        : ["camping kids", "outdoor skills children"];
    case "mammals":
      return readingBand === "independent_reader"
        ? ["mammals field guide", "wildlife mammals kids"]
        : ["mammals kids", "woodland animals children"];
    case "insects":
      return readingBand === "independent_reader"
        ? ["insects field guide", "pollinators kids"]
        : ["insects kids", "butterflies bees children"];
    case "general_nature_observation":
    default:
      return readingBand === "independent_reader"
        ? ["nature field guide", "wildlife kids nonfiction"]
        : ["nature kids", "wildlife children"];
  }
}

function scoreSomdCatalogResult(result: SomdCatalogSearchResult, readingBand: ReadingBand, term: string) {
  const haystack = `${result.title} ${result.description ?? ""} ${result.audienceNote ?? ""}`.toLowerCase();
  let score = 0;

  if (result.availableCopies && result.availableCopies > 0) {
    score += 100 + result.availableCopies * 5;
  } else if (result.totalCopies && result.totalCopies > 0) {
    score += 40;
  }

  if (result.audienceNote) {
    score += 25;
  }

  if (readingBand !== "independent_reader" && /\b(novel|memoir|adult)\b/i.test(haystack)) {
    score -= 50;
  }

  if (readingBand === "read_aloud" && /\b(children|kids|picture|first big book)\b/i.test(haystack)) {
    score += 35;
  }

  if (readingBand === "early_reader" && /\b(reader|readers|kids|children)\b/i.test(haystack)) {
    score += 35;
  }

  if (readingBand === "developing_reader" && /\b(juvenile|ages|kids)\b/i.test(haystack)) {
    score += 25;
  }

  if (readingBand === "independent_reader" && /\b(field guide|guide|encyclopedia|visual guide)\b/i.test(haystack)) {
    score += 25;
  }

  for (const word of term.toLowerCase().split(/\s+/).filter((part) => part.length > 2)) {
    if (haystack.includes(word)) {
      score += 5;
    }
  }

  return score;
}

async function discoverSomdCatalogBook(topic: RecommendationTopic, readingBand: ReadingBand) {
  const searchTerms = buildSomdCatalogSearchTerms(topic, readingBand);
  let bestMatch: SomdCatalogSearchResult | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const term of searchTerms) {
    const { results } = await fetchSomdCatalogResults(term, "KW");

    for (const result of results.slice(0, 10)) {
      const score = scoreSomdCatalogResult(result, readingBand, term);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }
  }

  return bestMatch;
}

async function verifyStMarysCatalogTitle(title: string): Promise<LibraryCatalogVerification> {
  const searchUrl = buildSomdCatalogSearchUrl(title, "TI");

  if (!searchUrl) {
    return {
      availabilityStatus: "Check live availability",
      availabilityNote: "Open the St. Mary's catalog to verify the exact title and current status.",
      libraryCatalogUrl: null
    };
  }

  try {
    const { results } = await fetchSomdCatalogResults(title, "TI");

    if (!results.length) {
      return {
        availabilityStatus: "Check live availability",
        availabilityNote: "The exact title was not found confidently in the public COSMOS title search.",
        libraryCatalogUrl: searchUrl
      };
    }

    const exactOrBest = results.find((item) => item.title.toLowerCase() === title.toLowerCase()) ?? results[0];

    if ((exactOrBest.availableCopies ?? 0) > 0) {
      return {
        availabilityStatus: "Available today",
        availabilityNote: `${exactOrBest.availableCopies} of ${exactOrBest.totalCopies ?? exactOrBest.availableCopies} Tri-County copies show as available in COSMOS right now.`,
        libraryCatalogUrl: exactOrBest.libraryCatalogUrl ?? searchUrl
      };
    }

    if ((exactOrBest.totalCopies ?? 0) > 0) {
      return {
        availabilityStatus: "May require a hold",
        availabilityNote: `0 of ${exactOrBest.totalCopies} Tri-County copies show as available right now, so this title may require a hold.`,
        libraryCatalogUrl: exactOrBest.libraryCatalogUrl ?? searchUrl
      };
    }

    return {
      availabilityStatus: "In catalog",
      availabilityNote: "The title appears in the public COSMOS catalog. Open the full record to confirm branch-level status.",
      libraryCatalogUrl: exactOrBest.libraryCatalogUrl ?? searchUrl
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
  if (
    libraryRecord.key === "st_marys_md" ||
    libraryRecord.key === "calvert_md" ||
    libraryRecord.key === "charles_md"
  ) {
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
  themeContext,
  readingLevel,
  learningFocus,
  libraryRecord,
  householdLabel
}: {
  themeContext: PlannerThemeContext;
  readingLevel: StudentReadingLevel;
  learningFocus: string;
  libraryRecord: ReturnType<typeof resolveLibrarySystem>;
  householdLabel?: string;
}): Promise<PlannerBookRecommendation> {
  const readingBand = getReadingBand(readingLevel);
  const template = buildRecommendationTemplate(themeContext.bucket, readingBand);
  const somdCatalogMatch =
    libraryRecord.supportsCatalogVerification && libraryRecord.catalogBaseUrl === somdCatalogBaseUrl
      ? await discoverSomdCatalogBook(themeContext.bucket, readingBand)
      : null;
  const verification = somdCatalogMatch
    ? {
        availabilityStatus:
          (somdCatalogMatch.availableCopies ?? 0) > 0
            ? ("Available today" as const)
            : (somdCatalogMatch.totalCopies ?? 0) > 0
              ? ("May require a hold" as const)
              : ("In catalog" as const),
        availabilityNote:
          (somdCatalogMatch.availableCopies ?? 0) > 0
            ? `${somdCatalogMatch.availableCopies} of ${somdCatalogMatch.totalCopies ?? somdCatalogMatch.availableCopies} Tri-County copies show as available in COSMOS right now.`
            : (somdCatalogMatch.totalCopies ?? 0) > 0
              ? `0 of ${somdCatalogMatch.totalCopies} Tri-County copies show as available right now, so this title may require a hold.`
              : "This result is present in the COSMOS catalog, but copy counts were not exposed in the search card.",
        libraryCatalogUrl: somdCatalogMatch.libraryCatalogUrl ?? somdCatalogMatch.searchUrl,
      }
    : await verifyLibraryRecommendation(libraryRecord, template.label);
  const normalizedFocus = learningFocus.trim().replace(/\s+/g, " ");
  const focusExcerpt =
    normalizedFocus.length > 120 ? `${normalizedFocus.slice(0, 117).trim()}...` : normalizedFocus;
  const focusSuffix = focusExcerpt ? ` It supports this plan: ${focusExcerpt}` : "";
  const themePhrase = themeContext.context
    ? `${themeContext.theme} and ${themeContext.context} exploration`
      : `${themeContext.theme} exploration`;
  const recommendationLabel = householdLabel
    ? `${householdLabel}: ${somdCatalogMatch?.title ?? template.label}`
    : somdCatalogMatch?.title ?? template.label;
  const recommendationAuthor = somdCatalogMatch?.author ?? template.author;
  const recommendationFormatFit = somdCatalogMatch?.audienceNote
    ? `${template.formatFit} COSMOS notes: ${somdCatalogMatch.audienceNote}.`
    : template.formatFit;

  return {
    label: recommendationLabel,
    author: recommendationAuthor,
    readingLevelLabel: readingLevel,
    formatFit: recommendationFormatFit,
    whyItFits: `This book supports today's ${themePhrase} and matches this reading stage.${focusSuffix}`,
    librarySystem: libraryRecord.librarySystem,
    libraryDirectoryUrl: libraryRecord.directoryUrl,
    libraryCatalogUrl: verification.libraryCatalogUrl,
    availabilityStatus: verification.availabilityStatus,
    availabilityNote: verification.availabilityNote,
    libraryTip: libraryRecord.librarySystem
      ? somdCatalogMatch
        ? `Mapped from the household ZIP/location to ${libraryRecord.librarySystem} and selected from the live COSMOS catalog results.`
        : `Mapped from the household ZIP/location to ${libraryRecord.librarySystem}${libraryRecord.directoryUrl ? " using the Maryland library directory reference." : "."}`
      : "The app could not confidently map this household to one specific public library system, so it falls back to the Maryland library directory.",
    catalogHint: somdCatalogMatch
      ? `Chosen from a COSMOS search for ${topicProfiles[themeContext.bucket].displayLabel}. Open the record for full copy details.`
      : buildCatalogHint(themeContext.bucket, readingBand)
  };
}

export async function buildDailyPlannerBookRecommendation({
  locationLabel,
  homeZipcode,
  topicText,
  topicSignals,
  themeContext,
  studentReadingLevel,
  householdReadingLevels,
  householdMode
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  topicSignals?: Array<string | null | undefined>;
  themeContext?: PlannerThemeContext | null;
  studentReadingLevel?: string | null;
  householdReadingLevels?: Array<string | null | undefined>;
  householdMode?: boolean;
}): Promise<PlannerBookRecommendation> {
  const resolvedThemeContext = themeContext ?? buildPlannerThemeContext(topicText, topicSignals);
  const libraryRecord = resolveLibrarySystem(locationLabel, homeZipcode);
  const readingLevel = householdMode
    ? Array.from(new Set((householdReadingLevels ?? []).map((value) => normalizeStudentReadingLevel(value))))
        .sort((left, right) => readingLevelOrder.indexOf(left) - readingLevelOrder.indexOf(right))[0] ?? defaultStudentReadingLevel
    : normalizeStudentReadingLevel(studentReadingLevel);

  return buildRecommendation({
    themeContext: resolvedThemeContext,
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
  themeContext,
  learners
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  topicSignals?: Array<string | null | undefined>;
  themeContext?: PlannerThemeContext | null;
  learners: LearnerContext[];
}): Promise<PlannerBookRecommendation[]> {
  const resolvedThemeContext = themeContext ?? buildPlannerThemeContext(topicText, topicSignals);
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
      themeContext: resolvedThemeContext,
      readingLevel: uniqueLevels[0] ?? defaultStudentReadingLevel,
      learningFocus: topicText,
      libraryRecord,
      householdLabel: normalizedLearners.length > 1 ? "Family read-aloud" : undefined
    })
  );

  if (normalizedLearners.length > 1 && uniqueLevels.length > 1) {
    recommendations.push(
      await buildRecommendation({
        themeContext: resolvedThemeContext,
        readingLevel: uniqueLevels[uniqueLevels.length - 1],
        learningFocus: topicText,
        libraryRecord,
        householdLabel: "Independent follow-up"
      })
    );
  }

  return recommendations.slice(0, 2);
}
