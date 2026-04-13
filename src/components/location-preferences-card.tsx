"use client";

import { useRef, useState } from "react";
import type { LocationMode, LocationPreferences, ResolvedUserLocationPreference } from "@/lib/location-preferences";

type LocationPreferencesCardProps = {
  initialPreferences: LocationPreferences;
  resolvedLocation: ResolvedUserLocationPreference;
};

const radiusOptions = [10, 25, 50] as const;

export function LocationPreferencesCard({ initialPreferences, resolvedLocation }: LocationPreferencesCardProps) {
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>(initialPreferences.locationMode);
  const [homeZipcode, setHomeZipcode] = useState(initialPreferences.homeZipcode ?? "");
  const [searchRadiusMiles, setSearchRadiusMiles] = useState<(typeof radiusOptions)[number]>(initialPreferences.searchRadiusMiles);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function normalizeZipcodeCandidate(value: string) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 5 ? digits.slice(0, 5) : digits;
  }

  async function saveZipcodePreferences() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const zipcodeCandidate = zipInputRef.current?.value ?? homeZipcode;
      const normalizedZipcode = normalizeZipcodeCandidate(zipcodeCandidate);

      const response = await fetch("/api/location-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          locationMode: "zipcode",
          homeZipcode: normalizedZipcode,
          searchRadiusMiles
        })
      });

      const payload = (await response.json()) as { error?: string; preferences?: LocationPreferences };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save ZIP code.");
      }

      setMessage("Saved ZIP-based location preferences.");
      window.location.reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save ZIP code.");
    } finally {
      setIsSaving(false);
    }
  }

  function saveCurrentLocation() {
    if (!navigator.geolocation) {
      setError("This device does not support current location.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch("/api/location-preferences", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              locationMode: "current",
              currentLat: position.coords.latitude,
              currentLng: position.coords.longitude,
              searchRadiusMiles
            })
          });

          const payload = (await response.json()) as { error?: string; preferences?: LocationPreferences };
          if (!response.ok) {
            throw new Error(payload.error || "Unable to save current location.");
          }

          setMessage("Saved current-location preferences.");
          window.location.reload();
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Unable to save current location.");
          setIsSaving(false);
        }
      },
      (geoError) => {
        setError(geoError.message || "Location permission was not granted.");
        setIsSaving(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  }

  return (
    <section className="panel stack location-preferences-card">
      <div className="header-row">
        <div>
          <p className="eyebrow">Location Preferences</p>
          <h3>Choose the place we should plan around</h3>
        </div>
        <p className="location-preferences-status">{resolvedLocation.statusLabel}</p>
      </div>

      <div className="location-mode-row" role="radiogroup" aria-label="Location mode">
        <button
          type="button"
          className={`button ${locationMode === "zipcode" ? "button-primary" : "button-ghost"} location-mode-button`}
          onClick={() => setLocationMode("zipcode")}
          aria-pressed={locationMode === "zipcode"}
        >
          Use saved ZIP code
        </button>
        <button
          type="button"
          className={`button ${locationMode === "current" ? "button-primary" : "button-ghost"} location-mode-button`}
          onClick={() => setLocationMode("current")}
          aria-pressed={locationMode === "current"}
        >
          Use current location
        </button>
      </div>

      {locationMode === "zipcode" ? (
        <div className="split-grid location-preferences-grid">
          <label>
            ZIP code
            <input
              ref={zipInputRef}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
              value={homeZipcode}
              onChange={(event) => setHomeZipcode(event.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
              placeholder="20653 or 20653-1234"
            />
          </label>

          <label>
            Search radius
            <select value={searchRadiusMiles} onChange={(event) => setSearchRadiusMiles(Number(event.target.value) as 10 | 25 | 50)}>
              {radiusOptions.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} miles
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="split-grid location-preferences-grid">
          <label>
            Search radius
            <select value={searchRadiusMiles} onChange={(event) => setSearchRadiusMiles(Number(event.target.value) as 10 | 25 | 50)}>
              {radiusOptions.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} miles
                </option>
              ))}
            </select>
          </label>

          <div className="stack">
            <span className="location-preferences-helper">Grant browser location permission to use your current coordinates for nearby searches.</span>
            <button type="button" className="button button-primary" onClick={saveCurrentLocation} disabled={isSaving}>
              {isSaving ? "Saving..." : "Use My Location"}
            </button>
          </div>
        </div>
      )}

      {locationMode === "zipcode" ? (
        <div className="cta-row">
          <button type="button" className="button button-primary" onClick={saveZipcodePreferences} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save location"}
          </button>
        </div>
      ) : null}

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {resolvedLocation.needsSetup ? (
        <p className="muted" style={{ margin: 0 }}>
          Nearby results use Southern Maryland by default until you save a ZIP code or current location.
        </p>
      ) : null}
    </section>
  );
}
