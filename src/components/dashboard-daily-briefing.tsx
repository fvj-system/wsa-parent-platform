"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  tailorAnimalBriefingForStudent,
  tailorBirdBriefingForStudent,
  tailorFishBriefingForStudent,
  tailorPlantBriefingForStudent,
  type HouseholdBriefing
} from "@/lib/daily-briefing";
import type { StudentRecord } from "@/lib/students";

type DashboardDailyBriefingProps = {
  briefing: HouseholdBriefing;
  activeStudent: StudentRecord | null;
  totalCompletedAdventures: number;
  totalSavedLessons: number;
  printableItemsCreated: number;
  todayAdventureHref: string;
  historyFact: string;
  natureQuote: { quote: string; author: string };
};

type AdventureCategory = "animal" | "bird" | "plant" | "fish";

type AdventureItem = {
  key: AdventureCategory;
  selectorLabel: string;
  title: string;
  scientificName?: string;
  imageUrl?: string;
  imageAlt?: string;
  bestTime: string;
  lookFor: string[];
  where: string[];
  startHref: string;
  fullHref: string;
};

function buildAdventureHref(studentId: string | null, preset?: "animal" | "bird" | "plant" | "fish" | "fishing") {
  const params = new URLSearchParams();
  if (studentId) params.set("studentId", studentId);
  if (preset) params.set("preset", preset);
  const query = params.toString();
  return query ? `/daily-adventure?${query}` : "/daily-adventure";
}

function cleanCue(value?: string | null) {
  return String(value ?? "")
    .replace(/^Quick ID tip:\s*/i, "")
    .trim();
}

function summarizeForAdventure(value?: string | null) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const firstSentence = text.match(/[^.!?]+[.!?]?/)?.[0]?.trim() ?? text;
  const shortened = firstSentence.length > 120 ? `${firstSentence.slice(0, 117).trimEnd()}...` : firstSentence;
  return shortened;
}

function shortenCue(value?: string | null) {
  const cue = cleanCue(value);
  if (!cue) return "";
  return cue.length > 64 ? `${cue.slice(0, 61).trimEnd()}...` : cue;
}

const imageStyles: Record<AdventureCategory, string> = {
  animal: "today-adventure-image-focus",
  bird: "today-adventure-image-top",
  plant: "today-adventure-image-focus",
  fish: "today-adventure-image-focus"
};

function shouldUseImageContainMode(item: AdventureItem) {
  return !item.imageUrl || item.imageUrl.includes("/field-guide/");
}

