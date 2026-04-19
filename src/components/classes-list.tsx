import Link from "next/link";
import {
  getClassCapacity,
  getClassDateValue,
  getClassPrimaryPrice,
  getClassSpotsLeft,
  type ClassRecord
} from "@/lib/classes";

type ClassesListProps = {
  classes: ClassRecord[];
};

function formatMoney(value: number | null) {
  if (typeof value !== "number") return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function ClassesList({ classes }: ClassesListProps) {
  if (!classes.length) {
    return (
      <section className="panel stack">
        <div>
          <p className="eyebrow">Classes</p>
          <h3>No classes published yet</h3>
          <p className="panel-copy">This page is now backed by the database and ready for real class publishing and booking flows.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-grid">
      {classes.map((item) => (
        <article className="panel stack" key={item.id}>
          <div className="header-row">
            <div>
              <p className="eyebrow">{item.class_type}</p>
              <h3>{item.title}</h3>
            </div>
            <span className="pill">{item.status}</span>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            {item.description || "Outdoor class details coming soon."}
          </p>
          <div className="chip-list">
            <li>{getClassDateValue(item) ? new Date(getClassDateValue(item) as string).toLocaleDateString() : "Date TBD"}</li>
            <li>{item.start_time} - {item.end_time}</li>
            <li>{item.location || "Location TBD"}</li>
            <li>{formatMoney(getClassPrimaryPrice(item))}</li>
          </div>
          <div className="result-sections">
            <section>
              <h4>Age range</h4>
              <p>
                {item.age_min ?? "?"} - {item.age_max ?? "?"}
              </p>
            </section>
            <section>
              <h4>Spots remaining</h4>
              <p>
                {getClassSpotsLeft(item) ?? "?"} of {getClassCapacity(item) ?? "?"}
              </p>
            </section>
            <section>
              <h4>What to bring</h4>
              <p>{item.what_to_bring || "Bring water, weather-appropriate layers, and curiosity."}</p>
            </section>
            <section>
              <h4>Weather note</h4>
              <p>{item.weather_note || "Final weather guidance will be shared before class."}</p>
            </section>
          </div>
          <div className="cta-row">
            <Link className="button button-primary" href={`/classes/${item.id}`}>
              View class
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
