type ParsedTimeRange = {
  start_time: string;
  end_time: string;
};

export type ImportedClassDraft = {
  title: string;
  description: string;
  short_description: string;
  class_date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_range: string;
};

function cleanLine(value: string) {
  return value.replace(/^[\s>*-]+/, "").trim();
}

function toIsoDate(value: string) {
  const normalized = value
    .replace(/(\d+)(st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTwentyFourHourTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i);
  if (!match) return "";

  const hour = Number(match[1]);
  const minutes = match[2] ?? "00";
  const meridiem = match[3].toLowerCase();
  if (hour < 1 || hour > 12) return "";

  const adjustedHour = meridiem === "pm" ? (hour % 12) + 12 : hour % 12;
  return `${String(adjustedHour).padStart(2, "0")}:${minutes}`;
}

function extractTimeRange(sourceText: string): ParsedTimeRange | null {
  const match = sourceText.match(/(\d{1,2}(?::\d{2})?\s*[ap]m)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/i);
  if (!match) return null;

  const start_time = toTwentyFourHourTime(match[1]);
  const end_time = toTwentyFourHourTime(match[2]);
  if (!start_time || !end_time) return null;

  return { start_time, end_time };
}

function extractDate(sourceText: string) {
  const patterns = [
    /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?/i,
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?/i
  ];

  for (const pattern of patterns) {
    const match = sourceText.match(pattern);
    if (!match) continue;

    const rawDate = match[0].includes(",") && /\d{4}/.test(match[0]) ? match[0] : `${match[0]}, ${new Date().getFullYear()}`;
    const date = toIsoDate(rawDate);
    if (date) return date;
  }

  return "";
}

function looksLikeLocationLine(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes(", md") ||
    normalized.includes("suite") ||
    normalized.includes("road") ||
    normalized.includes("rd") ||
    normalized.includes("street") ||
    normalized.includes("st.") ||
    normalized.includes("avenue") ||
    normalized.includes(" ave") ||
    normalized.includes("park") ||
    normalized.includes("museum") ||
    normalized.includes("center")
  );
}

export function parseFacebookClassImport(sourceText: string): ImportedClassDraft {
  const cleanedSource = sourceText.trim();
  if (!cleanedSource) {
    throw new Error("Paste the Facebook event text first.");
  }

  const lines = cleanedSource
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const title = lines.find((line) => !/^https?:\/\//i.test(line)) ?? "";
  const date = extractDate(cleanedSource);
  const timeRange = extractTimeRange(cleanedSource);
  const location =
    lines.find((line) => looksLikeLocationLine(line) && line !== title) ??
    lines.find((line) => / at /i.test(line) && line !== title) ??
    "";

  if (!title) {
    throw new Error("Could not find the event title in that Facebook copy.");
  }

  if (!date) {
    throw new Error("Could not find the event date. Paste the part of the Facebook event that includes the date.");
  }

  if (!timeRange) {
    throw new Error("Could not find the event time range. Paste the part of the Facebook event that includes the start and end time.");
  }

  const description = lines
    .filter(
      (line) =>
        line !== title &&
        line !== location &&
        !/^https?:\/\//i.test(line) &&
        !/\b\d{1,2}(?::\d{2})?\s*[ap]m\s*(?:-|–|to)\s*\d{1,2}(?::\d{2})?\s*[ap]m\b/i.test(line) &&
        !/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}/i.test(line)
    )
    .join("\n")
    .trim();

  return {
    title,
    description,
    short_description: description.split("\n")[0] || title,
    class_date: date,
    start_time: timeRange.start_time,
    end_time: timeRange.end_time,
    location,
    age_range: "",
  };
}
