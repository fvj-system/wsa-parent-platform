import { fetchTextWithTimeout } from "@/lib/context/http";
import { milesBetweenPoints, type ResolvedLocationContext } from "@/lib/context/nearby-spots";

export type RegionalFamilyEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string | null;
  locationLabel: string;
  countyLabel: string;
  sourceLabel: string;
  href: string;
  note: string;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
};

export type RegionalEventSource = {
  id: string;
  label: string;
  href: string;
  note: string;
};

type ParsedEventDraft = Omit<RegionalFamilyEvent, "id" | "countyLabel" | "latitude" | "longitude"> & {
  countyLabel?: string;
};

const SOURCE_TIMEOUT_MS = 8000;

const EVENT_SOURCE_DIRECTORIES: RegionalEventSource[] = [
  {
    id: "stmalib-kids",
    label: "St. Mary's County Library kids events",
    href: "https://www.stmalib.org/kids/kids-events/",
    note: "Storytimes, STEAM programs, family crafts, and library learning events."
  },
  {
    id: "stmalib-events",
    label: "St. Mary's County Library full calendar",
    href: "https://www.stmalib.org/events/calendar/",
    note: "Full public calendar for library programs across St. Mary's County."
  },
  {
    id: "stmarys-rec",
    label: "St. Mary's County Recreation & Parks events",
    href: "https://www.stmaryscountymd.gov/recreate/events/",
    note: "Family programs, seasonal festivals, theater, skating, and county recreation events."
  },
  {
    id: "hsmc-events",
    label: "Historic St. Mary's City events",
    href: "https://www.hsmcdigshistory.org/events/",
    note: "History programs, tours, homeschool days, and seasonal family events."
  },
  {
    id: "annmarie-calendar",
    label: "Annmarie Garden calendar",
    href: "https://www.annmariegarden.org/",
    note: "Art, nature, festivals, family walks, and Solomons-area kids programming."
  },
  {
    id: "calvert-community",
    label: "Calvert County community events",
    href: "https://www.calvertcountymd.gov/calendar.aspx?CID=67",
    note: "Countywide community events including family programs, farm events, and museum activities."
  },
  {
    id: "charles-calendar",
    label: "Charles County calendar",
    href: "https://www.charlescountymd.gov/services/advanced-components/list-detail-pages/calendar-meeting-list/-toggle-next30days/-sortn-EDate/-sortd-asc",
    note: "Upcoming Charles County public events worth checking for family outings."
  },
  {
    id: "calvert-library",
    label: "Calvert Library events & classes",
    href: "https://calvertlibrary.info/events-classes/",
    note: "Library classes, youth events, and storytime-related programming."
  },
  {
    id: "maryland-dnr",
    label: "Maryland DNR unit calendars",
    href: "https://dnr.maryland.gov/Pages/unit-calendars.aspx",
    note: "Ranger programs, seasonal outdoor events, and public lands activities."
  },
  {
    id: "ymca-stmarys",
    label: "St. Mary's County Family YMCA",
    href: "https://ymcachesapeake.org/locations/st-marys-county-family-ymca",
    note: "Monitor for new family programming as the Great Mills YMCA opens and expands operations."
  },
  {
    id: "wellness-center",
    label: "St. Mary's Wellness & Aquatics Center",
    href: "https://www.stmaryscountymd.gov/Recreate/WellnessCenter/",
    note: "Aquatics schedules, lessons, and family recreation options."
  }
];

