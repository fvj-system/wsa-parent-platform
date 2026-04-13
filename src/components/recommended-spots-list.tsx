import type { RecommendedSpot } from "@/lib/context/nearby-spots";

type RecommendedSpotsListProps = {
  title?: string;
  items: RecommendedSpot[];
  emptyMessage: string;
};

export function RecommendedSpotsList({
  title = "Recommended nearby spots",
  items,
  emptyMessage
}: RecommendedSpotsListProps) {
  return (
    <section className="mission-panel">
      <div className="stack" style={{ gap: 6 }}>
        <h4>{title}</h4>
        {items.length ? (
          <p className="panel-copy" style={{ margin: 0 }}>
            These are the strongest local places, calendars, or source pages to check first based on today&apos;s outing style and family needs.
          </p>
        ) : null}
      </div>
      {items.length ? (
        <div className="section-card-grid tight" style={{ marginTop: 12 }}>
          {items.map((spot) => (
            <article className="note-card badge-specimen" key={spot.id}>
              <div className="copy">
                <div className="header-row spot-card-meta">
                  <span className="pill">{spot.spotType.replaceAll("_", " ")}</span>
                  {spot.waterType ? <span className="pill field-guide-pill">{spot.waterType}</span> : null}
                  <span className="muted">
                    {spot.distanceMiles === null ? `Nearby | ${spot.locationLabel}` : `${spot.distanceMiles} mi | ${spot.locationLabel}`}
                  </span>
                </div>
                <h4>{spot.name}</h4>
                <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                  {spot.reason}
                </p>
                <div className="spot-detail-stack">
                  <p className="muted" style={{ margin: "8px 0 0" }}>
                    <strong>Best use today:</strong> {spot.recommendedUseToday}
                  </p>
                  <p className="muted" style={{ margin: "8px 0 0" }}>
                    <strong>Access note:</strong> {spot.accessNote}
                  </p>
                </div>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  {spot.description}
                </p>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <a className="button button-ghost" href={spot.mapUrl} target="_blank" rel="noreferrer">
                    {spot.linkLabel ?? "Open in Maps"}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-copy" style={{ marginTop: 10 }}>
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
