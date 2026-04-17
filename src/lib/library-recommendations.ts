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
  libraryTip: string;
  catalogHint: string;
};

type LibrarySystemMatch = {
  librarySystem: string;
  countyLabel: string;
  matches: string[];
};

type ReadingBand = "read_aloud" | "early_reader" | "developing_reader" | "independent_reader";
type RecommendationTopic = "history" | "water" | "bird" | "plant" | "science" | "nature";

type LearnerContext = {
  name: string;
  age: number;
  readingLevel?: string | null;
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

const librarySystemMatches: LibrarySystemMatch[] = [
  {
    librarySystem: "St. Mary's County Library",
    countyLabel: "St. Mary's County, Maryland",
    matches: ["st. mary", "saint mary", "leonardtown", "lexington park", "california, md", "mechanicsville", "great mills"]
  },
  {
    librarySystem: "Calvert Library",
    countyLabel: "Calvert County, Maryland",
    matches: ["calvert", "prince frederick", "lusby", "chesapeake beach", "north beach", "huntingtown"]
  },
  {
    librarySystem: "Charles County Public Library",
    countyLabel: "Charles County, Maryland",
    matches: ["charles county", "waldorf", "la plata", "indian head", "bryans road"]
  },
  {
    librarySystem: "Prince George's County Memorial Library System",
    countyLabel: "Prince George's County, Maryland",
    matches: ["prince george", "bowie", "upper marlboro", "hyattsville", "college park", "laurel, md"]
  },
  {
    librarySystem: "Anne Arundel County Public Library",
    countyLabel: "Anne Arundel County, Maryland",
    matches: ["anne arundel", "annapolis", "crofton", "severna park"]
  },
  {
    librarySystem: "Montgomery County Public Libraries",
    countyLabel: "Montgomery County, Maryland",
    matches: ["montgomery county", "rockville", "silver spring", "bethesda", "gaithersburg"]
  },
  {
    librarySystem: "Arlington Public Library",
    countyLabel: "Arlington, Virginia",
    matches: ["arlington", "rosslyn", "clarendon"]
  },
  {
    librarySystem: "Fairfax County Public Library",
    countyLabel: "Fairfax County, Virginia",
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
  const text = `${locationLabel} ${homeZipcode ?? ""}`.toLowerCase();
  const match = librarySystemMatches.find((entry) => entry.matches.some((value) => text.includes(value)));

  if (!match) {
    return {
      librarySystem: null,
      countyLabel: null,
      libraryTip: "Check your county library catalog for this topic or a same-level substitute if the exact title is checked out."
    };
  }

  return {
    librarySystem: match.librarySystem,
    countyLabel: match.countyLabel,
    libraryTip: `Check ${match.librarySystem} for this title first, then ask a librarian for a same-level substitute if it is unavailable.`
  };
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

function buildRecommendationTemplate(topic: RecommendationTopic, readingBand: ReadingBand) {
  const templates: Record<RecommendationTopic, Record<ReadingBand, { label: string; author: string | null; formatFit: string }>> = {
    history: {
      read_aloud: {
        label: "If You Lived in Colonial Times",
        author: "Ann McGovern",
        formatFit: "Best as a parent read-aloud with picture support and short bursts of discussion."
      },
      early_reader: {
        label: "A Step Into Reading title about early America or a local landmark",
        author: null,
        formatFit: "Best for short independent reading with a parent ready to help on new history words."
      },
      developing_reader: {
        label: "A Who Was? or What Was? book tied to this history topic",
        author: null,
        formatFit: "Best for a child who can handle short nonfiction chapters with occasional support."
      },
      independent_reader: {
        label: "A DK Eyewitness or narrative nonfiction history title tied to this week's topic",
        author: null,
        formatFit: "Best for an older reader who can follow deeper background and compare perspectives."
      }
    },
    water: {
      read_aloud: {
        label: "The Magic School Bus on the Ocean Floor",
        author: "Joanna Cole",
        formatFit: "Best as a fun parent read-aloud with lots of pointing, explaining, and picture talk."
      },
      early_reader: {
        label: "A National Geographic Kids or Scholastic reader about fish, ponds, or shoreline life",
        author: null,
        formatFit: "Best for a new reader who needs short lines, photos, and familiar nature words."
      },
      developing_reader: {
        label: "A beginner nonfiction book about Chesapeake Bay fish or pond ecosystems",
        author: null,
        formatFit: "Best for a child ready for short factual sections and labeled diagrams."
      },
      independent_reader: {
        label: "A field-guide style nonfiction book about local fish or aquatic habitats",
        author: null,
        formatFit: "Best for a confident reader who can compare species, habitat clues, and water conditions."
      }
    },
    bird: {
      read_aloud: {
        label: "National Geographic Little Kids First Big Book of Birds",
        author: "Catherine D. Hughes",
        formatFit: "Best as a parent-led picture-rich bird book with lots of quick stop-and-talk moments."
      },
      early_reader: {
        label: "A National Geographic Readers title about birds",
        author: null,
        formatFit: "Best for a beginning reader who needs strong photos and short information blocks."
      },
      developing_reader: {
        label: "A beginner bird guide or kid-friendly birdwatching book",
        author: null,
        formatFit: "Best for a child ready to compare field marks, habitats, and behavior notes."
      },
      independent_reader: {
        label: "A North America bird guide written for older kids",
        author: null,
        formatFit: "Best for a strong reader who can use field marks, migration, and habitat details."
      }
    },
    plant: {
      read_aloud: {
        label: "National Geographic Little Kids First Big Book of Nature",
        author: "Catherine D. Hughes",
        formatFit: "Best as a read-aloud with photo support while you talk about leaves, bark, flowers, and seasons."
      },
      early_reader: {
        label: "An early reader about trees, flowers, or gardens",
        author: null,
        formatFit: "Best for short independent reading with help on harder plant words."
      },
      developing_reader: {
        label: "A kid-friendly plant or tree identification book",
        author: null,
        formatFit: "Best for a child ready to compare leaf shapes, seeds, bark, and habitats."
      },
      independent_reader: {
        label: "A stronger field guide or nonfiction plant book tied to local trees and wildflowers",
        author: null,
        formatFit: "Best for a strong reader who can handle more precise plant vocabulary."
      }
    },
    science: {
      read_aloud: {
        label: "National Geographic Little Kids First Big Book of Space",
        author: "Catherine D. Hughes",
        formatFit: "Best as a picture-rich read-aloud that keeps science ideas exciting and concrete."
      },
      early_reader: {
        label: "A National Geographic Kids or Step Into Reading science title",
        author: null,
        formatFit: "Best for a newer reader who needs short explanations and strong visuals."
      },
      developing_reader: {
        label: "A Magic School Bus chapter book or short nonfiction science title",
        author: null,
        formatFit: "Best for a child ready to connect the topic to simple experiments or observations."
      },
      independent_reader: {
        label: "A stronger science nonfiction book tied to the current topic",
        author: null,
        formatFit: "Best for a confident reader who can follow deeper explanations and vocabulary."
      }
    },
    nature: {
      read_aloud: {
        label: "National Geographic Little Kids First Big Book of Animals",
        author: "Catherine D. Hughes",
        formatFit: "Best as a parent read-aloud with plenty of pictures and quick nature chats."
      },
      early_reader: {
        label: "A National Geographic Kids or Scholastic reader about local animals or habitats",
        author: null,
        formatFit: "Best for a child reading short sentences and simple nonfiction captions."
      },
      developing_reader: {
        label: "A kid-friendly wildlife or habitat nonfiction title",
        author: null,
        formatFit: "Best for a child ready for short sections, labeled diagrams, and simple comparisons."
      },
      independent_reader: {
        label: "A field-guide style wildlife or ecology book for older kids",
        author: null,
        formatFit: "Best for a strong reader who can handle deeper local nature facts."
      }
    }
  };

  return templates[topic][readingBand];
}

function buildRecommendation({
  topic,
  readingLevel,
  learningFocus,
  librarySystem,
  libraryTip,
  householdLabel
}: {
  topic: RecommendationTopic;
  readingLevel: StudentReadingLevel;
  learningFocus: string;
  librarySystem: string | null;
  libraryTip: string;
  householdLabel?: string;
}): PlannerBookRecommendation {
  const readingBand = getReadingBand(readingLevel);
  const template = buildRecommendationTemplate(topic, readingBand);

  return {
    label: householdLabel ? `${householdLabel}: ${template.label}` : template.label,
    author: template.author,
    readingLevelLabel: readingLevel,
    formatFit: template.formatFit,
    whyItFits: `This fits the current learning focus because it reinforces ${learningFocus.toLowerCase()} in a way that matches this reading stage.`,
    librarySystem,
    libraryTip,
    catalogHint: buildCatalogHint(topic, readingBand)
  };
}

export function buildDailyPlannerBookRecommendation({
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
}): PlannerBookRecommendation {
  const topic = getTopicFromText(topicText);
  const library = resolveLibrarySystem(locationLabel, homeZipcode);
  const readingLevel = householdMode
    ? Array.from(
        new Set((householdReadingLevels ?? []).map((value) => normalizeStudentReadingLevel(value)))
      ).sort((left, right) => readingLevelOrder.indexOf(left) - readingLevelOrder.indexOf(right))[0] ?? defaultStudentReadingLevel
    : normalizeStudentReadingLevel(studentReadingLevel);

  return buildRecommendation({
    topic,
    readingLevel,
    learningFocus: topicText,
    librarySystem: library.librarySystem,
    libraryTip: library.libraryTip,
    householdLabel: householdMode ? "Family read-aloud" : undefined
  });
}

export function buildWeeklyPlannerBookRecommendations({
  locationLabel,
  homeZipcode,
  topicText,
  learners
}: {
  locationLabel: string;
  homeZipcode?: string | null;
  topicText: string;
  learners: LearnerContext[];
}): PlannerBookRecommendation[] {
  const topic = getTopicFromText(topicText);
  const library = resolveLibrarySystem(locationLabel, homeZipcode);
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
    buildRecommendation({
      topic,
      readingLevel: uniqueLevels[0] ?? defaultStudentReadingLevel,
      learningFocus: topicText,
      librarySystem: library.librarySystem,
      libraryTip: library.libraryTip,
      householdLabel: normalizedLearners.length > 1 ? "Family read-aloud" : undefined
    })
  );

  if (normalizedLearners.length > 1 && uniqueLevels.length > 1) {
    recommendations.push(
      buildRecommendation({
        topic,
        readingLevel: uniqueLevels[uniqueLevels.length - 1],
        learningFocus: topicText,
        librarySystem: library.librarySystem,
        libraryTip: library.libraryTip,
        householdLabel: "Independent follow-up"
      })
    );
  }

  return recommendations.slice(0, 2);
}
