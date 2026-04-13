import { getSpotMapUrl, milesBetweenPoints, type ResolvedLocationContext } from "@/lib/context/nearby-spots";

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
};

const OPPORTUNITIES = [
  {
    id: "calvert-marine-museum",
    title: "Calvert Marine Museum",
    type: "museum",
    locationLabel: "Solomons, MD",
    latitude: 38.3215,
    longitude: -76.4519,
    reason: "One of the best Southern Maryland stops for Chesapeake Bay wildlife, hands-on family learning, and museum programming that actually fits the region.",
    href: getSpotMapUrl({
      name: "Calvert Marine Museum",
      latitude: 38.3215,
      longitude: -76.4519,
      location_label: "Solomons, MD"
    }),
    ctaLabel: "Map"
  },
  {
    id: "annmarie-garden",
    title: "Annmarie Sculpture Garden & Arts Center",
    type: "kids_programs",
    locationLabel: "Solomons, MD",
    latitude: 38.3597,
    longitude: -76.4614,
    reason: "A strong local pick for family art-and-nature days, kid-friendly events, seasonal festivals, and outdoor walking in one stop.",
    href: "https://www.annmariegarden.org/annmarie2/event-info-0",
    ctaLabel: "Events"
  },
  {
    id: "jefferson-patterson-park",
    title: "Jefferson Patterson Park and Museum",
    type: "history_site",
    locationLabel: "St. Leonard, MD",
    latitude: 38.4045,
    longitude: -76.5122,
    reason: "Useful when you want trails, archaeology, local history, and a place that feels educational without feeling like school all day.",
    href: getSpotMapUrl({
      name: "Jefferson Patterson Park and Museum",
      latitude: 38.4045,
      longitude: -76.5122,
      location_label: "St. Leonard, MD"
    }),
    ctaLabel: "Map"
  },
  {
    id: "greenwell-foundation",
    title: "Greenwell Foundation Nature Center",
    type: "nature_center",
    locationLabel: "Hollywood, MD",
    latitude: 38.345,
    longitude: -76.5445,
    reason: "A calm family nature option with shoreline, trails, and simple outdoor learning for mixed-age kids who do better with an easy-access place.",
    href: getSpotMapUrl({
      name: "Greenwell Foundation Nature Center",
      latitude: 38.345,
      longitude: -76.5445,
      location_label: "Hollywood, MD"
    }),
    ctaLabel: "Map"
  },
  {
    id: "point-lookout-state-park",
    title: "Point Lookout Historic Area",
    type: "park",
    locationLabel: "Scotland, MD",
    latitude: 38.0417,
    longitude: -76.3274,
    reason: "Good for families who want shoreline habitat, birding potential, and Civil War history in one bigger outing instead of several separate stops.",
    href: getSpotMapUrl({
      name: "Point Lookout Historic Area",
      latitude: 38.0417,
      longitude: -76.3274,
      location_label: "Scotland, MD"
    }),
    ctaLabel: "Map"
  },
  {
    id: "st-marys-library-events",
    title: "St. Mary's County Library Family Events",
    type: "kids_programs",
    locationLabel: "St. Mary's County, MD",
    latitude: null,
    longitude: null,
    reason: "A reliable place to find kid-friendly storytimes, STEM activities, homeschool-friendly programs, and low-cost indoor backup plans.",
    href: "https://www.google.com/search?q=St.+Mary%27s+County+Library+events",
    ctaLabel: "Calendar"
  },
  {
    id: "calvert-library-events",
    title: "Calvert Library Events",
    type: "kids_programs",
    locationLabel: "Calvert County, MD",
    latitude: null,
    longitude: null,
    reason: "Useful for quick family outings when you need a clean, simple, kid-focused event calendar instead of another long day of planning.",
    href: "https://www.google.com/search?q=Calvert+Library+events",
    ctaLabel: "Calendar"
  },
  {
    id: "calvert-parks-rec",
    title: "Calvert County Parks & Recreation Activities",
    type: "festival_calendar",
    locationLabel: "Calvert County, MD",
    latitude: null,
    longitude: null,
    reason: "A strong regional hub for family programs, seasonal activities, camps, fairs, and community events that can fill the calendar fast.",
    href: "https://www.calvertcountymd.gov/index.aspx?nid=115",
    ctaLabel: "Programs"
  },
  {
    id: "college-southern-maryland-events",
    title: "College of Southern Maryland Public Events",
    type: "lecture_calendar",
    locationLabel: "Southern Maryland campuses",
    latitude: null,
    longitude: null,
    reason: "Helpful for parents looking for public talks, lectures, student showcases, and community learning events that feel a little more grown-up and educational.",
    href: "https://www.google.com/search?q=College+of+Southern+Maryland+events",
    ctaLabel: "Events"
  }
] as const;

export function getNearbyFamilyOpportunities(location: ResolvedLocationContext) {
  return OPPORTUNITIES.map((item) => {
    const distanceMiles =
      location.latitude !== null && item.latitude !== null && location.longitude !== null && item.longitude !== null
        ? Math.round(milesBetweenPoints(location.latitude, location.longitude, item.latitude, item.longitude)! * 10) / 10
        : null;

    return {
      id: item.id,
      title: item.title,
      type: item.type,
      locationLabel: item.locationLabel,
      reason: item.reason,
      distanceMiles,
      href: item.href,
      ctaLabel: item.ctaLabel
    } satisfies FamilyOpportunity;
  })
    .sort((left, right) => {
      if (left.distanceMiles === null && right.distanceMiles === null) return left.title.localeCompare(right.title);
      if (left.distanceMiles === null) return 1;
      if (right.distanceMiles === null) return -1;
      return left.distanceMiles - right.distanceMiles;
    })
    .slice(0, 8);
}
