import type { RecommendedSpot } from "@/lib/context/nearby-spots";

export const smithsonianMuseumKeys = [
  "natural-history",
  "air-space",
  "american-history",
  "american-indian",
  "african-american-history",
  "portrait-gallery",
  "american-art",
  "national-zoo",
  "hirshhorn",
  "renwick",
  "postal-museum",
  "castle-gardens",
] as const;

export type SmithsonianMuseumKey = (typeof smithsonianMuseumKeys)[number];

export type SmithsonianMuseum = {
  key: SmithsonianMuseumKey;
  name: string;
  shortLabel: string;
  locationLabel: string;
  websiteUrl: string;
  mapUrl: string;
  kind: "museum" | "zoo" | "gardens";
  idealFor: string[];
  highlights: string[];
  familyReason: string;
};

export const SMITHSONIAN_SPECIAL_EXHIBIT_NOTE =
  "Special exhibits may be available today - check the museum board on arrival.";

export const smithsonianMuseums: SmithsonianMuseum[] = [
  {
    key: "natural-history",
    name: "National Museum of Natural History",
    shortLabel: "Natural History",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://naturalhistory.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Museum+of+Natural+History+Washington+DC",
    kind: "museum",
    idealFor: ["animals", "rocks", "dinosaurs", "science", "nature", "oceans"],
    highlights: [
      "Hall of Fossils",
      "Ocean Hall",
      "Mammal Hall",
      "Gems and Minerals",
    ],
    familyReason:
      "The best all-around pick for animal kids, science kids, and mixed-age families who want instant wow-factor.",
  },
  {
    key: "air-space",
    name: "National Air and Space Museum",
    shortLabel: "Air & Space",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://airandspace.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Air+and+Space+Museum+Washington+DC",
    kind: "museum",
    idealFor: [
      "planes",
      "space",
      "engineering",
      "transportation",
      "technology",
      "inventions",
    ],
    highlights: [
      "Early Flight",
      "Space Race artifacts",
      "Planetary exploration",
      "Aviation milestones",
    ],
    familyReason:
      "A strong choice for builders, inventors, transportation fans, and kids who like big machines and big ideas.",
  },
  {
    key: "american-history",
    name: "National Museum of American History",
    shortLabel: "American History",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://americanhistory.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Museum+of+American+History+Washington+DC",
    kind: "museum",
    idealFor: [
      "history",
      "inventions",
      "government",
      "transportation",
      "culture",
      "everyday life",
    ],
    highlights: [
      "First Ladies",
      "American enterprise",
      "Transportation history",
      "Star-Spangled Banner",
    ],
    familyReason:
      "Useful when you want inventions, civic history, and everyday American life in one flexible museum day.",
  },
  {
    key: "american-indian",
    name: "National Museum of the American Indian",
    shortLabel: "American Indian",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://americanindian.si.edu/visit/washington",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Museum+of+the+American+Indian+Washington+DC",
    kind: "museum",
    idealFor: [
      "history",
      "culture",
      "indigenous studies",
      "art",
      "storytelling",
      "geography",
    ],
    highlights: [
      "Native perspectives galleries",
      "Regional cultures",
      "Material culture",
      "Contemporary Native stories",
    ],
    familyReason:
      "Excellent for families who want culture, history, and people-centered storytelling instead of only object-based exhibits.",
  },
  {
    key: "african-american-history",
    name: "National Museum of African American History and Culture",
    shortLabel: "African American History",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://nmaahc.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Museum+of+African+American+History+and+Culture+Washington+DC",
    kind: "museum",
    idealFor: [
      "history",
      "civics",
      "culture",
      "music",
      "justice",
      "multiple perspectives",
    ],
    highlights: [
      "Slavery and freedom history",
      "Civil Rights era",
      "Culture galleries",
      "Music and sports stories",
    ],
    familyReason:
      "Best when you want deeper American history, culture, and age-appropriate perspective-taking conversations.",
  },
  {
    key: "portrait-gallery",
    name: "National Portrait Gallery",
    shortLabel: "Portrait Gallery",
    locationLabel: "Downtown Washington, DC",
    websiteUrl: "https://npg.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Portrait+Gallery+Washington+DC",
    kind: "museum",
    idealFor: [
      "art",
      "history",
      "people",
      "presidents",
      "storytelling",
      "visual literacy",
    ],
    highlights: [
      "Presidential portraits",
      "American leaders",
      "Visual storytelling",
      "Changing identity galleries",
    ],
    familyReason:
      "Great for shorter city days when you want art, people stories, and easy compare-and-contrast prompts.",
  },
  {
    key: "american-art",
    name: "Smithsonian American Art Museum",
    shortLabel: "American Art",
    locationLabel: "Downtown Washington, DC",
    websiteUrl: "https://americanart.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Smithsonian+American+Art+Museum+Washington+DC",
    kind: "museum",
    idealFor: [
      "art",
      "american culture",
      "design",
      "visual thinking",
      "creativity",
    ],
    highlights: [
      "American art across eras",
      "Folk art",
      "Modern and contemporary works",
      "Story-rich gallery rooms",
    ],
    familyReason:
      "A flexible art stop for families who want creativity, observation practice, and calm pacing.",
  },
  {
    key: "national-zoo",
    name: "National Zoo",
    shortLabel: "National Zoo",
    locationLabel: "Washington, DC",
    websiteUrl: "https://nationalzoo.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Smithsonian+National+Zoo+Washington+DC",
    kind: "zoo",
    idealFor: ["animals", "habitats", "behavior", "conservation", "movement"],
    highlights: [
      "Animal habitats",
      "Conservation messaging",
      "Behavior observation",
      "Family-friendly pacing",
    ],
    familyReason:
      "Best for active kids who need movement and animal observation more than quiet gallery time.",
  },
  {
    key: "hirshhorn",
    name: "Hirshhorn Museum and Sculpture Garden",
    shortLabel: "Hirshhorn",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://hirshhorn.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Hirshhorn+Museum+and+Sculpture+Garden+Washington+DC",
    kind: "museum",
    idealFor: [
      "modern art",
      "sculpture",
      "big ideas",
      "creative thinking",
      "visual interpretation",
    ],
    highlights: [
      "Contemporary art",
      "Sculpture garden",
      "Installations",
      "Interpretive discussion",
    ],
    familyReason:
      "A strong choice when you want bold visual prompts and opinion-rich family conversations.",
  },
  {
    key: "renwick",
    name: "Renwick Gallery",
    shortLabel: "Renwick",
    locationLabel: "Pennsylvania Avenue, Washington, DC",
    websiteUrl: "https://renwick.americanart.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Renwick+Gallery+Washington+DC",
    kind: "museum",
    idealFor: ["craft", "design", "art", "making", "hands-on inspiration"],
    highlights: [
      "Craft and design",
      "Studio thinking",
      "Material choices",
      "Creative processes",
    ],
    familyReason:
      "Useful for art-minded families who want a smaller museum with strong visual payoff and less walking.",
  },
  {
    key: "postal-museum",
    name: "National Postal Museum",
    shortLabel: "Postal Museum",
    locationLabel: "Near Union Station, Washington, DC",
    websiteUrl: "https://postalmuseum.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=National+Postal+Museum+Washington+DC",
    kind: "museum",
    idealFor: [
      "communication",
      "transportation",
      "history",
      "systems",
      "maps",
    ],
    highlights: [
      "Mail transportation",
      "Stamp stories",
      "Communication systems",
      "American connections",
    ],
    familyReason:
      "Great for a surprising short mission about networks, communication, and how systems connect people.",
  },
  {
    key: "castle-gardens",
    name: "Smithsonian Castle and Gardens",
    shortLabel: "Castle & Gardens",
    locationLabel: "National Mall, Washington, DC",
    websiteUrl: "https://gardens.si.edu/",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Smithsonian+Castle+Washington+DC",
    kind: "gardens",
    idealFor: ["orientation", "gardens", "architecture", "plants", "short stops"],
    highlights: [
      "Garden walks",
      "Architecture details",
      "Orientation stop",
      "Quick visual scavenger hunt",
    ],
    familyReason:
      "Best as a calmer add-on stop, a reset between museums, or a short mission for families with limited energy.",
  },
];

