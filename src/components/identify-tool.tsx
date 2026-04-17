"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CopyFacebookCaptionButton } from "@/components/copy-facebook-caption-button";
import { RegulationStatusCard } from "@/components/regulation-status-card";
import { SafetyStatusCard } from "@/components/safety-status-card";
import type { AchievementRecord, BadgeRecord } from "@/lib/badges";
import { getDiscoveryLocationMeta } from "@/lib/discover/location";
import {
  discoverCategoryOptions,
  type DiscoverCategory,
  type IdentifyResponse
} from "@/lib/identify";
import { harvestAllowedForStatus } from "@/lib/regulations/types";
import { deriveDiscoverySafetyStatus } from "@/lib/safety-status/derive";
import { prepareImageUpload } from "@/lib/image-upload";
import type { StudentRecord } from "@/lib/students";

type IdentifyToolProps = {
  students: StudentRecord[];
  preselectedStudentId?: string;
};

type IdentifyApiResponse = {
  result: IdentifyResponse;
  selectedCategory: DiscoverCategory;
};

type SaveApiResponse = {
  discovery: { id: string };
  entry: { id: string } | null;
  studentName: string | null;
  imageUrl: string;
  updatedStudent: StudentRecord | null;
  newBadges: BadgeRecord[];
  newAchievements: AchievementRecord[];
  rankJustReached: string | null;
};

