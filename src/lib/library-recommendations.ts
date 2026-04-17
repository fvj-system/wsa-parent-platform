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
type RecommendationTopic = "history" | "water" | "bird" | "plant" | "science" | "nature";

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

function getTopicFromText(input: string): RecommendationTopic {
  const text = input.toLowerCase();

  if (/(history|historic|smithsonian|museum|american|colonial|revolution|civil war|portrait|landmark)/.test(text)) {
    return "history";
  }

  if (/(fish|fishing|pond|creek|river|bay|marsh|tide|shore|water|ocean)/.test(text)) {
    return "water";
  }

  if (/(bird|owl|hawk|sparrow|eagle|duck|songbird)/.test(text)) {
    return "bird";
  }

  if (/(plant|tree|flower|garden|seed|leaf|botany)/.test(text)) {
    return "plant";
  }

  if (/(science|space|weather|experiment|rocket|planet|invention)/.test(text)) {
    return "science";
  }

  return "nature";
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
  const topicHint =
    topic === "history"
      ? "early America, local history, museums, or landmarks"
      : topic === "water"
        ? "fish, ponds, rivers, marshes, Chesapeake Bay, or shoreline life"
        : topic === "bird"
          ? "birds, nests, feathers, migration, or backyard birdwatching"
          : topic === "plant"
            ? "trees, wildflowers, seeds, gardens, or plant identification"
            : topic === "science"
              ? "weather, inventions, experiments, or space"
              : "local wildlife, habitats, field guides, or outdoor nature study";

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
  const templates: Record<RecommendationTopic, Record<ReadingBand, RecommendationTemplate>> = {
    history: {
      read_aloud: {
        label: "If You Lived in Colonial Times",
        author: "Ann McGovern",
        formatFit: "Best as a parent read-aloud with picture support and short bursts of discussion."
      },
      early_reader: {
        label: "George Washington's Breakfast",
        author: "Jean Fritz",
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
    },
    water: {
      read_aloud: {
        label: "The Magic School Bus on the Ocean Floor",
        author: "Joanna Cole",
        formatFit: "Best as a fun parent read-aloud with lots of pointing, explaining, and picture talk."
      },
      early_reader: {
        label: "National Geographic Readers: Sharks!",
        author: "Anne Schreiber",
        formatFit: "Best for a new reader who needs short lines, strong photos, and exciting animal facts."
      },
      developing_reader: {
        label: "Over and Under the Pond",
        author: "Kate Messner",
        formatFit: "Best for a child ready to connect pond habitats, animals, and simple nonfiction thinking."
      },
      independent_reader: {
        label: "The Ultimate Book of Sharks",
        author: "Brian Skerry",
        formatFit: "Best for a confident reader who can compare species, habitats, and aquatic food webs."
      }
    },
    bird: {
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
    },
    plant: {
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
    },
    science: {
      read_aloud: {
        label: "National Geographic Little Kids First Big Book of Space",
        author: "Catherine D. Hughes",
        formatFit: "Best as a picture-rich read-aloud that keeps science ideas exciting and concrete."
      },
      early_reader: {
        label: "National Geographic Readers: Planets",
        author: "Elizabeth Carney",
        formatFit: "Best for a newer reader who needs short explanations and strong visuals."
      },
      developing_reader: {
        label: "The Magic School Bus at the Waterworks",
        author: "Joanna Cole",
        formatFit: "Best for a child ready to connect a science topic to systems, questions, and simple experiments."
      },
      independent_reader: {
        label: "Basher Science: Planet Earth",
        author: "Dan Green",
        formatFit: "Best for a confident reader who can follow deeper explanations and science vocabulary."
      }
    },
    nature: {
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
    }
  };

  return templates[topic][readingBand];
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
  topic,
  readingLevel,
  learningFocus,
  libraryRecord,
  householdLabel
}: {
  topic: RecommendationTopic;
  readingLevel: StudentReadingLevel;
  learningFocus: string;
  libraryRecord: ReturnType<typeof resolveLibrarySystem>;
  householdLabel?: string;
}): Promise<PlannerBookRecommendation> {
  const readingBand = getReadingBand(readingLevel);
  const template = buildRecommendationTemplate(topic, readingBand);
  const verification = await verifyLibraryRecommendation(libraryRecord, template.label);

  return {
    label: householdLabel ? `${householdLabel}: ${template.label}` : template.label,
    author: template.author,
    readingLevelLabel: readingLevel,
    formatFit: template.formatFit,
    whyItFits: `This fits the current learning focus because it reinforces ${learningFocus.toLowerCase()} in a way that matches this reading stage.`,
    librarySystem: libraryRecord.librarySystem,
    libraryDirectoryUrl: libraryRecord.directoryUrl,
    libraryCatalogUrl: verification.libraryCatalogUrl,
    availabilityStatus: verification.availabilityStatus,
    availabilityNote: verification.availabilityNote,
    libraryTip: libraryRecord.librarySystem
      ? `Mapped from the household ZIP/location to ${libraryRecord.librarySystem}${libraryRecord.directoryUrl ? " using the Maryland library directory reference." : "."}`
      : "The app could not confidently map this household to one specific public library system, so it falls back to the Maryland library directory.",
    catalogHint: buildCatalogHint(topic, readingBand)
  };
}

export async function buildDailyPlannerBookRecommendation({
  locationLabel,
  homeZipcode,
  topicText,
  studentReadingLevel,
  householdReadingLevels,
  householdMode
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  studentReadingLevel?: string | null;
  householdReadingLevels?: Array<string | null | undefined>;
  householdMode?: boolean;
}): Promise<PlannerBookRecommendation> {
  const topic = getTopicFromText(topicText);
  const libraryRecord = resolveLibrarySystem(locationLabel, homeZipcode);
  const readingLevel = householdMode
    ? Array.from(new Set((householdReadingLevels ?? []).map((value) => normalizeStudentReadingLevel(value))))
        .sort((left, right) => readingLevelOrder.indexOf(left) - readingLevelOrder.indexOf(right))[0] ?? defaultStudentReadingLevel
    : normalizeStudentReadingLevel(studentReadingLevel);

  return buildRecommendation({
    topic,
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
  learners
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  learners: LearnerContext[];
}): Promise<PlannerBookRecommendation[]> {
  const topic = getTopicFromText(topicText);
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
      topic,
      readingLevel: uniqueLevels[0] ?? defaultStudentReadingLevel,
      learningFocus: topicText,
      libraryRecord,
      householdLabel: normalizedLearners.length > 1 ? "Family read-aloud" : undefined
    })
  );

  if (normalizedLearners.length > 1 && uniqueLevels.length > 1) {
    recommendations.push(
      await buildRecommendation({
        topic,
        readingLevel: uniqueLevels[uniqueLevels.length - 1],
        learningFocus: topicText,
        libraryRecord,
        householdLabel: "Independent follow-up"
      })
    );
  }

  return recommendations.slice(0, 2);
}