export function getSmithsonianMuseum(key: SmithsonianMuseumKey) {
  return smithsonianMuseums.find((museum) => museum.key === key) ?? null;
}

export function getSelectedSmithsonianMuseums(keys: SmithsonianMuseumKey[]) {
  const seen = new Set<SmithsonianMuseumKey>();
  return keys
    .filter((key): key is SmithsonianMuseumKey =>
      smithsonianMuseumKeys.includes(key),
    )
    .filter((key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((key) => getSmithsonianMuseum(key))
    .filter((museum): museum is SmithsonianMuseum => Boolean(museum));
}

export function buildSmithsonianRecommendedStops(
  museums: SmithsonianMuseum[],
): RecommendedSpot[] {
  return museums.map((museum) => ({
    id: museum.key,
    name: museum.name,
    spotType: museum.kind,
    waterType: null,
    locationLabel: museum.locationLabel,
    distanceMiles: null,
    description: museum.highlights.join(" | "),
    reason: museum.familyReason,
    familyFriendly: true,
    recommendedUseToday: `Start with ${museum.highlights.slice(0, 2).join(" and ")} before energy drops.`,
    accessNote: "Free Smithsonian stop. Check same-day entry notes and exhibit boards on arrival.",
    mapUrl: museum.mapUrl,
  }));
}
