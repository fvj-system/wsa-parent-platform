import Link from "next/link";
import type { TideSummary } from "@/lib/context/tides";
import type { WeatherContext } from "@/lib/context/weather/nws";
import type { FamilyOpportunity } from "@/lib/nearby/family-opportunities";

type DashboardDailyConditionsProps = {
  weather: WeatherContext | null;
  fallbackSummary: string;
  tide: TideSummary;
  todayEvents: FamilyOpportunity[];
  startAdventureHref?: string | null;
  startAdventureLabel?: string;
  householdName?: string | null;
};

function formatEventDateTime(item: FamilyOpportunity) {
  if (!item.eventDate) return item.eventTime;

  const date = new Date(`${item.eventDate}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);

  return item.eventTime ? `${dateLabel} - ${item.eventTime}` : dateLabel;
}

export function DashboardDailyConditions({
  weather,
  fallbackSummary,
  tide,
  todayEvents,
  startAdventureHref,
  startAdventureLabel = "Start today's adventure",
  householdName,
}: DashboardDailyConditionsProps) {
  const weatherLabel = weather?.shortForecast ?? "Mixed conditions";
  const high = weather?.temperature ?? "--";
  const low = weather?.lowTemperature ?? "--";
  const nextHigh = tide.highTides[0] ?? "--";
  const nextLow = tide.lowTides[0] ?? "--";
  const featuredEvents = todayEvents.slice(0, 2);
  const hasEventsToday = featuredEvents.length > 0;
  const normalizedHouseholdName = householdName?.trim();
  const greetingName = normalizedHouseholdName
    ? /family$/i.test(normalizedHouseholdName)
      ? normalizedHouseholdName
      : `${normalizedHouseholdName} Family`
    : "WSA Family";

  return (
    <section className="specimen-card daily-conditions-panel">
      <div className="daily-conditions-panel-head">
        <div>
          <h3>Today&apos;s field read</h3>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Welcome back {greetingName}!
          </p>
        </div>
      </div>

      <div className="daily-conditions-grid">
        <article className="daily-condition-item">
          <span className="eyebrow">Weather</span>
          <strong>{weatherLabel}</strong>
          <span className="muted">H {high} deg / L {low} deg</span>
        </article>

        <article className="daily-condition-item">
          <span className="eyebrow">Tides</span>
          <strong>{tide.hasTideData ? `High ${nextHigh}` : "No tide pressure"}</strong>
          <span className="muted">{tide.hasTideData ? `Low ${nextLow}` : tide.summary}</span>
          {startAdventureHref ? (
            <div className="daily-condition-action">
              <Link className="button button-primary" href={startAdventureHref}>
                {startAdventureLabel}
              </Link>
            </div>
          ) : null}
        </article>

        <article className="daily-condition-item daily-condition-item-wide">
          <span className="eyebrow">{hasEventsToday ? "Today Events" : "Field Read"}</span>
          {hasEventsToday ? (
            <>
              <strong className="daily-condition-field-read">
                {todayEvents.length === 1 ? "1 official event is on the calendar today." : `${todayEvents.length} official events are on the calendar today.`}
              </strong>
              <div className="daily-events-list">
                {featuredEvents.map((item) => (
                  <div className="daily-event-line" key={item.id}>
                    <span className="daily-event-title">{item.title}</span>
                    <span className="muted">
                      {[formatEventDateTime(item), item.locationLabel, item.sourceLabel].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <strong className="daily-condition-field-read">{fallbackSummary}</strong>
          )}
        </article>
      </div>
    </section>
  );
}
