import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { getCompletionLabel } from "@/lib/portfolio";
import type { StudentRecord } from "@/lib/students";

export const marylandSubjectLabels = [
  "English (Reading/Language Arts)",
  "Mathematics",
  "Science",
  "Social Studies",
  "Art",
  "Music",
  "Health",
  "Physical Education",
] as const;

export type MarylandSubjectLabel = (typeof marylandSubjectLabels)[number];

export const portfolioEvidenceTypeOptions = [
  { value: "field_quest", label: "Field Quest" },
  { value: "field_identification", label: "Species Discovery" },
  { value: "diy_project", label: "DIY Project" },
  { value: "worksheet", label: "Worksheet" },
  { value: "wsa_class", label: "WSA Class" },
  { value: "event_attended", label: "Event Attended" },
  { value: "landmark_site", label: "Landmark / Historic Site" },
  { value: "field_trip", label: "Field Trip" },
  { value: "outdoor_skill", label: "Outdoor Skill" },
  { value: "reading_language_activity", label: "Reading / Language Activity" },
  { value: "other_learning_evidence", label: "Other Learning Evidence" },
] as const;

export type PortfolioEvidenceType = (typeof portfolioEvidenceTypeOptions)[number]["value"];

export type PortfolioEntryRecord = {
  id: string;
  household_id: string;
  student_id: string | null;
  completion_id: string | null;
  title: string;
  entry_type: string;
  summary: string | null;
  parent_note: string | null;
  artifact_json: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  source_discovery_id: string | null;
};

export type ReviewEvidenceItem = {
  id: string;
  title: string;
  categoryLabel: string;
  occurredAt: string;
  summary: string;
  notes: string;
  scopeLabel: string;
  subjects: MarylandSubjectLabel[];
};

export type HomeschoolReviewSummary = {
  mode: "fallback" | "ai";
  overallSummary: string;
  subjects: Record<MarylandSubjectLabel, string>;
};

const evidenceTypeLabels = new Map<string, string>(
  portfolioEvidenceTypeOptions.map((option) => [option.value, option.label]),
);

const subjectKeywords: Record<MarylandSubjectLabel, string[]> = {
  "English (Reading/Language Arts)": [
    "read",
    "reading",
    "book",
    "journal",
    "write",
    "writing",
    "story",
    "worksheet",
    "language",
    "vocabulary",
    "caption",
    "reflection",
  ],
  Mathematics: [
    "math",
    "measure",
    "count",
    "number",
    "graph",
    "pattern",
    "budget",
    "estimate",
    "fraction",
    "geometry",
    "distance",
  ],
  Science: [
    "species",
    "discovery",
    "science",
    "nature",
    "animal",
    "bird",
    "fish",
    "plant",
    "mushroom",
    "habitat",
    "experiment",
    "observe",
    "weather",
    "ecosystem",
    "project",
  ],
  "Social Studies": [
    "history",
    "historic",
    "museum",
    "landmark",
    "map",
    "culture",
    "community",
    "government",
    "heritage",
    "field trip",
    "site",
  ],
  Art: [
    "art",
    "draw",
    "paint",
    "craft",
    "design",
    "sketch",
    "create",
    "build",
  ],
  Music: [
    "music",
    "song",
    "sing",
    "instrument",
    "rhythm",
    "choir",
    "concert",
  ],
  Health: [
    "health",
    "nutrition",
    "wellness",
    "safety",
    "first aid",
    "hygiene",
    "body",
  ],
  "Physical Education": [
    "hike",
    "walk",
    "run",
    "outdoor skill",
    "climb",
    "balance",
    "trail",
    "paddle",
    "fishing",
    "exercise",
    "sport",
    "movement",
  ],
};

const baseSubjectsByType: Record<string, MarylandSubjectLabel[]> = {
  field_quest: ["Science", "Physical Education"],
  field_identification: ["Science"],
  diy_project: ["Science", "Art"],
  worksheet: ["English (Reading/Language Arts)"],
  wsa_class: ["Science"],
  event_attended: ["Social Studies"],
  landmark_site: ["Social Studies"],
  field_trip: ["Social Studies", "Science"],
  outdoor_skill: ["Science", "Physical Education"],
  reading_language_activity: ["English (Reading/Language Arts)"],
  other_learning_evidence: [],
};

export function getPortfolioEvidenceLabel(entryType: string) {
  return evidenceTypeLabels.get(entryType) ?? "Learning Evidence";
}

export function getPortfolioEntryArtifact(entry: PortfolioEntryRecord) {
  return entry.artifact_json ?? {};
}

export function getPortfolioEntryImagePath(entry: PortfolioEntryRecord) {
  const artifact = getPortfolioEntryArtifact(entry);
  return typeof artifact.imagePath === "string" && artifact.imagePath.trim()
    ? artifact.imagePath.trim()
    : null;
}

export function getPortfolioEntryImageUrl(entry: PortfolioEntryRecord) {
  const artifact = getPortfolioEntryArtifact(entry);
  return typeof artifact.imageUrl === "string" && artifact.imageUrl.trim()
    ? artifact.imageUrl.trim()
    : null;
}

export function getPortfolioEntryImageAlt(entry: PortfolioEntryRecord) {
  const artifact = getPortfolioEntryArtifact(entry);
  return typeof artifact.imageAlt === "string" && artifact.imageAlt.trim()
    ? artifact.imageAlt.trim()
    : `${entry.title} documentation`;
}

