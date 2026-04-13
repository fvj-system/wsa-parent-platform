import { WSALetterhead } from "@/components/wsa-letterhead";
import type { DailyAdventureOutput } from "@/lib/generations";

function compactSentence(
  value: string | null | undefined,
  fallback: string,
  maxLength = 150,
) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = text.match(/[^.!?]+[.!?]?/)?.[0]?.trim() ?? text;
  const normalized = firstSentence || fallback;
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3).trimEnd()}...`
    : normalized;
}

function compactList(
  items: Array<string | null | undefined>,
  limit: number,
  fallback: string[],
) {
  const cleaned = items
    .map((item) =>
      String(item ?? "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return (unique.length ? unique : fallback)
    .slice(0, limit)
    .map((item) =>
      item.length > 88 ? `${item.slice(0, 85).trimEnd()}...` : item,
    );
}

function deriveGearChecklist(result: DailyAdventureOutput) {
  if (result.gearChecklist?.length) return result.gearChecklist;

  const text = [
    result.outdoorObservationActivity,
    result.challengeActivity,
    result.optionalFieldTripIdea,
  ]
    .join(" ")
    .toLowerCase();
  const gear = new Set<string>(["Field notebook", "Pencil", "Water bottle"]);

  if (/(bird|binocular|hawk|owl|sparrow|watch)/.test(text))
    gear.add("Binoculars");
  if (/(pond|creek|river|wetland|water)/.test(text))
    gear.add("Mud-friendly shoes");
  if (/(bug|insect|frog|track|leaf|seed|bark)/.test(text))
    gear.add("Magnifying glass");
  if (/(trail|hike|walk|woods|forest)/.test(text))
    gear.add("Closed-toe walking shoes");
  if (/(field trip|park|shore|boardwalk)/.test(text)) gear.add("Small daypack");

  return Array.from(gear).slice(0, 5);
}

function deriveSafetyNote(result: DailyAdventureOutput) {
  if (result.safetyNote) return result.safetyNote;

  const text = [
    result.outdoorObservationActivity,
    result.challengeActivity,
    result.optionalFieldTripIdea,
  ]
    .join(" ")
    .toLowerCase();

  if (/(creek|river|pond|shore|water)/.test(text)) {
    return "Stay with your child near water edges, keep dry shoes handy, and choose firm footing before stopping to observe.";
  }

  if (/(trail|forest|woods|hike)/.test(text)) {
    return "Stick to known paths, check for ticks afterward, and keep the pace comfortable enough for steady observation.";
  }

  return "Bring water, watch footing, and keep the adventure short enough that it still feels calm and successful for the family.";
}

function getPrintablePlaces(result: DailyAdventureOutput) {
  if (result.recommendedNearbySpots?.length) {
    return result.recommendedNearbySpots.slice(0, 3).map((spot) => {
      const distance =
        spot.distanceMiles === null ? "Nearby" : `${spot.distanceMiles} mi`;
      return `${spot.name} (${distance})`;
    });
  }

  return compactList(
    [
      result.locationSummary,
      result.suggestedPlaceType,
      result.optionalFieldTripIdea,
    ],
    3,
    [
      "A nearby park edge",
      "A calm trail or marsh boardwalk",
      "A family-friendly outdoor stop close to home",
    ],
  );
}

function getPrintableFieldCues(result: DailyAdventureOutput) {
  return compactList(
    [
      result.challengeActivity,
      ...(result.likelySpecies ?? []),
      result.outdoorObservationActivity,
    ],
    3,
    [
      "Watch for movement, sound, or fresh field signs",
      "Notice habitat clues before moving closer",
      "Stop to compare one detail in a notebook",
    ],
  );
}

export function DailyAdventurePrintSheet({
  result,
}: {
  result: DailyAdventureOutput;
}) {
  const gear = deriveGearChecklist(result);
  const safetyNote = deriveSafetyNote(result);
  const isFishingMission = Boolean(
    result.fishingMainSpecies || result.fishingOutlook,
  );
  const isMuseumMission = Boolean(
    result.missionStops?.length ||
      result.scavengerHuntTasks?.length ||
      result.parentTalkingPoints?.length ||
      result.specialExhibitNote,
  );
  const printMission = compactSentence(
    result.outdoorObservationActivity,
    "Head outside for one calm observation mission and one focused family conversation.",
    145,
  );
  const printPlaces = getPrintablePlaces(result);
  const printCues = getPrintableFieldCues(result);
  const printBestTime = compactSentence(
    result.bestTimeWindow,
    "Morning or late afternoon is usually the safest, calmest window.",
    96,
  );
  const printWeather = compactSentence(
    result.whyTheseSpotsWork,
    "Check local conditions before you leave and adjust the pace to the weather you have.",
    92,
  );
  const printJournal = compactSentence(
    result.natureJournalPrompt,
    "Write one sentence about what you noticed first.",
    92,
  );
  const printDiscussion = compactSentence(
    result.discussionQuestion,
    "What clue helped your family understand the habitat best today?",
    92,
  );
  const printPackSafety = compactSentence(
    `${gear.slice(0, 3).join(", ")}. ${safetyNote}`,
    "Bring water, a notebook, and steady shoes. Move slowly and watch footing.",
    120,
  );
  const printBackup = compactSentence(
    result.fallbackPlan,
    "If weather or time changes, do a shorter observation walk near home and finish with the journal prompt indoors.",
    88,
  );
  const printChallenge = compactSentence(
    result.challengeActivity,
    "Complete one short field challenge before heading home.",
    88,
  );
  const fishingVisuals = [
    {
      label: "Target fish",
      url: result.fishOfTheDayImageUrl,
      alt:
        result.fishOfTheDayImageAlt ??
        `${result.fishingMainSpecies ?? result.animalOfTheDay} reference image`,
    },
    {
      label: "Live bait",
      url: result.liveBaitImageUrl,
      alt:
        result.liveBaitImageAlt ??
        `${result.fishingLiveBait ?? "Live bait"} reference image`,
    },
    {
      label: "Artificial bait",
      url: result.artificialBaitImageUrl,
      alt:
        result.artificialBaitImageAlt ??
        `${result.fishingArtificialBait ?? "Artificial bait"} reference image`,
    },
  ].filter((item): item is { label: string; url: string; alt: string } =>
    Boolean(item.url),
  );
  const printTargetIntel = compactSentence(
    isMuseumMission
      ? result.missionStops.join(" ")
      : [result.fishingMainSpeciesDescription, printBestTime, printWeather]
          .filter(Boolean)
          .join(" "),
    isMuseumMission
      ? "Use one clear museum route so the family sees the best exhibits before energy drops."
      : "Use today's water, weather, and species clues to choose one smart place to begin.",
    150,
  );
  const printTacticalBait = compactSentence(
    isMuseumMission
      ? result.scavengerHuntTasks.join(" ")
      : [
          result.fishingLiveBait ? `Live bait: ${result.fishingLiveBait}.` : "",
          result.fishingArtificialBait
            ? `Artificial bait: ${result.fishingArtificialBait}.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
    isMuseumMission
      ? "Keep the hunt short, specific, and easy to finish."
      : "Bring one simple live option and one compact artificial lure so the family can adjust quickly.",
    140,
  );
  const printCastingInstructions = compactSentence(
    isMuseumMission
      ? result.parentTalkingPoints.join(" ")
      : [result.fishingWhereToCast, printCues.join(". ")].filter(Boolean).join(" "),
    isMuseumMission
      ? "Pause often enough for kids to notice, compare, and explain what they found."
      : "Work visible cover, shade, grass edges, or structure transitions before changing locations.",
    140,
  );
  const printFieldNotes = compactSentence(
    [printJournal, printDiscussion, printChallenge].filter(Boolean).join(" "),
    "Record the clearest clue you saw and how it changed the family's plan.",
    150,
  );

  return (
    <div className="print-container daily-adventure-print-shell print-only mission-briefing">
      <div className="mission-title">
        WILD STALLION ACADEMY
        <br />
        EXPLORER MISSION BRIEFING
      </div>
      <img
        src="/wsa/logo.png"
        alt=""
        aria-hidden="true"
        className="daily-adventure-print-watermark"
      />
      <WSALetterhead
        className="daily-adventure-print-sheet daily-adventure-print-dossier"
        title=""
        subtitle="Southern Maryland Field Assignment"
        showHeaderImage={false}
      >
        {fishingVisuals.length ? (
          <div className="daily-adventure-print-image-row">
            {fishingVisuals.map((item) => (
              <section
                className="daily-adventure-print-image-card"
                key={item.label}
              >
                <img
                  src={item.url}
                  alt={item.alt}
                  className="daily-adventure-print-image"
                />
                <div className="daily-adventure-print-image-label">
                  {item.label}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        <div className="daily-adventure-print-meta">
          <div className="daily-adventure-print-species">
            {result.animalOfTheDay}
          </div>
          <div className="daily-adventure-print-date">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <section className="daily-adventure-print-section">
          <h3>Mission Objective</h3>
          <p>{printMission}</p>
        </section>

        <div className="daily-adventure-print-grid">
          <section className="daily-adventure-print-section">
            <h3>{isMuseumMission ? "Mission Route" : "Target Intel"}</h3>
            <p>{printTargetIntel}</p>
          </section>

          <section className="daily-adventure-print-section">
            <h3>{isMuseumMission ? "Scavenger Hunt" : "Tactical Bait"}</h3>
            <p>{printTacticalBait}</p>
          </section>

          <section className="daily-adventure-print-section">
            <h3>Deployment Zone</h3>
            <ul>
              {printPlaces.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="daily-adventure-print-section">
            <h3>{isMuseumMission ? "Talking Points" : "Casting Instructions"}</h3>
            <p>{printCastingInstructions}</p>
          </section>

          <section className="daily-adventure-print-section">
            <h3>Field Notes</h3>
            <p>{printFieldNotes}</p>
          </section>

          <section className="daily-adventure-print-section">
            <h3>Field Safety</h3>
            <p>{printPackSafety}</p>
          </section>

          <section className="daily-adventure-print-section">
            <h3>{isFishingMission ? "Weather Window" : "Best Window"}</h3>
            <p>{printBestTime}</p>
          </section>

          <section className="daily-adventure-print-section">
            <h3>Contingency Plan</h3>
            <p>{printBackup}</p>
          </section>
        </div>
      </WSALetterhead>
    </div>
  );
}
