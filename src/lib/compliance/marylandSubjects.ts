export const marylandSubjects = [
  "English",
  "Mathematics",
  "Science",
  "Social Studies",
  "Art",
  "Music",
  "Health",
  "Physical Education",
] as const;

export type MarylandSubject = (typeof marylandSubjects)[number];

export const marylandSubjectSlugMap: Record<MarylandSubject, string> = {
  English: "english",
  Mathematics: "mathematics",
  Science: "science",
  "Social Studies": "social-studies",
  Art: "art",
  Music: "music",
  Health: "health",
  "Physical Education": "physical-education",
};

export const marylandSubjectSuggestionMap: Record<MarylandSubject, string> = {
  English: "Add a reading log, writing sample, narration note, or vocabulary activity.",
  Mathematics: "Save math work, counting practice, measurement notes, or a solved problem set.",
  Science: "Log an observation, experiment, habitat note, or nature journal entry.",
  "Social Studies": "Add a history reading, geography map, civics discussion, or community study.",
  Art: "Save an art project photo, sketch, craft reflection, or design study.",
  Music: "Add a rhythm activity, song study, instrument practice note, or composer listening log.",
  Health: "Document nutrition, hygiene, safety, or wellness learning.",
  "Physical Education": "Log movement, outdoor exercise, skill practice, or a hike with duration."
};

export function normalizeSubjectName(input: string | null | undefined): MarylandSubject | null {
  const value = (input ?? "").trim().toLowerCase();

  switch (value) {
    case "english":
    case "reading":
    case "language arts":
    case "ela":
      return "English";
    case "mathematics":
    case "math":
      return "Mathematics";
    case "science":
      return "Science";
    case "social studies":
    case "social-studies":
    case "history":
    case "geography":
      return "Social Studies";
    case "art":
      return "Art";
    case "music":
      return "Music";
    case "health":
      return "Health";
    case "physical education":
    case "physical-education":
    case "pe":
      return "Physical Education";
    default:
      return null;
  }
}

export function getSubjectSlug(subject: MarylandSubject) {
  return marylandSubjectSlugMap[subject];
}

export function getSuggestedSubjectAction(subject: MarylandSubject) {
  return marylandSubjectSuggestionMap[subject];
}