export function inferSubjectsForText(text: string, baseSubjects: MarylandSubjectLabel[] = []) {
  const lowered = text.toLowerCase();
  const matches = new Set<MarylandSubjectLabel>(baseSubjects);

  for (const [subject, keywords] of Object.entries(subjectKeywords) as Array<
    [MarylandSubjectLabel, string[]]
  >) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      matches.add(subject);
    }
  }

  if (matches.size === 0) {
    matches.add("English (Reading/Language Arts)");
  }

  return Array.from(matches);
}

export function inferSubjectsForPortfolioEntry(entry: PortfolioEntryRecord) {
  const artifact = getPortfolioEntryArtifact(entry);
  const artifactText = JSON.stringify({
    entryType: entry.entry_type,
    title: entry.title,
    summary: entry.summary,
    note: entry.parent_note,
    artifact,
  });

  return inferSubjectsForText(
    artifactText,
    baseSubjectsByType[entry.entry_type] ?? [],
  );
}

export function inferSubjectsForCompletionEvidence(input: {
  completion: ActivityCompletionRecord;
  generationTitle?: string | null;
  classTitle?: string | null;
  classDescription?: string | null;
}) {
  const baseText = [
    input.completion.activity_type,
    getCompletionLabel(input.completion.activity_type),
    input.completion.title,
    input.completion.notes ?? "",
    input.generationTitle ?? "",
    input.classTitle ?? "",
    input.classDescription ?? "",
  ].join(" ");

  const activityTypeBases: Record<string, MarylandSubjectLabel[]> = {
    nature_discovery: ["Science"],
    daily_adventure: ["Science", "Physical Education"],
    animal_of_the_day: ["Science", "English (Reading/Language Arts)"],
    week_planner: ["English (Reading/Language Arts)"],
    lesson_generator: ["English (Reading/Language Arts)"],
    in_person_class: ["Science"],
    field_quest: ["Science", "Physical Education"],
  };

  return inferSubjectsForText(
    baseText,
    activityTypeBases[input.completion.activity_type] ?? [],
  );
}

export function buildEvidenceItemFromEntry(
  entry: PortfolioEntryRecord,
  student: StudentRecord,
): ReviewEvidenceItem {
  const subjects = inferSubjectsForPortfolioEntry(entry);
  return {
    id: entry.id,
    title: entry.title,
    categoryLabel: getPortfolioEvidenceLabel(entry.entry_type),
    occurredAt: entry.occurred_at,
    summary: entry.summary?.trim() || "Documented learning evidence saved in the student record.",
    notes: entry.parent_note?.trim() || "",
    scopeLabel: entry.student_id ? student.name : "Household",
    subjects,
  };
}

export function buildEvidenceItemFromCompletion(input: {
  completion: ActivityCompletionRecord;
  student: StudentRecord;
  classBooking?: ClassBookingRecord & { classes?: ClassRecord | null };
}) {
  const subjects = inferSubjectsForCompletionEvidence({
    completion: input.completion,
    classTitle: input.classBooking?.classes?.title ?? null,
    classDescription: input.classBooking?.classes?.description ?? null,
  });

  return {
    id: input.completion.id,
    title: input.completion.title,
    categoryLabel: getCompletionLabel(input.completion.activity_type),
    occurredAt: input.completion.completed_at,
    summary:
      input.completion.notes?.trim() ||
      `Completed ${getCompletionLabel(input.completion.activity_type).toLowerCase()} activity.`,
    notes: input.classBooking?.classes?.description?.trim() ?? "",
    scopeLabel: input.student.name,
    subjects,
  } satisfies ReviewEvidenceItem;
}

function summarizeSubjectEvidence(
  subject: MarylandSubjectLabel,
  items: ReviewEvidenceItem[],
) {
  if (!items.length) {
    return `No strong ${subject} evidence was logged in this date range yet. Add a parent summary if learning happened outside the app.`;
  }

  const titles = items.slice(0, 4).map((item) => item.title);
  const categoryLabels = Array.from(new Set(items.map((item) => item.categoryLabel))).slice(0, 3);

  return `${titles.join(", ")} ${
    items.length > 1 ? "show" : "shows"
  } ${subject} learning through ${categoryLabels.join(", ").toLowerCase()} evidence. ${
    items.length > 4
      ? `There are ${items.length} total entries connected to this subject in the selected range.`
      : "These entries can be used as concrete review-board evidence."
  }`;
}

export function buildFallbackHomeschoolReview(input: {
  studentName: string;
  rangeLabel: string;
  evidenceItems: ReviewEvidenceItem[];
  parentNotes: string[];
  customParentSummary?: string;
}): HomeschoolReviewSummary {
  const grouped = Object.fromEntries(
    marylandSubjectLabels.map((subject) => [
      subject,
      input.evidenceItems.filter((item) => item.subjects.includes(subject)),
    ]),
  ) as Record<MarylandSubjectLabel, ReviewEvidenceItem[]>;

  const overallParts = [
    `${input.studentName} logged ${input.evidenceItems.length} documentation entr${
      input.evidenceItems.length === 1 ? "y" : "ies"
    } for ${input.rangeLabel}.`,
  ];

  if (input.customParentSummary?.trim()) {
    overallParts.push(`Parent outside-learning summary: ${input.customParentSummary.trim()}`);
  }

  if (input.parentNotes.length) {
    overallParts.push(
      `${input.parentNotes.length} parent reflection${
        input.parentNotes.length === 1 ? "" : "s"
      } were also included in the review packet.`,
    );
  }

  return {
    mode: "fallback",
    overallSummary: overallParts.join(" "),
    subjects: Object.fromEntries(
      marylandSubjectLabels.map((subject) => [
        subject,
        summarizeSubjectEvidence(subject, grouped[subject]),
      ]),
    ) as Record<MarylandSubjectLabel, string>,
  };
}