const venueCoordinates: Array<{
  match: RegExp;
  countyLabel: string;
  latitude: number;
  longitude: number;
}> = [
  { match: /lexington park/i, countyLabel: "St. Mary's County", latitude: 38.2668, longitude: -76.4513 },
  { match: /great mills/i, countyLabel: "St. Mary's County", latitude: 38.2352, longitude: -76.4974 },
  { match: /california,?\s*md|wildewood/i, countyLabel: "St. Mary's County", latitude: 38.3004, longitude: -76.5075 },
  { match: /leonardtown/i, countyLabel: "St. Mary's County", latitude: 38.2912, longitude: -76.6355 },
  { match: /charlotte hall/i, countyLabel: "St. Mary's County", latitude: 38.4846, longitude: -76.7844 },
  { match: /st\.?\s*mary'?s city/i, countyLabel: "St. Mary's County", latitude: 38.1888, longitude: -76.4274 },
  { match: /solomons|dowell/i, countyLabel: "Calvert County", latitude: 38.3228, longitude: -76.4522 },
  { match: /st\. leonard/i, countyLabel: "Calvert County", latitude: 38.4646, longitude: -76.5077 },
  { match: /port republic/i, countyLabel: "Calvert County", latitude: 38.5046, longitude: -76.5316 },
  { match: /prince frederick/i, countyLabel: "Calvert County", latitude: 38.5404, longitude: -76.5844 },
  { match: /lusby/i, countyLabel: "Calvert County", latitude: 38.3787, longitude: -76.4427 },
  { match: /la plata/i, countyLabel: "Charles County", latitude: 38.5293, longitude: -76.9753 },
  { match: /waldorf/i, countyLabel: "Charles County", latitude: 38.624, longitude: -76.9391 }
];

const familyTitlePattern =
  /\b(kid|kids|child|children|family|toddler|preschool|story|teen|tween|youth|play|craft|science|lego|steam|nature|museum|festival|pirate|scavenger|swim|art|dance|garden|farm|marine|zoo|campfire|princess|minnow|bee|roller|movie|comic|book sale)\b/i;
const nonFamilyTitlePattern =
  /\b(wine|board meeting|commission|clinic|law|jobsource|adult medical|adult book|romance book|mystery book|spelling bee|genealogy|self-help|hearing)\b/i;
const childAudiencePattern = /\b(baby|toddler|preschool|elementary|upper elementary|tween|teen|all ages|family)\b/i;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, "\"")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToLines(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/?(main|section|article|header|footer|aside|div|p|ul|ol|li|br|time|h1|h2|h3|h4|h5|h6)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function monthNumberFromName(rawMonth: string) {
  const normalized = rawMonth.trim().slice(0, 3).toLowerCase();
  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };

  return monthMap[normalized] ?? null;
}

function toIsoDate(year: number, monthNumber: string, day: number) {
  return `${year}-${monthNumber}-${String(day).padStart(2, "0")}`;
}

function parseMonthDayDate(rawMonth: string, rawDay: string, fallbackYear = new Date().getFullYear()) {
  const monthNumber = monthNumberFromName(rawMonth);
  if (!monthNumber) return null;

  const day = Number(rawDay.replace(/\D/g, ""));
  if (!day || Number.isNaN(day)) return null;

  let resolvedYear = fallbackYear;
  const today = new Date();
  const candidate = new Date(`${toIsoDate(resolvedYear, monthNumber, day)}T12:00:00`);
  if (candidate < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)) {
    resolvedYear += 1;
  }

  return toIsoDate(resolvedYear, monthNumber, day);
}

function inferVenueMeta(locationLabel: string) {
  const matchedVenue = venueCoordinates.find((venue) => venue.match.test(locationLabel));
  return matchedVenue
    ? {
        countyLabel: matchedVenue.countyLabel,
        latitude: matchedVenue.latitude,
        longitude: matchedVenue.longitude
      }
    : {
        countyLabel: "Southern Maryland",
        latitude: null,
        longitude: null
      };
}