export function DashboardDailyBriefing({
  briefing,
  activeStudent,
  totalCompletedAdventures: _totalCompletedAdventures,
  totalSavedLessons: _totalSavedLessons,
  printableItemsCreated: _printableItemsCreated,
  todayAdventureHref: _todayAdventureHref,
  historyFact,
  natureQuote
}: DashboardDailyBriefingProps) {
  const [selectedCategory, setSelectedCategory] = useState<AdventureCategory>("animal");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const animalTailored = activeStudent ? tailorAnimalBriefingForStudent(activeStudent, briefing.animalOutput) : null;
  const birdTailored = activeStudent ? tailorBirdBriefingForStudent(activeStudent, briefing.birdOutput) : null;
  const plantTailored = activeStudent ? tailorPlantBriefingForStudent(activeStudent, briefing.plantOutput) : null;
  const fishTailored = activeStudent ? tailorFishBriefingForStudent(activeStudent, briefing.fishOutput) : null;

  const adventureItems = useMemo<Record<AdventureCategory, AdventureItem>>(
    () => ({
      animal: {
        key: "animal",
        selectorLabel: "Animal",
        title: briefing.animalOutput.animalName,
        scientificName: briefing.animalOutput.scientificName,
        imageUrl: briefing.animalOutput.imageUrl ?? "/field-guide/mammals.png",
        imageAlt: briefing.animalOutput.imageAlt ?? `${briefing.animalOutput.animalName} field-guide image`,
        bestTime: summarizeForAdventure(briefing.animalOutput.bestTimeWindow ?? "Morning or late afternoon tend to be the best windows."),
        lookFor: [
          shortenCue(briefing.animalOutput.quickIdTip),
          shortenCue(briefing.animalOutput.tracksAndSign)
        ],
        where: [
          shortenCue(`Look near ${briefing.animalOutput.bestNearbyPlaceType ?? briefing.animalOutput.likelyHabitatType ?? "nearby habitat"}`),
          shortenCue(briefing.animalOutput.habitat)
        ],
        startHref: buildAdventureHref(activeStudent?.id ?? null, "animal"),
        fullHref: `/generations/${briefing.animalGeneration.id}`
      },
      bird: {
        key: "bird",
        selectorLabel: "Bird",
        title: briefing.birdOutput.birdName,
        scientificName: briefing.birdOutput.scientificName,
        imageUrl: briefing.birdOutput.imageUrl,
        imageAlt: briefing.birdOutput.imageAlt,
        bestTime: summarizeForAdventure(briefing.birdOutput.bestTimeWindow),
        lookFor: [
          shortenCue(briefing.birdOutput.quickIdTip || briefing.birdOutput.fieldMarks[0]),
          shortenCue(`Listen for ${briefing.birdOutput.listeningFor.toLowerCase()}`)
        ],
        where: [
          shortenCue(`Watch ${briefing.birdOutput.bestNearbyPlaceType.toLowerCase()}`),
          shortenCue(briefing.birdOutput.likelyHabitat)
        ],
        startHref: buildAdventureHref(activeStudent?.id ?? null, "bird"),
        fullHref: `/generations/${briefing.birdGeneration.id}`
      },
      plant: {
        key: "plant",
        selectorLabel: "Plant",
        title: briefing.plantOutput.plantName,
        scientificName: briefing.plantOutput.scientificName,
        imageUrl: briefing.plantOutput.imageUrl,
        imageAlt: briefing.plantOutput.imageAlt,
        bestTime: summarizeForAdventure(briefing.plantOutput.bestTimeWindow),
        lookFor: [
          shortenCue(briefing.plantOutput.quickIdTip || briefing.plantOutput.keyFeatures[0]),
          shortenCue(briefing.plantOutput.keyFeatures[1] ?? "")
        ],
        where: [
          shortenCue(`Check ${briefing.plantOutput.bestNearbyPlaceType.toLowerCase()}`),
          shortenCue(briefing.plantOutput.likelyHabitat)
        ],
        startHref: buildAdventureHref(activeStudent?.id ?? null, "plant"),
        fullHref: `/generations/${briefing.plantGeneration.id}`
      },
      fish: {
        key: "fish",
        selectorLabel: "Fish",
        title: briefing.fishOutput.fishName,
        scientificName: briefing.fishOutput.scientificName,
        imageUrl: briefing.fishOutput.imageUrl,
        imageAlt: briefing.fishOutput.imageAlt,
        bestTime: summarizeForAdventure(briefing.fishOutput.bestTimeWindow),
        lookFor: [
          shortenCue(briefing.fishOutput.quickIdTip || briefing.fishOutput.bestBeginnerBait),
          shortenCue(briefing.fishOutput.likelyHabitat)
        ],
        where: [
          shortenCue(`Fish ${briefing.fishOutput.waterType.toLowerCase()} water`),
          shortenCue(briefing.fishOutput.bestNearbyPlaceType)
        ],
        startHref: buildAdventureHref(activeStudent?.id ?? null, "fish"),
        fullHref: `/generations/${briefing.fishGeneration.id}`
      }
    }),
    [activeStudent?.id, animalTailored?.explanation, birdTailored?.explanation, briefing, fishTailored?.explanation, plantTailored?.explanation]
  );

  const selectedItem = adventureItems[selectedCategory];
  const uniqueLookForCues = Array.from(new Set(selectedItem.lookFor.filter(Boolean)));
  const uniqueWhereCues = Array.from(new Set(selectedItem.where.filter(Boolean)));
  const statusLabel = `${activeStudent?.name ?? "Household"} | ${activeStudent?.current_rank ?? "Colt"} Trail Status`;
  const historyPreview = summarizeForAdventure(historyFact) || historyFact;

  return (
    <section className="panel stack">
      <div className="daily-briefing-control-bar">
        <p className="daily-briefing-status-line">{statusLabel}</p>
      </div>

      <div className="daily-briefing-notes-strip">
        <article className="field-guide-note daily-briefing-note-inline daily-history-fact-note">
          <button
            type="button"
            className={`daily-history-fact-toggle ${isHistoryOpen ? "daily-history-fact-toggle-open" : ""}`}
            onClick={() => setIsHistoryOpen((current) => !current)}
            aria-expanded={isHistoryOpen}
          >
            <span className="eyebrow daily-history-fact-label">History Fact</span>
            <span className="daily-history-fact-preview">{historyPreview}</span>
            <span className="daily-history-fact-toggle-text">{isHistoryOpen ? "Hide" : "Read more"}</span>
          </button>
          <div className={`daily-history-fact-panel ${isHistoryOpen ? "daily-history-fact-panel-open" : ""}`}>
            <div className="daily-history-fact-copy">
              <p className="daily-history-fact-hook">Did you know?</p>
              <p className="daily-history-fact-body">{historyFact}</p>
            </div>
          </div>
        </article>

        <article className="field-guide-note daily-briefing-note-inline">
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            Nature Quote
          </p>
          <p className="panel-copy" style={{ marginBottom: 6 }}>
            "{natureQuote.quote}"
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {natureQuote.author}
          </p>
        </article>
      </div>

      <section className="specimen-card today-adventure-module">
        <div className="today-adventure-module-header">
          <p className="eyebrow today-adventure-module-kicker">Today&apos;s Adventure</p>
          <div className="today-adventure-category-switcher" role="tablist" aria-label="Daily adventure category">
            {(Object.keys(adventureItems) as AdventureCategory[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`today-adventure-category-pill ${selectedCategory === key ? "today-adventure-category-pill-active" : ""}`}
                onClick={() => setSelectedCategory(key)}
                aria-pressed={selectedCategory === key}
              >
                {adventureItems[key].selectorLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="today-adventure-module-body">
          <div className={`today-adventure-media ${shouldUseImageContainMode(selectedItem) ? "today-adventure-media-contain" : ""}`}>
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.imageAlt}
              className={`${imageStyles[selectedCategory]} today-adventure-media-image ${shouldUseImageContainMode(selectedItem) ? "today-adventure-image-contain" : ""}`}
            />
          </div>

          <div className="today-adventure-copy">
            <div className="today-adventure-copy-head">
              <h4>{selectedItem.title}</h4>
              {selectedItem.scientificName ? (
                <p className="muted today-adventure-scientific">{selectedItem.scientificName}</p>
              ) : null}
            </div>

            <div className="today-adventure-sections">
              <div className="today-adventure-section">
                <p className="today-adventure-section-label">Best time</p>
                <p className="panel-copy today-adventure-why">{selectedItem.bestTime}</p>
              </div>

              <div className="today-adventure-section">
                <p className="today-adventure-section-label">Look for</p>
                <ul className="today-adventure-cues">
                  {uniqueLookForCues.slice(0, 2).map((cue, index) => (
                    <li key={`${cue}-${index}`}>{cue}</li>
                  ))}
                </ul>
              </div>

              <div className="today-adventure-section">
                <p className="today-adventure-section-label">Where</p>
                <ul className="today-adventure-cues">
                  {uniqueWhereCues.slice(0, 2).map((cue, index) => (
                    <li key={`${cue}-${index}`}>{cue}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="cta-row today-adventure-actions">
              <Link className="button button-primary" href={selectedItem.startHref}>
                Start Adventure
              </Link>
              <Link className="button button-ghost" href={selectedItem.fullHref}>
                Open full page
              </Link>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
