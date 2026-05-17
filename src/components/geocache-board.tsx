"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  geocacheStateOptions,
  geocacheTypeOptions,
  getGeocacheTypeLabel,
  type GeocacheRecord,
  type NearbyGeocacheRecord,
} from "@/lib/geocaches";

type GeocacheBoardProps = {
  countyLabel?: string | null;
  defaultCountyName?: string;
  defaultStateCode?: string;
  nearbyCaches: NearbyGeocacheRecord[];
  regionalCaches: GeocacheRecord[];
  ownCaches: GeocacheRecord[];
  locationStatusLabel: string;
};

export function GeocacheBoard({
  countyLabel,
  defaultCountyName = "",
  defaultStateCode = "MD",
  nearbyCaches,
  regionalCaches,
  ownCaches,
  locationStatusLabel,
}: GeocacheBoardProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [countyName, setCountyName] = useState(defaultCountyName);
  const [stateCode, setStateCode] = useState(defaultStateCode);

  function updateCacheStatus(id: string, status: "active" | "found" | "archived") {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const response = await fetch(`/api/geocaches/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error || "Could not update the trail cache.");
        return;
      }

      setSuccess(
        status === "found"
          ? "Trail cache marked as found."
          : status === "archived"
            ? "Trail cache archived."
            : "Trail cache reopened.",
      );
      router.refresh();
    });
  }

  return (
    <section className="stack">
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Hide a trail cache</p>
            <h3>Leave a clue, note, or treasure for another family.</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Keep it simple: choose the county, name the area, drop a clue, and
              make it feel like a tiny adventure.
            </p>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {countyLabel || locationStatusLabel}
          </p>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setSuccess("");
            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const response = await fetch("/api/geocaches", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  title: String(formData.get("title") || ""),
                  cacheType: String(formData.get("cacheType") || "message"),
                  stateCode: String(formData.get("stateCode") || defaultStateCode),
                  countyName: String(formData.get("countyName") || ""),
                  locationHint: String(formData.get("locationHint") || ""),
                  clue: String(formData.get("clue") || ""),
                  treasureNote: String(formData.get("treasureNote") || ""),
                  familyFriendly: formData.get("familyFriendly") === "on",
                }),
              });

              const payload = (await response.json().catch(() => ({}))) as {
                error?: string;
              };

              if (!response.ok) {
                setError(payload.error || "Could not hide this trail cache yet.");
                return;
              }

              setSuccess("Trail cache saved. Nearby families can now see the clue.");
              event.currentTarget.reset();
              setCountyName(defaultCountyName);
              setStateCode(defaultStateCode);
              router.refresh();
            });
          }}
        >
          <div className="split-grid">
            <label>
              Cache title
              <input
                name="title"
                maxLength={120}
                placeholder="Creekside message jar"
                required
              />
            </label>

            <label>
              Cache type
              <select name="cacheType" defaultValue="message">
                {geocacheTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="split-grid">
            <label>
              State
              <select
                name="stateCode"
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
              >
                {geocacheStateOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              County
              <input
                name="countyName"
                value={countyName}
                onChange={(event) => setCountyName(event.target.value)}
                maxLength={80}
                placeholder="St. Mary's"
                required
              />
            </label>
          </div>

          <label>
            Area hint
            <input
              name="locationHint"
              maxLength={160}
              placeholder="Near the walking trail by the old oak tree"
              required
            />
          </label>

          <label>
            Main clue
            <textarea
              name="clue"
              rows={4}
              maxLength={800}
              placeholder="Start at the trailhead sign, count twenty paces toward the creek, then look under the flat stone beside the fence post."
              required
            />
          </label>

          <label>
            What is hidden there?
            <textarea
              name="treasureNote"
              rows={3}
              maxLength={500}
              placeholder="Tiny message scroll, painted rock, brass token, or a nature note."
            />
          </label>

          <label className="classes-waiver-toggle">
            <input name="familyFriendly" type="checkbox" defaultChecked />
            <span>Keep this family-friendly and easy enough for kids to enjoy.</span>
          </label>

          <div className="cta-row">
            <button type="submit" className="button button-primary" disabled={isPending}>
              {isPending ? "Saving..." : "Hide trail cache"}
            </button>
          </div>

          {success ? <p className="success">{success}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </form>
      </section>

      <section className="content-grid">
        <article className="panel stack">
          <div>
            <p className="eyebrow">Nearby counties</p>
            <h3>
              {nearbyCaches.length
                ? countyLabel
                  ? `Caches around ${countyLabel}`
                  : "Caches near your saved location"
                : "No nearby trail caches yet"}
            </h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              {nearbyCaches.length
                ? "These are the closest active clues for your family right now."
                : "Hide the first one in your county or set your ZIP code so nearby cache alerts can light up your dashboard."}
            </p>
          </div>

          <div className="dashboard-opportunity-list">
            {nearbyCaches.map((item) => (
              <article className="dashboard-opportunity-row" key={item.id}>
                <div className="dashboard-opportunity-row-top">
                  <div className="field-guide-meta-row">
                    <span className="badge">
                      {item.is_same_county ? "Your county" : `${item.county_name} County`}
                    </span>
                    <span className="muted">
                      {item.distance_miles !== null ? `${item.distance_miles} mi` : item.state_code}
                    </span>
                  </div>
                </div>
                <h4 className="dashboard-opportunity-title">{item.title}</h4>
                <p className="dashboard-opportunity-description">
                  {getGeocacheTypeLabel(item.cache_type)} · {item.location_hint}
                </p>
                <p className="panel-copy geocache-clue-copy">{item.clue}</p>
                {item.treasure_note ? (
                  <p className="muted" style={{ margin: 0 }}>
                    Hidden there: {item.treasure_note}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <article className="panel stack">
          <div>
            <p className="eyebrow">Your household caches</p>
            <h3>{ownCaches.length ? "Manage your active clues" : "Your household has not hidden one yet"}</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Mark caches found, reopen them, or archive them once the trail run is over.
            </p>
          </div>

          <div className="dashboard-opportunity-list">
            {ownCaches.map((item) => (
              <article className="dashboard-opportunity-row" key={item.id}>
                <div className="dashboard-opportunity-row-top">
                  <div className="field-guide-meta-row">
                    <span className="badge">{item.status}</span>
                    <span className="muted">
                      {item.county_name} County, {item.state_code}
                    </span>
                  </div>
                </div>
                <h4 className="dashboard-opportunity-title">{item.title}</h4>
                <p className="dashboard-opportunity-description">
                  {getGeocacheTypeLabel(item.cache_type)} · {item.location_hint}
                </p>
                <div className="cta-row">
                  {item.status !== "found" ? (
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={isPending}
                      onClick={() => updateCacheStatus(item.id, "found")}
                    >
                      Mark found
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={isPending}
                      onClick={() => updateCacheStatus(item.id, "active")}
                    >
                      Reopen
                    </button>
                  )}
                  {item.status !== "archived" ? (
                    <button
                      type="button"
                      className="button button-ghost"
                      disabled={isPending}
                      onClick={() => updateCacheStatus(item.id, "archived")}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Regional feed</p>
          <h3>Active trail caches across Maryland, Virginia, West Virginia, Delaware, and Pennsylvania</h3>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            This keeps the feature adventurous even when your own county feed is still quiet.
          </p>
        </div>

        <div className="dashboard-opportunity-list">
          {regionalCaches.map((item) => (
            <article className="dashboard-opportunity-row" key={item.id}>
              <div className="dashboard-opportunity-row-top">
                <div className="field-guide-meta-row">
                  <span className="badge">
                    {item.county_name} County, {item.state_code}
                  </span>
                  <span className="muted">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <h4 className="dashboard-opportunity-title">{item.title}</h4>
              <p className="dashboard-opportunity-description">
                {getGeocacheTypeLabel(item.cache_type)} · {item.location_hint}
              </p>
              <p className="panel-copy geocache-clue-copy">{item.clue}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