function buildEventId(title: string, eventDate: string, locationLabel: string) {
  return `${eventDate}-${title}-${locationLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTimeLabel(rawValue: string | null | undefined) {
  const value = String(rawValue ?? "").trim();
  return value.length ? value : null;
}

function isFamilyRelevantEvent(title: string, audienceLine?: string | null) {
  if (nonFamilyTitlePattern.test(title) && !familyTitlePattern.test(title)) {
    return false;
  }

  if (audienceLine) {
    return childAudiencePattern.test(audienceLine);
  }

  return familyTitlePattern.test(title);
}

function createRegionalFamilyEvent(draft: ParsedEventDraft): RegionalFamilyEvent {
  const venueMeta = inferVenueMeta(draft.locationLabel);

  return {
    id: buildEventId(draft.title, draft.eventDate, draft.locationLabel),
    title: draft.title,
    eventDate: draft.eventDate,
    eventTime: normalizeTimeLabel(draft.eventTime),
    locationLabel: draft.locationLabel,
    countyLabel: draft.countyLabel ?? venueMeta.countyLabel,
    sourceLabel: draft.sourceLabel,
    href: draft.href,
    note: draft.note,
    tags: draft.tags,
    latitude: venueMeta.latitude,
    longitude: venueMeta.longitude
  };
}

function dateInRange(eventDate: string, startDate: string, days: number) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, days - 1));
  end.setHours(23, 59, 59, 999);
  const value = new Date(`${eventDate}T12:00:00`);
  return value >= start && value <= end;
}

function getDistanceMiles(event: RegionalFamilyEvent, location: ResolvedLocationContext) {
  if (
    location.latitude === null ||
    location.longitude === null ||
    event.latitude === null ||
    event.longitude === null
  ) {
    return null;
  }

  const distance = milesBetweenPoints(location.latitude, location.longitude, event.latitude, event.longitude);
  return distance === null ? null : Math.round(distance * 10) / 10;
}

function dedupeEvents(events: RegionalFamilyEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.eventDate}-${event.title.toLowerCase()}-${event.locationLabel.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseStMarysKidsEventsDate(line: string) {
  const match = line.match(/^When:\s*(?:[A-Za-z]+,\s*)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*-\s*(.+)$/i);
  if (!match) return null;

  const eventDate = parseMonthDayDate(match[1], match[2]);
  if (!eventDate) return null;

  return {
    eventDate,
    eventTime: match[3].trim()
  };
}

async function fetchStMarysLibraryKidsEvents() {
  const html = await fetchTextWithTimeout("https://www.stmalib.org/kids/kids-events/", {
    timeoutMs: SOURCE_TIMEOUT_MS
  });
  const lines = htmlToLines(html);
  const results: RegionalFamilyEvent[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const parsedDate = parseStMarysKidsEventsDate(lines[index]);
    if (!parsedDate) continue;

    const title = lines[index - 1] ?? "";
    const audienceLine = lines.slice(index + 1, index + 8).find((line) => /^Age Groups?:/i.test(line)) ?? null;
    if (!title || !isFamilyRelevantEvent(title, audienceLine)) {
      continue;
    }

    const whereLine = lines.slice(index + 1, index + 8).find((line) => /^Where:/i.test(line)) ?? "Where: St. Mary's County Library";
    const detailsUrl =
      lines.slice(index + 1, index + 12).find((line) => /^https?:\/\/stmalib\.libnet\.info\/event\//i.test(line)) ??
      "https://www.stmalib.org/kids/kids-events/";

    results.push(
      createRegionalFamilyEvent({
        title,
        eventDate: parsedDate.eventDate,
        eventTime: parsedDate.eventTime,
        locationLabel: whereLine.replace(/^Where:\s*/i, "").trim(),
        sourceLabel: "St. Mary's County Library kids events",
        href: detailsUrl,
        note: "Kid-focused library event pulled from the St. Mary's County Library event listings.",
        tags: ["library", "kids", "southern maryland"]
      })
    );
  }

  return results;
}

function parseCalvertCalendarDate(line: string) {
  const match = line.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),\s*(.+)$/);
  if (!match) return null;
  const monthNumber = monthNumberFromName(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!monthNumber || Number.isNaN(day) || Number.isNaN(year)) return null;

  return {
    eventDate: toIsoDate(year, monthNumber, day),
    eventTime: match[4].trim()
  };
}

async function fetchCalvertCommunityEvents() {
  const html = await fetchTextWithTimeout("https://www.calvertcountymd.gov/calendar.aspx?CID=67", {
    timeoutMs: SOURCE_TIMEOUT_MS
  });
  const lines = htmlToLines(html);
  const results: RegionalFamilyEvent[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const parsedDate = parseCalvertCalendarDate(lines[index]);
    if (!parsedDate) continue;

    const title = lines[index - 1] ?? "";
    if (!title || !isFamilyRelevantEvent(title)) {
      continue;
    }

    let locationLabel = "Calvert County, MD";
    const atIndex = lines.slice(index + 1, index + 6).findIndex((line) => line === "@");
    if (atIndex >= 0) {
      locationLabel = lines[index + atIndex + 2] ?? locationLabel;
    }

    results.push(
      createRegionalFamilyEvent({
        title,
        eventDate: parsedDate.eventDate,
        eventTime: parsedDate.eventTime,
        locationLabel,
        sourceLabel: "Calvert County community events",
        href: "https://www.calvertcountymd.gov/calendar.aspx?CID=67",
        note: "Community event pulled from the official Calvert County calendar.",
        tags: ["community", "calvert", "family"]
      })
    );
  }

  return results;
}

function parseAnnmarieDate(line: string) {
  const match = line.match(/^[A-Za-z]+,\s*([A-Za-z]+)\s*(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})$/);
  if (!match) return null;
  const monthNumber = monthNumberFromName(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!monthNumber || Number.isNaN(day) || Number.isNaN(year)) return null;
  return toIsoDate(year, monthNumber, day);
}

async function fetchAnnmarieUpcomingEvents() {
  const html = await fetchTextWithTimeout("https://www.annmariegarden.org/", {
    timeoutMs: SOURCE_TIMEOUT_MS
  });
  const lines = htmlToLines(html);
  const results: RegionalFamilyEvent[] = [];
  const upcomingIndex = lines.findIndex((line) => line === "Upcoming");
  if (upcomingIndex < 0) {
    return results;
  }

  let activeDate: string | null = null;
  for (const line of lines.slice(upcomingIndex + 1)) {
    const dateValue = parseAnnmarieDate(line);
    if (dateValue) {
      activeDate = dateValue;
      continue;
    }

    if (!activeDate || /^(more|current gallery shows|what's hot)$/i.test(line) || line === "CLOSED") {
      continue;
    }

    if (!isFamilyRelevantEvent(line)) {
      continue;
    }

    results.push(
      createRegionalFamilyEvent({
        title: line,
        eventDate: activeDate,
        eventTime: null,
        locationLabel: "Annmarie Sculpture Garden & Arts Center, Solomons, MD",
        sourceLabel: "Annmarie Garden calendar",
        href: "https://www.annmariegarden.org/",
        note: "Upcoming family-friendly Annmarie Garden event.",
        tags: ["art", "nature", "festival", "family"]
      })
    );
  }

  return results;
}

function parseHistoricStMarysDate(line: string) {
  const match = line.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})\s+(.+)$/);
  if (!match) return null;
  const monthNumber = monthNumberFromName(match[2]);
  const day = Number(match[3]);
  const year = Number(match[4]);
  if (!monthNumber || Number.isNaN(day) || Number.isNaN(year)) return null;
  return {
    eventDate: toIsoDate(year, monthNumber, day),
    eventTime: match[5].trim()
  };
}

async function fetchHistoricStMarysEvents() {
  const html = await fetchTextWithTimeout("https://www.hsmcdigshistory.org/events/", {
    timeoutMs: SOURCE_TIMEOUT_MS
  });
  const lines = htmlToLines(html);
  const results: RegionalFamilyEvent[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const parsedDate = parseHistoricStMarysDate(lines[index]);
    if (!parsedDate) continue;

    const title = lines[index - 1] ?? "";
    if (!title || !isFamilyRelevantEvent(title)) {
      continue;
    }

    const locationLabel =
      lines[index - 2] && !/^events$/i.test(lines[index - 2]) && !/^view$/i.test(lines[index - 2])
        ? lines[index - 2]
        : "Historic St. Mary's City, MD";

    results.push(
      createRegionalFamilyEvent({
        title,
        eventDate: parsedDate.eventDate,
        eventTime: parsedDate.eventTime,
        locationLabel,
        sourceLabel: "Historic St. Mary's City events",
        href: "https://www.hsmcdigshistory.org/events/",
        note: "Historic St. Mary's City event suited to family field-trip planning.",
        tags: ["history", "field trip", "family", "stmarys"]
      })
    );
  }

  return results;
}

async function fetchAllRegionalEvents() {
  const settled = await Promise.allSettled([
    fetchStMarysLibraryKidsEvents(),
    fetchCalvertCommunityEvents(),
    fetchAnnmarieUpcomingEvents(),
    fetchHistoricStMarysEvents()
  ]);

  return settled.flatMap((entry) => (entry.status === "fulfilled" ? entry.value : []));
}

export function getSouthernMarylandEventSources() {
  return EVENT_SOURCE_DIRECTORIES;
}

export async function getSouthernMarylandFamilyEvents(
  location: ResolvedLocationContext,
  startDate: string,
  days = 30
) {
  const events = dedupeEvents(await fetchAllRegionalEvents())
    .filter((event) => dateInRange(event.eventDate, startDate, days))
    .map((event) => ({
      ...event,
      distanceMiles: getDistanceMiles(event, location)
    }))
    .sort((left, right) => {
      if (left.eventDate !== right.eventDate) {
        return left.eventDate.localeCompare(right.eventDate);
      }

      if (left.distanceMiles === null && right.distanceMiles === null) {
        return left.title.localeCompare(right.title);
      }
      if (left.distanceMiles === null) return 1;
      if (right.distanceMiles === null) return -1;
      return left.distanceMiles - right.distanceMiles;
    });

  return events.filter((event) => event.distanceMiles === null || event.distanceMiles <= Math.max(location.radiusMiles, 45));
}
