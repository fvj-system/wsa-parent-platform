"use client";

import { useEffect, useState } from "react";
import { DailyAdventureResult } from "@/components/adventure-engine/daily-adventure-result";
import { LocationContextFields } from "@/components/location-context-fields";
import { MarkCompleteCard } from "@/components/mark-complete-card";
import {
  dailyAdventurePresets,
  type DailyAdventurePresetKey,
} from "@/lib/daily-adventure-presets";
import type { DailyAdventureOutput, GenerationRecord } from "@/lib/generations";
import {
  smithsonianMuseums,
  type SmithsonianMuseumKey,
} from "@/lib/smithsonian-museums";
import type { FamilyOpportunity } from "@/lib/nearby/family-opportunities";
import { FISH_DATA } from "@/lib/species/fish-data";
import type { StudentRecord } from "@/lib/students";

type DailyAdventureGeneratorProps = {
  userId: string;
  initialHistory: GenerationRecord[];
  students: StudentRecord[];
  preselectedStudentId?: string;
  preselectedPreset?: DailyAdventurePresetKey;
  initialLocationLabel?: string;
  initialRadiusMiles?: number;
  initialWeatherCondition?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  weatherHelperText?: string;
  homeZipcode?: string | null;
  localEvents?: FamilyOpportunity[];
  preselectedEventId?: string;
};

type DailyAdventureResponse = {
  generation: GenerationRecord;
  output: DailyAdventureOutput;
};

type ViewState = "idle" | "loading" | "result";
type SelectedTarget =
  | { targetType: "household"; targetId: string }
  | { targetType: "student"; targetId: string };

const advancedPlanStyleOptions = [
  "Calm nature day",
  "Adventurous outing",
  "History-focused day",
  "Skill-building day",
  "Mixed family sampler",
] as const;

const advancedMainGoalOptions = [
  "Nature and wildlife",
  "Museum or history",
  "Fishing or water skills",
  "Outdoor resilience skills",
  "Find a good local event",
] as const;

const advancedPracticalNeedOptions = [
  "Easy restrooms",
  "Food nearby",
  "Short walks",
  "Stroller friendly",
  "Indoor backup",
  "Low-cost only",
] as const;

