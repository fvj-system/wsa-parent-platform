import Link from "next/link";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";

type DashboardUpcomingClassesProps = {
  items: Array<ClassBookingRecord & { studentName: string; classes?: ClassRecord | null }>;
};

export function DashboardUpcomingClasses({ items }: DashboardUpcomingClassesProps) {
  const nextClass = items[0] ?? null;

  return (
    <section className="panel stack">
      <div className="header-row field-section-header">
        <div>
          <p className="eyebrow">Field experiences</p>
          <h3>Upcoming in-person classes</h3>
        </div>
        <div className="cta-row">
          <Link className="button button-ghost" href="/classes">
            Browse classes
          </Link>
          <Link className="button button-ghost" href="/classes">
            Family registrations
          </Link>
        </div>
      </div>

      {nextClass ? (
        <div className="dashboard-class-grid">
          <article className="specimen-card dashboard-class-spotlight">
            <span className="pill">Next booked class</span>
            <h4>{nextClass.classes?.title ?? "Booked class"}</h4>
            <p className="panel-copy" style={{ margin: 0 }}>
              {nextClass.studentName} |{" "}
              {nextClass.classes?.date
                ? new Date(nextClass.classes.date).toLocaleDateString()
                : new Date(nextClass.booked_at).toLocaleDateString()}
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              {nextClass.classes?.location ?? "Location will appear here once the class details are finalized."}
            </p>
            <div className="cta-row">
              {nextClass.classes ? (
                <Link className="button button-primary button-strong" href={`/classes?class=${nextClass.classes.id}`}>
                  View details
                </Link>
              ) : null}
              <Link className="button button-ghost" href="/classes">
                View all registrations
              </Link>
            </div>
          </article>

          <div className="stack">
            {items.slice(1, 3).map((item) => (
              <article className="note-card" key={item.id}>
                <div className="copy">
                  <h4>{item.classes?.title ?? "Booked class"}</h4>
                  <p className="muted" style={{ margin: "8px 0 0" }}>
                    {item.studentName} |{" "}
                    {item.classes?.date ? new Date(item.classes.date).toLocaleDateString() : new Date(item.booked_at).toLocaleDateString()}
                    {item.classes?.location ? ` | ${item.classes.location}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="field-empty-state">
          <div className="copy">
            <h4>No classes booked yet</h4>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              WSA in-person classes will appear here once a family books one. Use the class catalog when you want to add a guided field experience to the week.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
