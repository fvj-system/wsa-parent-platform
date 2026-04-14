import type { FamilyOpportunity } from "@/lib/nearby/family-opportunities";

type DashboardFamilyOpportunitiesProps = {
  items: FamilyOpportunity[];
  showHeader?: boolean;
};

const typeLabels: Record<FamilyOpportunity["type"], string> = {
  event: "Event",
  museum: "Museum",
  history_site: "Historic Site",
  nature_center: "Nature Center",
  park: "Nature Spot",
  kids_programs: "Kids Programs",
  festival_calendar: "Festivals & Events",
  lecture_calendar: "Lectures & Talks"
};

function formatEventDate(dateValue: string | null, timeValue: string | null) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(`${dateValue}T12:00:00`);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);

  return timeValue ? `${formattedDate} - ${timeValue}` : formattedDate;
}

function OpportunityRow({ item }: { item: FamilyOpportunity }) {
  const eventMeta = formatEventDate(item.eventDate, item.eventTime);
  const badgeLabel =
    item.kind === "event" && item.isThisWeek
      ? "This Week Event"
      : item.kind === "event"
        ? "Upcoming Event"
        : typeLabels[item.type];

  return (
    <article className={`dashboard-opportunity-row ${item.kind === "event" ? "dashboard-opportunity-row-event" : ""}`}>
      <div className="dashboard-opportunity-row-top">
        <div className="field-guide-meta-row">
          <span className="badge">{badgeLabel}</span>
          <span className="muted">{item.distanceMiles !== null ? `${item.distanceMiles} miles` : "Regional pick"}</span>
        </div>
      </div>
      <h4 className="dashboard-opportunity-title">{item.title}</h4>
      {item.kind === "event" ? (
        <p className="dashboard-opportunity-event-meta">
          {[eventMeta, item.sourceLabel].filter(Boolean).join(" - ")}
        </p>
      ) : null}
      <p className="dashboard-opportunity-description">{item.reason}</p>
      <div className="dashboard-opportunity-row-bottom">
        <p className="muted dashboard-opportunity-location">
          {item.locationLabel}
        </p>
        <a className="button button-ghost dashboard-opportunity-map" href={item.href} target="_blank" rel="noreferrer">
          {item.ctaLabel}
        </a>
      </div>
    </article>
  );
}

export function DashboardFamilyOpportunities({ items, showHeader = true }: DashboardFamilyOpportunitiesProps) {
  const thisWeekEvents = items.filter((item) => item.kind === "event" && item.isThisWeek);
  const upcomingEvents = items.filter((item) => item.kind === "event" && !item.isThisWeek);
  const placeRecommendations = items.filter((item) => item.kind === "place");

  return (
    <section className="panel stack">
      {showHeader ? (
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Nearby Family Opportunities</p>
            <h3>This week&apos;s events, nearby places, and useful source calendars</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              This page now mixes real upcoming event picks with reliable nearby places, so families can spot what is happening soon without losing the steady fallback options.
            </p>
          </div>
        </div>
      ) : null}

      {thisWeekEvents.length ? (
        <div className="dashboard-opportunity-section">
          <div className="dashboard-opportunity-section-heading">
            <p className="eyebrow">This Week</p>
            <p className="dashboard-opportunity-section-copy">Real official events happening over the next few days.</p>
          </div>
          <div className="dashboard-opportunity-list">
            {thisWeekEvents.map((item) => (
              <OpportunityRow item={item} key={item.id} />
            ))}
          </div>
        </div>
      ) : null}

      {upcomingEvents.length ? (
        <div className="dashboard-opportunity-section">
          <div className="dashboard-opportunity-section-heading">
            <p className="eyebrow">Upcoming</p>
            <p className="dashboard-opportunity-section-copy">Next official event picks that are still worth planning around.</p>
          </div>
          <div className="dashboard-opportunity-list">
            {upcomingEvents.map((item) => (
              <OpportunityRow item={item} key={item.id} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="dashboard-opportunity-section">
        <div className="dashboard-opportunity-section-heading">
          <p className="eyebrow">Nearby Places</p>
          <p className="dashboard-opportunity-section-copy">Reliable museums, parks, and source pages that still work even if no event fits today.</p>
        </div>
        <div className="dashboard-opportunity-list">
          {placeRecommendations.map((item) => (
            <OpportunityRow item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
