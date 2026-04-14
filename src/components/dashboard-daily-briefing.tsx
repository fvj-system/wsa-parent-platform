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
  coolFact: string;
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

function summarizeForAdventure(value?: string | null) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const firstSentence = text.match(/[^.!?]+[.!?]?/)?.[0]?.trim() ?? text;
  const shortened = firstSentence.length > 120 ? `${firstSentence.slice(0, 117).trimEnd()}...` : firstSentence;
  return shortened;
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
        coolFact:
          summarizeForAdventure(briefing.animalOutput.funFacts[0]) ||
          summarizeForAdventure(briefing.animalOutput.whyThisPlaceFits) ||
          "This species is worth watching because small habitat clues can reveal a lot about how it survives.",
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
        coolFact:
          summarizeForAdventure(briefing.birdOutput.broadExplanation) ||
          summarizeForAdventure(briefing.birdOutput.fieldMarks[0]) ||
          "Birds often give themselves away by movement and sound before they are easy to see.",
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
        coolFact:
          summarizeForAdventure(briefing.plantOutput.seasonalNote) ||
          summarizeForAdventure(briefing.plantOutput.broadExplanation) ||
          "Plants tell a story through leaf shape, season, and the places where they thrive.",
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
        coolFact:
          summarizeForAdventure(briefing.fishOutput.whyThisFitsToday) ||
          summarizeForAdventure(briefing.fishOutput.wsaAnglerTip) ||
          "Fish respond fast to water conditions, cover, and small changes in how food moves.",
        startHref: buildAdventureHref(activeStudent?.id ?? null, "fish"),
        fullHref: `/generations/${briefing.fishGeneration.id}`
      }
    }),
    [activeStudent?.id, animalTailored?.explanation, birdTailored?.explanation, briefing, fishTailored?.explanation, plantTailored?.explanation]
  );

  const selectedItem = adventureItems[selectedCategory];
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
          <p className="eyebrow today-adventure-module-kicker">Species of the Day</p>
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
                <p className="today-adventure-section-label">Cool fact</p>
                <p className="panel-copy today-adventure-why">{selectedItem.coolFact}</p>
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
