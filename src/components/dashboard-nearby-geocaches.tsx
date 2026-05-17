import Link from "next/link";
import {
  getGeocacheTypeLabel,
  type NearbyGeocacheRecord,
} from "@/lib/geocaches";

type DashboardNearbyGeocachesProps = {
  items: NearbyGeocacheRecord[];
  countyLabel?: string | null;
  needsSetup?: boolean;
};

export function DashboardNearbyGeocaches({
  items,
  countyLabel,
  needsSetup = false,
}: DashboardNearbyGeocachesProps) {
  return (
    <section className="panel stack">
      <div className="header-row">
        <div>
          <p className="eyebrow">Trail caches</p>
          <h3>
            {items.length
              ? countyLabel
                ? `Fresh clues near ${countyLabel}`
                : "Fresh clues near you"
              : "Start the regional cache trail"}
          </h3>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {items.length
              ? "When a family hides a message, note, or treasure near your county, it shows up here."
              : needsSetup
                ? "Set a ZIP code to surface nearby counties automatically."
                : "Hide the first trail cache for your area or browse what other families have already placed."}
          </p>
        </div>
        <Link className="button button-primary" href="/geocache">
          Open geocache trail
        </Link>
      </div>

      {items.length ? (
        <div className="dashboard-opportunity-list">
          {items.slice(0, 3).map((item) => (
            <article className="dashboard-opportunity-row" key={item.id}>
              <div className="dashboard-opportunity-row-top">
                <div className="field-guide-meta-row">
                  <span className="badge">
                    {item.is_same_county ? "Your county" : `${item.county_name} County`}
                  </span>
                  <span className="muted">
                    {item.distance_miles !== null
                      ? `${item.distance_miles} mi`
                      : `${item.state_code}`}
                  </span>
                </div>
              </div>
              <h4 className="dashboard-opportunity-title">{item.title}</h4>
              <p className="dashboard-opportunity-description">
                {getGeocacheTypeLabel(item.cache_type)} · {item.location_hint}
              </p>
              <p className="panel-copy" style={{ margin: 0 }}>
                {item.clue}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
