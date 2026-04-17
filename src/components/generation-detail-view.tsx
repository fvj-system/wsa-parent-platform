import { DailyAdventurePrintSheet } from "@/components/daily-adventure-print-sheet";
import { PrintableJournalPage } from "@/components/printable-journal-page";
import { MarkCompleteCard } from "@/components/mark-complete-card";
import { RegulationStatusCard } from "@/components/regulation-status-card";
import { SpeciesPhotoGallery } from "@/components/species-photo-gallery";
import { generationKindLabel, getGenerationOutput, type DailyAdventureOutput, type GenerationRecord } from "@/lib/generations";
import { harvestAllowedForStatus, type RegulationStatus } from "@/lib/regulations/types";
import type { StudentRecord } from "@/lib/students";

type GenerationDetailViewProps = {
  generation: GenerationRecord;
  student?: StudentRecord | null;
  isCompleted?: boolean;
};

function renderSection(title: string, value: unknown) {
  if (!value) return null;

  if (Array.isArray(value)) {
    if (
      value.length &&
      typeof value[0] === "object" &&
      value[0] !== null &&
      "name" in (value[0] as Record<string, unknown>)
    ) {
      return (
        <section key={title}>
          <h3>{title}</h3>
          <div className="stack">
            {value.map((item, index) => {
              const spot = item as {
                name?: string;
                spotType?: string;
                locationLabel?: string;
                distanceMiles?: number | null;
                reason?: string;
                mapUrl?: string;
              };

              return (
                <article className="note-card" key={`${spot.name}-${index}`}>
                  <div className="copy">
                    <h4>{spot.name ?? "Recommended spot"}</h4>
                    <p className="muted" style={{ margin: "8px 0 0" }}>
                      {[spot.spotType, spot.locationLabel, spot.distanceMiles !== null && spot.distanceMiles !== undefined ? `${spot.distanceMiles} mi` : ""]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                    {spot.reason ? <p>{spot.reason}</p> : null}
                    {spot.mapUrl ? (
                      <a className="button button-ghost print-hide" href={spot.mapUrl} target="_blank" rel="noreferrer">
                        Open map
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    return (
      <section key={title}>
        <h3>{title}</h3>
        <ul className="result-list">
          {value.map((item) => (
            <li key={String(item)}>{String(item)}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section key={title}>
      <h3>{title}</h3>
      <p>{String(value)}</p>
    </section>
  );
}

export function GenerationDetailView({ generation, student, isCompleted = false }: GenerationDetailViewProps) {
  const output = (getGenerationOutput(generation) ?? {}) as Record<string, unknown>;
  const canMarkComplete = generation.tool_type !== "fish_of_the_day";
  const isDailyAdventure = generation.tool_type === "daily_adventure";
  const lessonSections: Array<[string, unknown]> = [
    ["Title", output.title || generation.title],
    ["Objective", output.objective],
    ["Warm-up", output.warmUp],
    ["Teaching points", output.teachingPoints],
    ["Activity", output.mainActivity || output.activity],
    ["Outdoor challenge", output.outdoorActivity || output.challengeActivity],
    ["Discussion questions", output.discussionQuestions || output.discussionQuestion],
    ["Journal prompt", output.journalPrompt || output.natureJournalPrompt],
    ["Parent notes", output.parentFollowUp || output.parentNotes],
    ["Supplies", output.supplies],
    ["Weather backup", output.weatherBackup]
  ];

  return (
    <div className="stack">
      <section className="panel stack print-sheet">
        <div className={`header-row ${isDailyAdventure ? "print-hide" : ""}`}>
          <div>
            <p className="eyebrow">{generationKindLabel(generation.tool_type)}</p>
            <h2>{generation.title}</h2>
          </div>
          <span className="pill">{new Date(generation.created_at).toLocaleDateString()}</span>
        </div>

        {student ? (
          <div className={`chip-list ${isDailyAdventure ? "print-hide" : ""}`}>
            <li>{student.name}</li>
            <li>{student.current_rank}</li>
            <li>{student.completed_adventures_count} completed adventures</li>
          </div>
        ) : null}

        <div className="print-hide">
          {canMarkComplete ? (
            <MarkCompleteCard
              studentId={student?.id ?? generation.student_id}
              generationId={generation.id}
              initialCompleted={isCompleted}
            />
          ) : null}
        </div>

        {Array.isArray(output.images) ? (
          <SpeciesPhotoGallery
            title={String(output.animalName || output.birdName || output.plantName || output.fishName || generation.title)}
            images={output.images.filter(
              (item): item is { label: string; url: string; alt: string } =>
                Boolean(
                  item &&
                    typeof item === "object" &&
                    "label" in item &&
                    "url" in item &&
                    "alt" in item
                )
            )}
          />
        ) : null}

        {generation.tool_type === "daily_adventure" ? (
          <>
            <div className="result-sections print-hide">
              {renderSection("Animal of the day", output.animalOfTheDay)}
              {renderSection("Morning question", output.morningQuestion)}
              {renderSection("Outdoor observation mission", output.outdoorObservationActivity)}
              {renderSection("Journal prompt", output.natureJournalPrompt)}
              {renderSection("Challenge", output.challengeActivity)}
              {renderSection("Best time today", output.bestTimeWindow)}
              {renderSection("Suggested place type", output.suggestedPlaceType)}
              {renderSection("Trail pack", output.gearChecklist)}
              {renderSection("Safety note", output.safetyNote)}
              {renderSection("Location summary", output.locationSummary)}
              {renderSection("Why these spots work", output.whyTheseSpotsWork)}
              {renderSection(
                "Library book idea",
                output.bookRecommendation && typeof output.bookRecommendation === "object"
                  ? [
                      (output.bookRecommendation as { label?: string }).label,
                      (output.bookRecommendation as { author?: string | null }).author
                        ? `by ${(output.bookRecommendation as { author?: string | null }).author}`
                        : "",
                      `Reading level: ${(output.bookRecommendation as { readingLevelLabel?: string }).readingLevelLabel ?? ""}`,
                      (output.bookRecommendation as { librarySystem?: string | null }).librarySystem ?? "",
                      (output.bookRecommendation as { libraryTip?: string }).libraryTip ?? ""
                    ]
                      .filter(Boolean)
                      .join(". ")
                  : null
              )}
              {renderSection("Recommended nearby spots", output.recommendedNearbySpots)}
              {renderSection("Fishing outlook", output.fishingOutlook)}
              {renderSection("Likely species", output.likelySpecies)}
              {renderSection("Best outing style", output.outingMode)}
              {renderSection("Fallback plan", output.fallbackPlan)}
              {renderSection("Optional bonus activity", output.optionalFieldTripIdea)}
              {renderSection("Facebook caption", output.facebookCaption)}
            </div>
            <DailyAdventurePrintSheet result={output as unknown as DailyAdventureOutput} />
          </>
        ) : null}

        {generation.tool_type === "animal_of_the_day" ? (
          <div className="result-sections">
            {renderSection("Animal name", output.animalName)}
            {renderSection("Fun facts", output.funFacts)}
            {renderSection("Habitat", output.habitat)}
            {renderSection("Likely habitat type", output.likelyHabitatType)}
            {renderSection("Diet", output.diet)}
            {renderSection("Tracks and sign", output.tracksAndSign)}
            {renderSection("Kid challenge", output.kidChallenge)}
            {renderSection("Drawing prompt", output.drawingPrompt)}
            {renderSection("Journal prompt", output.journalPrompt)}
            {renderSection("Safety note", output.safetyNote)}
            {renderSection("Best nearby place to look", output.bestNearbyPlaceType)}
            {renderSection("Why this place fits", output.whyThisPlaceFits)}
            {renderSection("Best time today", output.bestTimeWindow)}
            {renderSection("What to bring", output.whatToBring)}
            {renderSection("Recommended nearby spots", output.recommendedNearbySpots)}
            {renderSection("Facebook caption", output.facebookCaption)}
          </div>
        ) : null}

        {generation.tool_type === "bird_of_the_day" ? (
          <div className="result-sections">
            {renderSection("Bird name", output.birdName)}
            {renderSection("Why this bird fits today", output.broadExplanation)}
            {renderSection("Likely habitat", output.likelyHabitat)}
            {renderSection("Best nearby place to look", output.bestNearbyPlaceType)}
            {renderSection("Best time today", output.bestTimeWindow)}
            {renderSection("Field marks", output.fieldMarks)}
            {renderSection("Listening for", output.listeningFor)}
            {renderSection("Family challenge", output.familyChallenge)}
            {renderSection("Journal prompt", output.journalPrompt)}
            {renderSection("Safety note", output.safetyNote)}
            {renderSection("Recommended nearby spots", output.recommendedNearbySpots)}
            {renderSection("Facebook caption", output.facebookCaption)}
          </div>
        ) : null}

        {generation.tool_type === "plant_of_the_day" ? (
          <div className="result-sections">
            {renderSection("Plant name", output.plantName)}
            {renderSection("Why this plant fits today", output.broadExplanation)}
            {renderSection("Likely habitat", output.likelyHabitat)}
            {renderSection("Best nearby place to look", output.bestNearbyPlaceType)}
            {renderSection("Best time today", output.bestTimeWindow)}
            {renderSection("Key features", output.keyFeatures)}
            {renderSection("Seasonal note", output.seasonalNote)}
            {renderSection("Family challenge", output.familyChallenge)}
            {renderSection("Journal prompt", output.journalPrompt)}
            {renderSection("Safety note", output.safetyNote)}
            {renderSection("Recommended nearby spots", output.recommendedNearbySpots)}
            {renderSection("Facebook caption", output.facebookCaption)}
          </div>
        ) : null}

        {generation.tool_type === "fish_of_the_day" ? (
          <div className="result-sections">
            {output.regulationStatus ? (
              <RegulationStatusCard
                status={output.regulationStatus as RegulationStatus}
                seasonNote={typeof output.seasonNote === "string" ? output.seasonNote : ""}
                bagLimitNote={typeof output.bagLimitNote === "string" ? output.bagLimitNote : ""}
                sizeLimitNote={typeof output.sizeLimitNote === "string" ? output.sizeLimitNote : ""}
                protectedNote={typeof output.protectedNote === "string" ? output.protectedNote : ""}
                gearRuleNote={typeof output.gearRuleNote === "string" ? output.gearRuleNote : ""}
                source={typeof output.regulationSource === "string" ? output.regulationSource : ""}
                sourceUrl={typeof output.regulationSourceUrl === "string" ? output.regulationSourceUrl : ""}
                lastChecked={typeof output.regulationLastChecked === "string" ? output.regulationLastChecked : ""}
                compact
              />
            ) : null}
            {renderSection("Fish name", output.fishName)}
            {renderSection("Water type today", output.waterType)}
            {renderSection("Why this fish fits today", output.broadExplanation)}
            {renderSection("Likely habitat", output.likelyHabitat)}
            {renderSection("Best nearby place to try", output.bestNearbyPlaceType)}
            {renderSection("Best time today", output.bestTimeWindow)}
            {renderSection("Fishing outlook", output.fishingOutlook)}
            {renderSection("Best use of the outing", output.bestUseOfOuting)}
            {renderSection("Likely related species", output.likelyRelatedSpecies)}
            {renderSection("Best beginner bait", output.bestBeginnerBait)}
            {renderSection("Best lures", output.optionalLure)}
            {renderSection("Basic tackle setup", output.basicTackleSuggestion)}
            {renderSection("Why this setup fits", output.whyThisFitsToday)}
            {renderSection("Safety and access note", output.safetyAccessNote)}
            {renderSection("Quick challenge", output.quickChallenge)}
            {output.regulationStatus && !harvestAllowedForStatus(output.regulationStatus as RegulationStatus) ? (
              renderSection("Harvest note", "Identification and learning only. Check current Maryland rules before using cooking or harvest guidance.")
            ) : (
              <>
                {renderSection("Flavor profile", output.flavorProfile)}
                {renderSection("Best cooking methods", output.bestCookingMethods)}
                {renderSection("Preparation tips", output.preparationTips)}
              </>
            )}
            {renderSection("Best season", output.bestSeason)}
            {renderSection("WSA angler tip", output.wsaAnglerTip)}
            {renderSection("Recommended nearby spots", output.recommendedNearbySpots)}
            {renderSection("Facebook caption", output.facebookCaption)}
          </div>
        ) : null}

        {generation.tool_type === "week_plan" ? (
          <div className="result-sections">
            {renderSection("Weekly overview", output.weeklyOverview)}
            <section>
              <h3>Daily plan</h3>
              <div className="stack">
                {Array.isArray(output.dailyPlan)
                  ? output.dailyPlan.map((entry) => {
                      const item = entry as { dayLabel?: string; focus?: string; activities?: string[] };
                      return (
                        <article className="note-card" key={item.dayLabel}>
                          <div className="copy">
                            <h4>{item.dayLabel}</h4>
                            <p className="muted">{item.focus}</p>
                            <ul className="result-list">
                              {(item.activities ?? []).map((activity) => (
                                <li key={activity}>{activity}</li>
                              ))}
                            </ul>
                          </div>
                        </article>
                      );
                    })
                  : null}
              </div>
            </section>
            {renderSection("Suggested field trips", output.suggestedFieldTrips)}
            {renderSection(
              "Library book ideas",
              Array.isArray(output.bookRecommendations)
                ? output.bookRecommendations.map((item) => {
                    const book = item as {
                      label?: string;
                      author?: string | null;
                      readingLevelLabel?: string;
                      librarySystem?: string | null;
                      libraryTip?: string;
                    };

                    return [
                      book.label,
                      book.author ? `by ${book.author}` : "",
                      book.readingLevelLabel ? `Reading level: ${book.readingLevelLabel}` : "",
                      book.librarySystem ?? "",
                      book.libraryTip ?? ""
                    ]
                      .filter(Boolean)
                      .join(". ");
                  })
                : null
            )}
            {renderSection("Materials list", output.materialsList)}
            {renderSection("Parent notes", output.parentNotes)}
            {renderSection("Printable summary", output.printableSummary)}
          </div>
        ) : null}

        {generation.tool_type === "lesson" ? <div className="result-sections">{lessonSections.map(([title, value]) => renderSection(title, value))}</div> : null}
      </section>

      {isDailyAdventure ? null : <PrintableJournalPage studentName={student?.name} title={String(output.animalOfTheDay || generation.title)} />}
    </div>
  );
}