function JournalIcon() {
  return (
    <svg
      aria-hidden="true"
      className="guide-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 4h9a2 2 0 0 1 2 2v14H9a2 2 0 0 0-2 2V4Z" />
      <path d="M7 4H6a2 2 0 0 0-2 2v14h3" />
      <path d="M10 8h5" />
      <path d="M10 12h5" />
    </svg>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRadiusMilesForTravelDistance(
  travelDistance: string,
  fallbackRadiusMiles: number,
) {
  switch (travelDistance) {
    case "backyard":
      return 5;
    case "regional":
      return 25;
    case "far":
      return 50;
    case "local":
      return 10;
    default:
      return fallbackRadiusMiles;
  }
}

export function DailyAdventureGenerator({
  userId,
  initialHistory: _initialHistory,
  students,
  preselectedStudentId,
  preselectedPreset,
  initialLocationLabel = "Southern Maryland",
  initialRadiusMiles = 10,
  initialWeatherCondition = "clear",
  initialLatitude,
  initialLongitude,
  weatherHelperText = "",
  homeZipcode,
  localEvents = [],
  preselectedEventId,
}: DailyAdventureGeneratorProps) {
  const [result, setResult] = useState<DailyAdventureOutput | null>(null);
  const [latestGenerationId, setLatestGenerationId] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>(
    preselectedStudentId
      ? { targetType: "student", targetId: preselectedStudentId }
      : { targetType: "household", targetId: userId },
  );
  const [selectedPreset, setSelectedPreset] = useState<
    DailyAdventurePresetKey | ""
  >(preselectedPreset ?? "");
  const [selectedMuseumKeys, setSelectedMuseumKeys] = useState<
    SmithsonianMuseumKey[]
  >([]);
  const [locationLabel, setLocationLabel] = useState(initialLocationLabel);
  const [radiusMiles, setRadiusMiles] = useState(String(initialRadiusMiles));
  const [weatherCondition, setWeatherCondition] = useState(
    initialWeatherCondition,
  );
  const [latitude, setLatitude] = useState<number | undefined>(
    typeof initialLatitude === "number" ? initialLatitude : undefined,
  );
  const [longitude, setLongitude] = useState<number | undefined>(
    typeof initialLongitude === "number" ? initialLongitude : undefined,
  );
  const [forecastHelperText, setForecastHelperText] =
    useState(weatherHelperText);
  const [error, setError] = useState("");
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [isWeatherResolving, setIsWeatherResolving] = useState(false);
  const [timeAvailable, setTimeAvailable] = useState("1-2 hours");
  const [budget, setBudget] = useState("free");
  const [energyLevel, setEnergyLevel] = useState("medium");
  const [travelDistance, setTravelDistance] = useState("local");
  const [targetFish, setTargetFish] = useState("");
  const [plannerMode, setPlannerMode] = useState<"standard" | "advanced">(
    "standard",
  );
  const [planStyle, setPlanStyle] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [practicalNeeds, setPracticalNeeds] = useState<string[]>([]);
  const [extraContext, setExtraContext] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");

  useEffect(() => {
    if (preselectedStudentId) {
      setSelectedTarget({
        targetType: "student",
        targetId: preselectedStudentId,
      });
    }
  }, [preselectedStudentId]);

  useEffect(() => {
    if (preselectedPreset) {
      setSelectedPreset(preselectedPreset);
    }
  }, [preselectedPreset]);

  const selectedStudent =
    selectedTarget.targetType === "student"
      ? (students.find((student) => student.id === selectedTarget.targetId) ??
        null)
      : null;

  const isSmithsonianPreset = selectedPreset === "smithsonian";
  const isFishingPreset = selectedPreset === "fish";
  const effectiveRadiusMiles = getRadiusMilesForTravelDistance(
    travelDistance,
    Number(radiusMiles) || initialRadiusMiles,
  );
  const canGenerate =
    !isWeatherResolving &&
    (selectedTarget.targetType === "household" ||
      selectedStudent !== null ||
      students.length === 0) &&
    (!isSmithsonianPreset || selectedMuseumKeys.length > 0);
  const hasLocalEvents = localEvents.length > 0;

  const toggleMuseum = (museumKey: SmithsonianMuseumKey) => {
    setSelectedMuseumKeys((current) =>
      current.includes(museumKey)
        ? current.filter((key) => key !== museumKey)
        : [...current, museumKey],
    );
  };

  const togglePracticalNeed = (value: string) => {
    setPracticalNeeds((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <section className="stack daily-adventure-flow">
      {viewState === "idle" ? (
        <article className="panel stack adventure-input-panel adventure-input-panel-full print-hide">
          <div className="planner-header field-section-header">
            <div className="field-section-heading">
              <span className="field-guide-icon-disc">
                <JournalIcon />
              </span>
              <div>
                <p className="eyebrow">Daily Adventure</p>
                <div className="wood-banner wood-banner-small">
                  Adventure Planner
                </div>
                <h3 className="planner-title">
                  Plan today&apos;s field-guide mission
                </h3>
                <p className="panel-copy">
                  Build one calm, practical outdoor homeschool mission with a
                  clear observation target, conversation prompt, and
                  family-friendly challenge.
                </p>
              </div>
            </div>
          </div>

          {students.length ? (
            <label>
              Student
              <select
                value={
                  selectedTarget.targetType === "household"
                    ? "household"
                    : selectedTarget.targetId
                }
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue === "household") {
                    setSelectedTarget({
                      targetType: "household",
                      targetId: userId,
                    });
                    return;
                  }

                  setSelectedTarget({
                    targetType: "student",
                    targetId: nextValue,
                  });
                }}
              >
                <option value="household">Household</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="panel-copy">
              Add a student profile to connect adventures to a specific child
              from the dashboard.
            </p>
          )}

          <div className="stack">
            <div>
              <p className="eyebrow" style={{ marginBottom: 6 }}>
                Planner mode
              </p>
              <p className="field-helper-text" style={{ marginTop: 0 }}>
                Standard is fast. Advanced asks follow-up questions like a local
                planning assistant.
              </p>
            </div>
            <div className="planner-mode-bar">
              <button
                className={`student-switcher-pill ${
                  plannerMode === "standard"
                    ? "student-switcher-pill-active"
                    : ""
                }`}
                type="button"
                onClick={() => setPlannerMode("standard")}
              >
                Standard Planner
              </button>
              <button
                className={`student-switcher-pill ${
                  plannerMode === "advanced"
                    ? "student-switcher-pill-active"
                    : ""
                }`}
                type="button"
                onClick={() => setPlannerMode("advanced")}
              >
                Advanced Adventure Planner
              </button>
            </div>
          </div>

          <label>
            Quick-start preset
            <select
              value={selectedPreset}
              onChange={(event) =>
                setSelectedPreset(
                  event.target.value as DailyAdventurePresetKey | "",
                )
              }
            >
              <option value="">Balanced daily adventure</option>
              {Object.values(dailyAdventurePresets).map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          {isSmithsonianPreset ? (
            <div className="stack">
              <div>
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  Choose museum(s)
                </p>
                <p className="field-helper-text" style={{ marginTop: 0 }}>
                  Pick one or more free Smithsonian stops for today&apos;s
                  family mission.
                </p>
              </div>

              <div className="museum-selector-grid">
                {smithsonianMuseums.map((museum) => {
                  const isSelected = selectedMuseumKeys.includes(museum.key);

                  return (
                    <button
                      key={museum.key}
                      type="button"
                      className={`museum-option-card ${
                        isSelected ? "museum-option-card-active" : ""
                      }`}
                      aria-pressed={isSelected}
                      onClick={() => toggleMuseum(museum.key)}
                    >
                      <span className="museum-option-badge">
                        {isSelected ? "Selected" : "Select"}
                      </span>
                      <strong>{museum.name}</strong>
                      <span>{museum.locationLabel}</span>
                      <span>{museum.highlights.slice(0, 2).join(" | ")}</span>
                    </button>
                  );
                })}
              </div>

              <p className="field-helper-text">
                Multi-stop museum days usually feel best with 1-2 museums.
              </p>
            </div>
          ) : null}

          {isFishingPreset ? (
            <label>
              Target fish
              <select
                value={targetFish}
                onChange={(event) => setTargetFish(event.target.value)}
              >
                <option value="">Let the planner choose</option>
                {FISH_DATA.map((fish) => (
                  <option key={fish.slug} value={fish.commonName}>
                    {fish.commonName}
                  </option>
                ))}
              </select>
              <p className="field-helper-text">
                Pick a fish if your family wants to focus on one species. Leave
                it on planner choice if you want the best local default.
              </p>
            </label>
          ) : null}

          <label>
            Local event
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
            >
              <option value="">No specific event</option>
              {localEvents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.eventTime ? ` | ${item.eventTime}` : ""}
                  {item.locationLabel ? ` | ${item.locationLabel}` : ""}
                </option>
              ))}
            </select>
            <p className="field-helper-text">
              {hasLocalEvents
                ? "Pick one of today's local events if you want the mission to build around it."
                : "No official local events are on today's calendar, so the planner will build a regular field mission."}
            </p>
          </label>

          {plannerMode === "advanced" ? (
            <section className="stack advanced-planner-chat">
              <article className="advanced-planner-bubble advanced-planner-bubble-assistant">
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  Advanced Adventure Planner
                </p>
                <p className="panel-copy" style={{ margin: 0 }}>
                  I&apos;ll narrow the day down like a local family planning
                  assistant instead of making you fill one giant form.
                </p>
              </article>

              <article className="advanced-planner-bubble advanced-planner-bubble-assistant">
                <strong>1. What kind of day do you want?</strong>
              </article>
              <div className="advanced-planner-chip-row">
                {advancedPlanStyleOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`student-switcher-pill ${
                      planStyle === option ? "student-switcher-pill-active" : ""
                    }`}
                    onClick={() => setPlanStyle(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {planStyle ? (
                <article className="advanced-planner-bubble advanced-planner-bubble-user">
                  {planStyle}
                </article>
              ) : null}

              {planStyle ? (
                <>
                  <article className="advanced-planner-bubble advanced-planner-bubble-assistant">
                    <strong>2. What is the main win today?</strong>
                  </article>
                  <div className="advanced-planner-chip-row">
                    {advancedMainGoalOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`student-switcher-pill ${
                          mainGoal === option
                            ? "student-switcher-pill-active"
                            : ""
                        }`}
                        onClick={() => setMainGoal(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {mainGoal ? (
                    <article className="advanced-planner-bubble advanced-planner-bubble-user">
                      {mainGoal}
                    </article>
                  ) : null}
                </>
              ) : null}

              {mainGoal ? (
                <>
                  <article className="advanced-planner-bubble advanced-planner-bubble-assistant">
                    <strong>3. What practical needs matter most?</strong>
                    <p className="field-helper-text" style={{ margin: "6px 0 0" }}>
                      Pick any that matter today.
                    </p>
                  </article>
                  <div className="advanced-planner-chip-row">
                    {advancedPracticalNeedOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`student-switcher-pill ${
                          practicalNeeds.includes(option)
                            ? "student-switcher-pill-active"
                            : ""
                        }`}
                        onClick={() => togglePracticalNeed(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {mainGoal ? (
                <label>
                  4. Anything else the planner should know?
                  <textarea
                    value={extraContext}
                    onChange={(event) => setExtraContext(event.target.value)}
                    rows={3}
                    placeholder="Example: one child gets tired fast, we want a strong history angle, or we need an easy lunch stop."
                  />
                </label>
              ) : null}
            </section>
          ) : null}

          <LocationContextFields
            locationLabel={locationLabel}
            radiusMiles={radiusMiles}
            hideRadius
            weatherCondition={weatherCondition}
            weatherHelperText={forecastHelperText}
            onLocationLabelChange={(value) => setLocationLabel(value)}
            onRadiusMilesChange={(value) => setRadiusMiles(value)}
            onWeatherConditionChange={(value) => setWeatherCondition(value)}
            onCoordinatesResolved={({
              latitude: nextLat,
              longitude: nextLng,
              locationLabel: nextLabel,
            }) => {
              setLatitude(nextLat);
              setLongitude(nextLng);
              setLocationLabel(nextLabel);
              setIsWeatherResolving(true);
              void (async () => {
                try {
                  const response = await fetch(
                    `/api/planner-weather?latitude=${nextLat}&longitude=${nextLng}`,
                  );
                  const payload = (await response.json()) as {
                    weatherCondition?: string;
                  };
                  if (response.ok && payload.weatherCondition) {
                    setWeatherCondition(payload.weatherCondition);
                    setForecastHelperText("Auto-filled from today's forecast");
                  }
                } finally {
                  setIsWeatherResolving(false);
                }
              })();
            }}
          />

          <div className="stack">
            <label>
              Time Available
              <select
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
              >
                <option value="30 min">30 min</option>
                <option value="1-2 hours">1-2 hours</option>
                <option value="half day">Half day</option>
                <option value="full day">Full day</option>
              </select>
            </label>

            <label>
              Budget
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="free">Free</option>
                <option value="low">$0-$20</option>
                <option value="medium">$20-$75</option>
                <option value="high">$75+</option>
              </select>
            </label>

            <label>
              Energy Level
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
              >
                <option value="low">Low (easy)</option>
                <option value="medium">Medium</option>
                <option value="high">High (adventure)</option>
              </select>
            </label>

            <label>
              Travel Distance
              <select
                value={travelDistance}
                onChange={(e) => setTravelDistance(e.target.value)}
              >
                <option value="backyard">Backyard</option>
                <option value="local">Local (10-15 min)</option>
                <option value="regional">30-60 min</option>
                <option value="far">Day trip</option>
              </select>
              <p className="field-helper-text">
                This already sets how wide the planner searches, so you do not
                need a second radius picker here.
              </p>
            </label>
          </div>

          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => {
              setError("");

              if (isSmithsonianPreset && selectedMuseumKeys.length === 0) {
                setError("Choose at least one Smithsonian museum first.");
                return;
              }

              setViewState("loading");

              void (async () => {
                const [response] = await Promise.all([
                  fetch("/api/generate-daily-adventure", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      requestDate: new Date().toISOString().slice(0, 10),
                      plannerMode,
                      targetType: selectedTarget.targetType,
                      targetId: selectedTarget.targetId,
                      householdMode: selectedTarget.targetType === "household",
                      studentId:
                        selectedTarget.targetType === "student"
                          ? selectedStudent?.id
                          : undefined,
                      studentName:
                        selectedTarget.targetType === "student"
                          ? selectedStudent?.name
                          : undefined,
                      studentAge:
                        selectedTarget.targetType === "student"
                          ? selectedStudent?.age
                          : undefined,
                      studentInterests:
                        selectedTarget.targetType === "student"
                          ? selectedStudent?.interests ?? []
                          : [],
                      studentReadingLevel:
                        selectedTarget.targetType === "student"
                          ? selectedStudent?.reading_level ?? undefined
                          : undefined,
                      householdStudents:
                        selectedTarget.targetType === "household"
                          ? students.map((student) => ({
                              id: student.id,
                              name: student.name,
                              age: student.age,
                              interests: student.interests ?? [],
                              readingLevel: student.reading_level ?? undefined,
                            }))
                          : [],
                      preset: selectedPreset || undefined,
                      museumKeys: isSmithsonianPreset
                        ? selectedMuseumKeys
                        : [],
                      locationLabel,
                      radiusMiles: effectiveRadiusMiles,
                      weatherCondition,
                      latitude,
                      longitude,
                      homeZipcode: homeZipcode ?? undefined,
                      selectedEventId: selectedEventId || undefined,
                      timeAvailable,
                      budget,
                      energyLevel,
                      travelDistance,
                      targetFish: isFishingPreset ? targetFish || undefined : undefined,
                      planStyle: plannerMode === "advanced" ? planStyle : undefined,
                      mainGoal: plannerMode === "advanced" ? mainGoal : undefined,
                      practicalNeeds:
                        plannerMode === "advanced" ? practicalNeeds : [],
                      extraContext:
                        plannerMode === "advanced" ? extraContext : undefined,
                    }),
                  }),
                  wait(700),
                ]);

                const payload = (await response.json()) as
                  | DailyAdventureResponse
                  | { error: string };

                if (!response.ok || "error" in payload) {
                  setError(
                    "error" in payload
                      ? payload.error
                      : "Daily adventure generation failed.",
                  );
                  setViewState("idle");
                  return;
                }

                setResult(payload.output);
                setLatestGenerationId(payload.generation.id);
                setViewState("result");
              })();
            }}
          >
            Plan Today&apos;s Mission
          </button>

          {error ? <p className="error">{error}</p> : null}
        </article>
      ) : null}

      {viewState === "loading" ? (
        <article className="panel stack adventure-transition-card adventure-stage-panel print-hide">
          <div className="adventure-awaits">
            <p className="eyebrow">Field Guide Loading</p>
            <h3>Adventure awaits</h3>
            <p className="panel-copy">
              Charting today&apos;s trail, weather, and mission details for your
              next outing.
            </p>
          </div>
        </article>
      ) : null}

      {viewState === "result" && result ? (
        <div className="stack adventure-stage-panel">
          <DailyAdventureResult
            result={result}
            generationId={latestGenerationId || undefined}
          />
          {latestGenerationId ? (
            <MarkCompleteCard
              studentId={
                selectedTarget.targetType === "student"
                  ? selectedTarget.targetId
                  : null
              }
              generationId={latestGenerationId}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
