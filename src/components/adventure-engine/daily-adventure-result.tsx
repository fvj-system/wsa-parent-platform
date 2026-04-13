import Link from "next/link";
import { AdventureShareButton } from "@/components/adventure-share-button";
import { CopyFacebookCaptionButton } from "@/components/copy-facebook-caption-button";
import { DailyAdventurePrintSheet } from "@/components/daily-adventure-print-sheet";
import { PrintButton } from "@/components/print-button";
import { RecommendedSpotsList } from "@/components/recommended-spots-list";
import type { DailyAdventureOutput } from "@/lib/generations";

type DailyAdventureResultProps = {
  result: DailyAdventureOutput | null;
  generationId?: string;
};

function PackIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7a4 4 0 0 1 8 0" />
      <path d="M7 7h10l1 12H6L7 7Z" />
      <path d="M9 11h6" />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 4.5-2.7 7.7-7 10-4.3-2.3-7-5.5-7-10V6l7-3Z" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function MissionIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l2.7 5.5L21 11l-4.5 4.2 1 5.8-5-2.7-5 2.7 1-5.8L3 11l6.3-2.5L12 3Z" />
    </svg>
  );
}

function plainBestTimeLabel(value: string) {
  return value
    .replace(/^a /i, "")
    .replace(/^the /i, "")
    .replace(/^focus more on /i, "")
    .trim();
}

function deriveGearChecklist(result: DailyAdventureOutput) {
  if (result.gearChecklist?.length) return result.gearChecklist;

  const text = [result.outdoorObservationActivity, result.challengeActivity, result.optionalFieldTripIdea].join(" ").toLowerCase();
  const gear = new Set<string>(["Field notebook", "Pencil", "Water bottle"]);

  if (/(bird|binocular|hawk|owl|sparrow|watch)/.test(text)) gear.add("Binoculars");
  if (/(pond|creek|river|wetland|water)/.test(text)) gear.add("Mud-friendly shoes");
  if (/(bug|insect|frog|track|leaf|seed|bark)/.test(text)) gear.add("Magnifying glass");
  if (/(trail|hike|walk|woods|forest)/.test(text)) gear.add("Closed-toe walking shoes");
  if (/(field trip|park|shore|boardwalk)/.test(text)) gear.add("Small daypack");

  return Array.from(gear).slice(0, 5);
}

function deriveSafetyNote(result: DailyAdventureOutput) {
  if (result.safetyNote) return result.safetyNote;

  const text = [result.outdoorObservationActivity, result.challengeActivity, result.optionalFieldTripIdea].join(" ").toLowerCase();

  if (/(creek|river|pond|shore|water)/.test(text)) {
    return "Stay with your child near water edges, keep dry shoes handy, and choose firm footing before stopping to observe.";
  }

  if (/(trail|forest|woods|hike)/.test(text)) {
    return "Stick to known paths, check for ticks afterward, and keep the pace comfortable enough for steady observation.";
  }

  return "Bring water, watch footing, and keep the adventure short enough that it still feels calm and successful for the family.";
}

