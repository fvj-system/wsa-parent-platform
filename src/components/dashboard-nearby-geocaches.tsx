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
          <p className="eyebrow">Field Quests</p>
          <h3>
            {items.length
              ? countyLabel
                ? `Fresh community clues near ${countyLabel}`
                : "Fresh community clues near you"
              : "Open the Field Quests trail"}
          </h3>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {items.length
              ? "When a family hides a message, note, or treasure near your county, it shows up here beside the new public Field Quests."
              : needsSetup
                ? "Set a ZIP code to surface nearby counties automatically."
                : "Browse curated Field Quests, or hide the first community clue for your area."}
          </p>
        </div>
        <Link className="button button-primary" href="/field-quests">
          Open Field Quests
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