export function IdentifyTool({ students, preselectedStudentId }: IdentifyToolProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId ?? "");
  const [selectedCategory, setSelectedCategory] = useState<DiscoverCategory>("animal");
  const [resultCategory, setResultCategory] = useState<DiscoverCategory>("animal");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "captured" | "unavailable">("idle");
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (preselectedStudentId) {
      setSelectedStudentId(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const activeCategory = discoverCategoryOptions.find((option) => option.value === selectedCategory) ?? discoverCategoryOptions[0];
  const activeResultCategory = discoverCategoryOptions.find((option) => option.value === resultCategory) ?? discoverCategoryOptions[0];
  const derivedSafetyStatus = result ? deriveDiscoverySafetyStatus(result) : null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!file || typeof coords.latitude === "number" || locationStatus === "locating" || locationStatus === "unavailable") {
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        const locationMeta = getDiscoveryLocationMeta(nextCoords);
        setCoords(nextCoords);
        setLocationLabel((current) => current.trim() || locationMeta.locationLabel);
        setLocationStatus("captured");
      },
      () => setLocationStatus("unavailable"),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 180000 }
    );
  }, [file, coords.latitude, locationStatus]);

  return (
    <section className="content-grid identify-layout">
      <article className="panel stack identify-input-panel print-hide">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Camera identify</p>
            <div className="wood-banner wood-banner-small">Field Observation Tool</div>
            <h3 className="planner-title">Discover what you found</h3>
            <p className="panel-copy">
              Upload a photo or take one on your phone, then get a careful field-guide-style identification with a Wild Stallion Academy challenge and journal prompt.
            </p>
          </div>
        </div>

        {students.length ? (
          <label>
            Save for
            <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
              <option value="">Household only</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No student linked yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                You can still identify the photo now, and later connect observations to a student&apos;s field journal once a profile is added.
              </p>
            </div>
          </div>
        )}

        <div className="stack">
          <div className="field-section-heading">
            <div>
              <p className="eyebrow">Discovery mode</p>
              <h4>What are you trying to identify?</h4>
            </div>
          </div>
          <div className="discovery-category-grid">
            {discoverCategoryOptions.map((option) => {
              const isActive = option.value === selectedCategory;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`discovery-category-card ${isActive ? "discovery-category-card-active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(option.value);
                    setResult(null);
                    setSaveMessage("");
                    setError("");
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.shortDescription}</span>
                </button>
              );
            })}
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            {activeCategory.shortDescription}
          </p>
        </div>

        <label>
          Photo
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setResult(null);
              setSaveMessage("");
              setError("");

              if (!nextFile) {
                setFile(null);
                return;
              }

              const prepared = await prepareImageUpload(nextFile);
              if (!prepared.file) {
                setFile(null);
                setError(prepared.message || "Could not use that image.");
                event.currentTarget.value = "";
                return;
              }

              setFile(prepared.file);
              if (prepared.message) {
                setError(prepared.message);
              }
            }}
          />
        </label>
        <p className="muted" style={{ margin: "-6px 0 0" }}>
          Choose from your photo library here. For live camera capture, use your phone camera first or the quick camera flow.
        </p>

        <label>
          Notes for the naturalist
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes like where you found it, what color stood out, or what you noticed first."
          />
        </label>

        <label>
          Location label
          <input
            value={locationLabel}
            onChange={(event) => setLocationLabel(event.target.value)}
            placeholder="Backyard pond, park trail, creek edge, or local spot"
          />
        </label>

        <div className="cta-row">
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              if (!navigator.geolocation) {
                setError("This device does not support location.");
                return;
              }

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const nextCoords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  };
                  const locationMeta = getDiscoveryLocationMeta(nextCoords);
                  setCoords(nextCoords);
                  setLocationLabel((current) => current.trim() || locationMeta.locationLabel);
                  setLocationStatus("captured");
                },
                () => setError("Could not get current location.")
              );
            }}
          >
            Use current location
          </button>
          {coords.latitude && coords.longitude ? <span className="muted">Location added</span> : null}
          {locationStatus === "captured" ? <span className="muted">Tagged automatically</span> : null}
        </div>

        <button
          type="button"
          className="button button-primary button-strong"
          disabled={isPending || !file}
          onClick={() => {
            if (!file) {
              setError("Choose a photo first.");
              return;
            }

            setError("");
            setSaveMessage("");

            startTransition(async () => {
              const formData = new FormData();
              formData.append("image", file);
              formData.append("category", selectedCategory);
              if (typeof coords.latitude === "number") formData.append("latitude", String(coords.latitude));
              if (typeof coords.longitude === "number") formData.append("longitude", String(coords.longitude));
              if (locationLabel.trim()) formData.append("locationLabel", locationLabel.trim());
              if (selectedStudent?.name) formData.append("studentName", selectedStudent.name);
              if (notes.trim()) formData.append("notes", notes.trim());

              const response = await fetch("/api/identify", {
                method: "POST",
                body: formData
              });

              const payload = (await response.json()) as IdentifyApiResponse | { error: string };
              if (!response.ok || "error" in payload) {
                setError("error" in payload ? payload.error : "Could not identify this image.");
                return;
              }

              setResult(payload.result);
              setResultCategory(payload.selectedCategory);
            });
          }}
        >
          {isPending ? "Identifying..." : "Identify this discovery"}
        </button>

        {error ? <p className="error">{error}</p> : null}
      </article>

      <article className="panel stack daily-adventure-sheet print-sheet">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Photo preview</p>
            <h3>Observation sheet</h3>
          </div>
        </div>

        {previewUrl ? (
          <div className="identify-preview-frame">
            <img src={previewUrl} alt="Selected observation preview" className="identify-preview-image" />
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No image selected yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Choose a photo from your library here, or use the quick camera tool when you want to snap one live.
              </p>
            </div>
          </div>
        )}

        {result ? (
          <div className="stack">
            <div className="identify-result-header">
              <div>
                <div className="field-guide-meta-row">
                  <span className="pill">{activeResultCategory.label}</span>
                  <span className="pill">Possible identification</span>
                </div>
                <h2>{result.possible_identification}</h2>
                <p className="panel-copy" style={{ margin: 0 }}>
                  {result.category} | Confidence: {result.confidence_level}
                </p>
                {result.scientific_name ? (
                  <p className="muted" style={{ margin: "6px 0 0" }}>
                    {result.scientific_name}
                  </p>
                ) : null}
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  Observed near: {result.observed_near}
                </p>
              </div>
            </div>

            <div className="result-sections">
              <section className="mission-panel">
                <h4>Region check</h4>
                <p>{result.regional_plausibility_note}</p>
                {result.range_summary ? (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {result.range_summary}
                  </p>
                ) : null}
                {result.local_look_alikes.length ? (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    More common local look-alikes: {result.local_look_alikes.join(", ")}.
                  </p>
                ) : null}
              </section>
              {result.taxonomy_hierarchy ? (
                <section className="mission-panel">
                  <h4>Field guide classification</h4>
                  <p>
                    {[result.taxonomy_hierarchy.kingdom, result.taxonomy_hierarchy.className, result.taxonomy_hierarchy.order, result.taxonomy_hierarchy.family]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                </section>
              ) : null}
              {derivedSafetyStatus ? (
                <SafetyStatusCard
                  edibilityStatus={derivedSafetyStatus.edibility_status}
                  legalStatus={derivedSafetyStatus.legal_status}
                  cautionNote={derivedSafetyStatus.caution_note}
                  regulationNote={derivedSafetyStatus.regulation_note}
                  safetyNote={derivedSafetyStatus.safety_note}
                  sourceNote={derivedSafetyStatus.source_note}
                  statusConfidence={derivedSafetyStatus.status_confidence}
                  compact
                  emphasizeMushroom={resultCategory === "mushroom"}
                />
              ) : null}
              {result.category.toLowerCase().includes("fish") ? (
                <>
                  {result.regulation_status ? (
                    <RegulationStatusCard
                      status={result.regulation_status}
                      seasonNote={result.season_note}
                      bagLimitNote={result.bag_limit_note}
                      sizeLimitNote={result.size_limit_note}
                      protectedNote={result.protected_note}
                      gearRuleNote={result.gear_rule_note}
                      source={result.regulation_source}
                      sourceUrl={result.regulation_source_url}
                      lastChecked={result.regulation_last_checked}
                      compact
                    />
                  ) : null}
                  <section className="mission-panel">
                    <h4>Angler notes</h4>
                    {result.water_type ? <p>Water type: {result.water_type}</p> : null}
                    {result.best_bait ? <p>Best bait: {result.best_bait}</p> : null}
                    {result.best_lures?.length ? <p>Best lures: {result.best_lures.join(", ")}</p> : null}
                    {result.wsa_angler_tip ? <p>WSA angler tip: {result.wsa_angler_tip}</p> : null}
                    {result.regulation_status && !harvestAllowedForStatus(result.regulation_status) ? (
                      <p>Identification and learning first. Check Maryland rules before relying on cooking guidance.</p>
                    ) : (
                      <>
                        {result.flavor_profile ? <p>Flavor profile: {result.flavor_profile}</p> : null}
                        {result.best_cooking_methods?.length ? <p>Best cooking methods: {result.best_cooking_methods.join(", ")}</p> : null}
                        {result.preparation_tips ? <p>Preparation tips: {result.preparation_tips}</p> : null}
                      </>
                    )}
                  </section>
                </>
              ) : null}
              <section className="mission-panel">
                <h4>Key features observed</h4>
                <ul className="result-list result-list-tight">
                  {result.key_features.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="mission-panel">
                <h4>Look-alikes</h4>
                {result.look_alikes.length ? (
                  <ul className="result-list result-list-tight">
                    {result.look_alikes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No major look-alikes were highlighted for this photo.</p>
                )}
              </section>
              <section className="mission-panel">
                <h4>Safety note</h4>
                <p>{result.safety_note}</p>
              </section>
              <section className="mission-panel">
                <h4>WSA observation challenge</h4>
                <p>{result.wsa_observation_challenge}</p>
              </section>
              <section className="mission-panel">
                <h4>Journal prompt</h4>
                <p>{result.journal_prompt}</p>
              </section>
              <section className="mission-panel print-hide">
                <h4>Facebook caption</h4>
                <p>{result.facebook_caption}</p>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <CopyFacebookCaptionButton caption={result.facebook_caption} />
                </div>
              </section>
            </div>

            <div className="cta-row print-hide">
              <button
                type="button"
                className="button button-primary"
                disabled={isSaving}
                onClick={() => {
                  startSaving(async () => {
                    setError("");
                    setSaveMessage("");

                    if (!file) {
                      setError("Choose a photo before saving this discovery.");
                      return;
                    }

                    const formData = new FormData();
                    formData.append(
                      "payload",
                      JSON.stringify({
                        studentId: selectedStudent?.id || undefined,
                        selectedCategory: resultCategory,
                        result,
                        notes: notes.trim() || undefined,
                        locationLabel: locationLabel.trim() || undefined,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        observedAt: new Date().toISOString()
                      })
                    );
                    formData.append("image", file);

                    const response = await fetch("/api/identify/save", {
                      method: "POST",
                      body: formData
                    });

                    const payload = (await response.json()) as SaveApiResponse | { error: string };
                    if (!response.ok || "error" in payload) {
                      setError("error" in payload ? payload.error : "Could not save this observation.");
                      return;
                    }

                    const unlocks = [
                      ...payload.newBadges.map((badge) => badge.name),
                      ...payload.newAchievements.map((achievement) => achievement.name)
                    ];
                    const unlockMessage = unlocks.length ? ` New unlocks: ${unlocks.join(", ")}.` : "";
                    const rankMessage =
                      payload.rankJustReached && payload.studentName ? ` ${payload.studentName} reached ${payload.rankJustReached} rank.` : "";

                    setSaveMessage(
                      payload.studentName
                        ? `Saved to the family catalog and ${payload.studentName}'s field journal.${rankMessage}${unlockMessage}`
                        : "Saved to the family nature catalog."
                    );
                  });
                }}
              >
                {isSaving ? "Saving..." : "Save Discovery"}
              </button>
              <a className="button button-ghost" href="/discover/catalog">
                Open Catalog
              </a>
            </div>

            {saveMessage ? <p className="success print-hide">{saveMessage}</p> : null}
          </div>
        ) : null}
      </article>
    </section>
  );
}