export function DailyAdventureResult({ result, generationId }: DailyAdventureResultProps) {
  if (!result) {
    return (
      <article className="panel stack daily-adventure-sheet">
        <div className="field-empty-state">
          <div className="copy">
            <p className="eyebrow">Latest result</p>
            <h3>No adventure generated yet</h3>
            <p className="panel-copy">Your daily field-guide plan will appear here after you generate today&apos;s adventure.</p>
          </div>
        </div>
      </article>
    );
  }

  const gear = deriveGearChecklist(result);
  const safetyNote = deriveSafetyNote(result);
  const isFishingMission = Boolean(result.fishingMainSpecies || result.fishingOutlook);
  const isMuseumMission = Boolean(
    result.missionStops?.length ||
      result.scavengerHuntTasks?.length ||
      result.parentTalkingPoints?.length ||
      result.specialExhibitNote,
  );

  return (
    <article className="panel stack daily-adventure-sheet daily-adventure-sheet-fullscreen print-sheet">
      <div className="daily-adventure-screen">
        <div className="header-row print-hide field-section-header">
          <div className="adventure-title-block">
            <div className="field-section-heading">
              <span className="field-guide-icon-disc">
                <MissionIcon />
              </span>
              <div>
                <p className="eyebrow">Today&apos;s mission</p>
                <div className="wood-banner wood-banner-small">Field Guide Planner</div>
                <h3 className="adventure-title">{result.animalOfTheDay}</h3>
              </div>
            </div>
          </div>
          <div className="nav-actions">
            {generationId ? <Link className="button button-ghost" href={`/generations/${generationId}`}>Open detail</Link> : null}
            <AdventureShareButton title={result.animalOfTheDay} generationId={generationId} />
            <PrintButton />
          </div>
        </div>

        {isFishingMission ? (
          <div className="fishing-mission-card">
            <div className="mission-crest">
              <span className="pill field-guide-pill">Today's Mission</span>
              <h2>{result.fishingMainSpecies ?? result.animalOfTheDay}</h2>
              {result.fishingMainSpeciesDescription ? (
                <p className="panel-copy" style={{ margin: 0 }}>{result.fishingMainSpeciesDescription}</p>
              ) : null}
            </div>

            <div className="fishing-mission-grid">
              {result.fishingLiveBait ? (
                <section className="mission-panel">
                  <div className="section-heading"><MissionIcon /><h4>Live bait</h4></div>
                  <p>{result.fishingLiveBait}</p>
                </section>
              ) : null}
              {result.fishingArtificialBait ? (
                <section className="mission-panel">
                  <div className="section-heading"><MissionIcon /><h4>Artificial bait</h4></div>
                  <p>{result.fishingArtificialBait}</p>
                </section>
              ) : null}
              {result.bestTimeWindow ? (
                <section className="mission-panel">
                  <div className="section-heading"><MissionIcon /><h4>Best time</h4></div>
                  <p>{plainBestTimeLabel(result.bestTimeWindow)}</p>
                </section>
              ) : null}
              {result.fishingBestPlace ? (
                <section className="mission-panel">
                  <div className="section-heading"><MissionIcon /><h4>Best place</h4></div>
                  <p>{result.fishingBestPlace}</p>
                </section>
              ) : null}
              {result.fishingWhereToCast ? (
                <section className="mission-panel">
                  <div className="section-heading"><MissionIcon /><h4>Where to cast</h4></div>
                  <p>{result.fishingWhereToCast}</p>
                </section>
              ) : null}
              {result.fishingMainSpeciesDescription ? (
                <section className="mission-panel">
                  <div className="section-heading"><MissionIcon /><h4>Main fish</h4></div>
                  <p>{result.fishingMainSpeciesDescription}</p>
                </section>
              ) : null}
              {result.fishingOtherLikelyFish?.length ? (
                <section className="mission-panel fishing-mission-span">
                  <div className="section-heading"><MissionIcon /><h4>Other likely fish</h4></div>
                  <ul className="result-list result-list-tight">
                    {result.fishingOtherLikelyFish.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {result.challengeActivity ? (
                <section className="mission-panel fishing-mission-span">
                  <div className="section-heading"><MissionIcon /><h4>Quick challenge</h4></div>
                  <p>{result.challengeActivity}</p>
                </section>
              ) : null}
            </div>

            <div className="fishing-mission-footer">
              <section className="trail-pack-card">
                <div className="section-heading section-heading-compact">
                  <PackIcon />
                  <h4>Trail pack</h4>
                </div>
                <ul className="result-list result-list-tight" style={{ marginTop: 8 }}>
                  {gear.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="safety-card">
                <div className="section-heading section-heading-compact">
                  <SafetyIcon />
                  <h4>Safety note</h4>
                </div>
                <p>{safetyNote}</p>
              </section>
            </div>
          </div>
        ) : (
          <>
            <div className="daily-adventure-lead">
              <div className="mission-crest">
                <span className="pill field-guide-pill">
                  {isMuseumMission ? "Museum mission" : "Animal of the day"}
                </span>
                <h2>{result.animalOfTheDay}</h2>
                <p className="panel-copy" style={{ margin: 0 }}>
                  {isMuseumMission
                    ? "A field-guide museum plan with a clear route, scavenger tasks, and parent talking points."
                    : "A field-ready homeschool plan built for one clear outdoor mission and one meaningful conversation."}
                </p>
              </div>

              <div className="trail-note trail-note-framed">
                <p className="eyebrow" style={{ marginBottom: 8 }}>Morning question</p>
                <p className="panel-copy" style={{ margin: 0 }}>{result.morningQuestion}</p>
              </div>
            </div>

            <div className="mission-layout">
              <section className="mission-main">
                <div className="result-sections">
                  <section className="mission-panel">
                    <div className="section-heading">
                      <MissionIcon />
                      <h4>{isMuseumMission ? "Main mission" : "Outdoor mission"}</h4>
                    </div>
                    <p>{result.outdoorObservationActivity}</p>
                  </section>
                  <section className="mission-panel">
                    <div className="section-heading">
                      <MissionIcon />
                      <h4>Challenge activity</h4>
                    </div>
                    <p>{result.challengeActivity}</p>
                  </section>
                  {result.missionStops?.length ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Best stops</h4>
                      </div>
                      <ul className="result-list result-list-tight">
                        {result.missionStops.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {result.scavengerHuntTasks?.length ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Scavenger hunt checklist</h4>
                      </div>
                      <ul className="result-list result-list-tight">
                        {result.scavengerHuntTasks.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  <section className="mission-panel">
                    <div className="section-heading">
                      <MissionIcon />
                      <h4>Nature journal prompt</h4>
                    </div>
                    <p>{result.natureJournalPrompt}</p>
                  </section>
                  <section className="mission-panel">
                    <div className="section-heading">
                      <MissionIcon />
                      <h4>Discussion question</h4>
                    </div>
                    <p>{result.discussionQuestion}</p>
                  </section>
                  {result.optionalFieldTripIdea ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Optional field trip idea</h4>
                      </div>
                      <p>{result.optionalFieldTripIdea}</p>
                    </section>
                  ) : null}
                  {result.locationSummary ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Where to head today</h4>
                      </div>
                      <p>{result.locationSummary}</p>
                    </section>
                  ) : null}
                  {result.fishingOutlook ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Fishing outlook for today</h4>
                      </div>
                      <p className="muted advice-note" style={{ margin: 0 }}>
                        This is a practical outlook, not a promise. Weather, access, and water conditions matter more than any one signal.
                      </p>
                      <p>{result.fishingOutlook}</p>
                    </section>
                  ) : null}
                  {result.parentTalkingPoints?.length ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Parent talking points</h4>
                      </div>
                      <ul className="result-list result-list-tight">
                        {result.parentTalkingPoints.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {result.specialExhibitNote ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Special exhibit note</h4>
                      </div>
                      <p>{result.specialExhibitNote}</p>
                    </section>
                  ) : null}
                  {result.likelySpecies?.length ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Likely species in this kind of water</h4>
                      </div>
                      <ul className="result-list result-list-tight">
                        {result.likelySpecies.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {result.fallbackPlan ? (
                    <section className="mission-panel">
                      <div className="section-heading">
                        <MissionIcon />
                        <h4>Fallback plan</h4>
                      </div>
                      <p>{result.fallbackPlan}</p>
                    </section>
                  ) : null}
                  <RecommendedSpotsList
                    title={
                      isMuseumMission
                        ? "Selected Smithsonian stops"
                        : "Best nearby places to look"
                    }
                    items={result.recommendedNearbySpots ?? []}
                    emptyMessage="No nearby location recommendations were saved with this adventure yet."
                  />
                </div>
              </section>

              <aside className="mission-side">
                {result.bestTimeWindow ? (
                  <section className="trail-note trail-note-framed">
                    <div className="section-heading section-heading-compact">
                      <MissionIcon />
                      <h4>Best window today</h4>
                    </div>
                    <p className="panel-copy" style={{ margin: 0 }}>
                      {plainBestTimeLabel(result.bestTimeWindow)}
                    </p>
                  </section>
                ) : null}

                <section className="trail-pack-card">
                  <div className="section-heading section-heading-compact">
                    <PackIcon />
                    <h4>Trail pack</h4>
                  </div>
                  <ul className="result-list result-list-tight" style={{ marginTop: 8 }}>
                    {gear.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="safety-card">
                  <div className="section-heading section-heading-compact">
                    <SafetyIcon />
                    <h4>Safety note</h4>
                  </div>
                  <p>{safetyNote}</p>
                </section>

                {result.outingMode ? (
                  <section className="trail-note trail-note-framed">
                    <div className="section-heading section-heading-compact">
                      <MissionIcon />
                      <h4>Best use of the outing</h4>
                    </div>
                    <p className="panel-copy" style={{ margin: 0 }}>
                      {result.outingMode}
                    </p>
                  </section>
                ) : null}

                <section className="trail-note trail-note-framed">
                  <div className="section-heading section-heading-compact">
                    <MissionIcon />
                    <h4>Quick family win</h4>
                  </div>
                  <p className="panel-copy" style={{ margin: 0 }}>
                    {isMuseumMission
                      ? "If time runs short, answer the morning question in one anchor gallery, finish three scavenger tasks, and end with the journal prompt."
                      : "If time runs short, answer the morning question outdoors, complete one focused observation, and finish with the journal prompt."}
                  </p>
                </section>

                <section className="trail-note trail-note-framed print-hide">
                  <div className="section-heading section-heading-compact">
                    <MissionIcon />
                    <h4>Facebook caption</h4>
                  </div>
                  <p className="panel-copy" style={{ margin: 0 }}>
                    {result.facebookCaption}
                  </p>
                  <div className="cta-row" style={{ marginTop: 12 }}>
                    <CopyFacebookCaptionButton caption={result.facebookCaption} />
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>

      <DailyAdventurePrintSheet result={result} />
    </article>
  );
}
