"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CopyFacebookCaptionButton } from "@/components/copy-facebook-caption-button";
import { RegulationStatusCard } from "@/components/regulation-status-card";
import { SafetyStatusCard } from "@/components/safety-status-card";
import { getDiscoveryLocationMeta } from "@/lib/discover/location";
import type { DiscoverCategory, IdentifyResponse } from "@/lib/identify";
import { discoverCategoryOptions } from "@/lib/identify";
import { harvestAllowedForStatus } from "@/lib/regulations/types";
import { deriveDiscoverySafetyStatus } from "@/lib/safety-status/derive";
import { prepareImageUpload } from "@/lib/image-upload";
import { createClient } from "@/lib/supabase/client";

type QuickDiscoverCameraProps = {
  isOpen: boolean;
  onClose: () => void;
};

type IdentifyApiResponse = {
  result: IdentifyResponse;
  selectedCategory: DiscoverCategory;
};

type SaveApiResponse = {
  discovery: { id: string };
  studentName: string | null;
};

type StudentOption = {
  id: string;
  name: string;
};

export function QuickDiscoverCamera({ isOpen, onClose }: QuickDiscoverCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [actionError, setActionError] = useState("");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [notes, setNotes] = useState("");
  const [showNotesField, setShowNotesField] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "captured" | "unavailable">("idle");
  const [category, setCategory] = useState<DiscoverCategory>("animal");
  const [capturedCategory, setCapturedCategory] = useState<DiscoverCategory>("animal");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isIdentifying, startIdentifying] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const previewUrl = useMemo(() => (capturedFile ? URL.createObjectURL(capturedFile) : ""), [capturedFile]);
  const derivedSafetyStatus = result ? deriveDiscoverySafetyStatus(result) : null;

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function resetCaptureState() {
    setCapturedFile(null);
    setResult(null);
    setSaveMessage("");
    setActionError("");
    setCameraError("");
    setNotes("");
    setShowNotesField(false);
    setLocationLabel("");
    setCoords({});
    setLocationStatus("idle");
    setCapturedCategory(category);
  }

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetCaptureState();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    async function loadStudents() {
      const supabase = createClient();
      const { data } = await supabase.from("students").select("id, name").order("name");
      if (ignore) return;

      const nextStudents = (data ?? []) as StudentOption[];
      setStudents(nextStudents);
      if (nextStudents.length === 1) {
        setSelectedStudentId(nextStudents[0].id);
      }
    }

    void loadStudents();

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || capturedFile) return;

    let cancelled = false;

    async function startCamera() {
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This device does not support direct camera capture. You can still upload a photo.");
        return;
      }

      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode }
          },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError("Camera access is needed for quick field capture. Allow access and try again.");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, capturedFile, facingMode, cameraRetryKey]);

  useEffect(() => {
    if (!capturedFile) return;

    setActionError("");
    setResult(null);

    startIdentifying(async () => {
      const formData = new FormData();
      formData.append("image", capturedFile);
      formData.append("category", capturedCategory);
      if (typeof coords.latitude === "number") {
        formData.append("latitude", String(coords.latitude));
      }
      if (typeof coords.longitude === "number") {
        formData.append("longitude", String(coords.longitude));
      }
      if (locationLabel.trim()) {
        formData.append("locationLabel", locationLabel.trim());
      }

      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as IdentifyApiResponse | { error: string };
      if (!response.ok || "error" in payload) {
        setResult(null);
        setActionError("Identification did not finish, but you can still save this as an unknown discovery.");
        return;
      }

      setResult(payload.result);
    });
  }, [capturedFile, capturedCategory, coords.latitude, coords.longitude, locationLabel]);

  useEffect(() => {
    if (!capturedFile || typeof coords.latitude === "number" || locationStatus === "unavailable" || locationStatus === "locating") {
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
  }, [capturedFile, coords.latitude, locationStatus]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="camera-modal" role="dialog" aria-modal="true" aria-label="Quick Discover camera">
      <div className="camera-scrim" onClick={onClose} />
      <section className="camera-sheet">
        {!capturedFile ? (
          <div className="camera-stage">
            <header className="camera-topbar">
              <div>
                <p className="eyebrow">Quick field capture</p>
                <h2>Discover now</h2>
              </div>
              <button type="button" className="camera-close" onClick={onClose}>
                Close
              </button>
            </header>

            <div className="camera-preview-shell">
              <video ref={videoRef} className="camera-preview" playsInline muted />
            </div>

            <div className="camera-category-row" aria-label="Discovery category">
              {discoverCategoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`camera-category-pill ${category === option.value ? "camera-category-pill-active" : ""}`}
                  onClick={() => setCategory(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="camera-toolbar">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setFacingMode((current) => (current === "environment" ? "user" : "environment"))}
              >
                Flip
              </button>
              <button
                type="button"
                className="camera-capture"
                aria-label="Capture photo"
                onClick={async () => {
                  if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
                    setCameraError("The camera is still warming up. Try again in a moment.");
                    return;
                  }

                  const canvas = document.createElement("canvas");
                  canvas.width = videoRef.current.videoWidth;
                  canvas.height = videoRef.current.videoHeight;
                  const context = canvas.getContext("2d");
                  if (!context) {
                    setCameraError("Could not capture this image.");
                    return;
                  }

                  context.drawImage(videoRef.current, 0, 0);
                  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
                  if (!blob) {
                    setCameraError("Could not capture this image.");
                    return;
                  }

                  stopCamera();
                  setCapturedCategory(category);
                  setCapturedFile(new File([blob], `discover-${Date.now()}.jpg`, { type: "image/jpeg" }));
                  setResult(null);
                  setSaveMessage("");
                  setActionError("");
                }}
              />
              <button
                type="button"
                className="button button-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="print-hide"
              onChange={async (event) => {
                const nextFile = event.target.files?.[0] ?? null;
                if (!nextFile) return;
                const prepared = await prepareImageUpload(nextFile);
                if (!prepared.file) {
                  setActionError(prepared.message || "Could not use that image.");
                  event.currentTarget.value = "";
                  return;
                }
                stopCamera();
                setCapturedCategory(category);
                setCapturedFile(prepared.file);
                setResult(null);
                setSaveMessage("");
                setActionError(prepared.message || "");
              }}
            />

            {cameraError ? (
              <div className="camera-message">
                <p>{cameraError}</p>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setCameraRetryKey((current) => current + 1)}
                >
                  Retry camera
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="camera-result">
            <header className="camera-result-header">
              <button type="button" className="camera-close" onClick={onClose}>
                Close
              </button>
              <div className="cta-row">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => {
                    resetCaptureState();
                    setCameraRetryKey((current) => current + 1);
                  }}
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setShowNotesField((current) => !current)}
                >
                  {showNotesField ? "Hide Notes" : "Add Notes"}
                </button>
              </div>
            </header>

            <div className="camera-result-layout">
              <img src={previewUrl} alt="Captured discovery" className="camera-result-image" />

              <div className="camera-result-copy">
                <div className="field-guide-meta-row">
                  <span className="pill">Quick discovery</span>
                  <span className="pill">{discoverCategoryOptions.find((option) => option.value === category)?.label ?? "Animal"}</span>
                </div>

                <h3>{result?.possible_identification ?? "Unknown discovery"}</h3>
                <p className="panel-copy" style={{ margin: 0 }}>
                  {isIdentifying
                    ? "Reviewing the photo now..."
                    : `${result?.category ?? "Unknown category"} | Confidence: ${result?.confidence_level ?? "low"}`}
                </p>
                {result?.scientific_name ? (
                  <p className="muted" style={{ margin: 0 }}>
                    {result.scientific_name}
                  </p>
                ) : null}
                {result?.key_features?.length ? (
                  <p className="camera-summary-copy">{result.key_features.slice(0, 2).join(" ")}.</p>
                ) : null}
                <div className="camera-location-summary">
                  <span className="pill">{result?.observed_near ?? (locationLabel || "Location not tagged")}</span>
                  {locationStatus === "captured" ? <span className="muted">Location tagged automatically</span> : null}
                </div>
                {result ? (
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
                ) : null}

                {result?.taxonomy_hierarchy ? (
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
                    emphasizeMushroom={capturedCategory === "mushroom"}
                  />
                ) : null}

                {result?.category.toLowerCase().includes("fish") ? (
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

                {students.length ? (
                  <label>
                    Link to student
                    <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                      <option value="">Family catalog only</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {showNotesField ? (
                  <label>
                    Field notes
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Where you saw it, what it was doing, or what stood out first."
                    />
                  </label>
                ) : null}

                <label>
                  Location label
                  <input
                    value={locationLabel}
                    onChange={(event) => setLocationLabel(event.target.value)}
                    placeholder="Backyard, pond edge, marsh trail"
                  />
                </label>

                <div className="cta-row">
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        setActionError("This device does not support location.");
                        return;
                      }

                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const nextCoords = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                          };
                          const locationMeta = getDiscoveryLocationMeta(nextCoords);
                          setCoords({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                          });
                          setLocationLabel((current) => current.trim() || locationMeta.locationLabel);
                          setLocationStatus("captured");
                          setActionError("");
                        },
                        () => setActionError("Could not get current location.")
                      );
                    }}
                  >
                    Use current location
                  </button>
                  {coords.latitude ? <span className="muted">Location added</span> : null}
                </div>

                <div className="cta-row">
                  <button
                    type="button"
                    className="button button-primary button-strong"
                    disabled={isSaving}
                    onClick={() => {
                      if (!capturedFile) return;

                      startSaving(async () => {
                        setActionError("");
                        setSaveMessage("");

                        const formData = new FormData();
                        formData.append(
                          "payload",
                          JSON.stringify({
                            studentId: selectedStudentId || undefined,
                            selectedCategory: category,
                            result: result ?? undefined,
                            notes: notes.trim() || undefined,
                            locationLabel: locationLabel.trim() || undefined,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            observedAt: new Date().toISOString()
                          })
                        );
                        formData.append("image", capturedFile);

                        const response = await fetch("/api/identify/save", {
                          method: "POST",
                          body: formData
                        });

                        const payload = (await response.json()) as SaveApiResponse | { error: string };
                        if (!response.ok || "error" in payload) {
                          setActionError("error" in payload ? payload.error : "Could not save this discovery.");
                          return;
                        }

                        setSaveMessage(
                          payload.studentName
                            ? `Saved to the family catalog and ${payload.studentName}'s journal.`
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

                {result?.facebook_caption ? (
                  <div className="camera-caption-block">
                    <CopyFacebookCaptionButton caption={result.facebook_caption} />
                  </div>
                ) : null}

                {saveMessage ? <p className="success">{saveMessage}</p> : null}
                {actionError ? <p className="error">{actionError}</p> : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
