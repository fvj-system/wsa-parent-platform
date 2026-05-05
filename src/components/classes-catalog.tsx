import Link from "next/link";
import {
  getClassCapacity,
  getClassChildRegistrationLink,
  getClassDateValue,
  getClassFamilyPrice,
  getClassPrimaryPrice,
  getClassSpotsLeft,
  type ClassRecord
} from "@/lib/classes";

type ClassesCatalogProps = {
  upcomingClasses: ClassRecord[];
  pastClasses: ClassRecord[];
  isPublicView?: boolean;
};

function formatClassDate(value: string | null) {
  if (!value) return "Date TBD";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatClassTime(classItem: ClassRecord) {
  if (!classItem.start_time && !classItem.end_time) return "Time TBD";
  if (!classItem.end_time) return classItem.start_time;
  if (!classItem.start_time) return classItem.end_time;
  return `${classItem.start_time} - ${classItem.end_time}`;
}

function formatPrice(value: number | null) {
  if (value === null) return "TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function getClassHref(classItem: ClassRecord) {
  return `/classes/${classItem.slug || classItem.id}`;
}

export function ClassesCatalog({ upcomingClasses, pastClasses, isPublicView = false }: ClassesCatalogProps) {
  return (
    <section className="stack">
      <section className="panel stack">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Upcoming classes</p>
            <h3>Choose the outdoor learning day that fits your family</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Browse dates, age ranges, locations, prices, and spots before creating an account or using the live registration link.
            </p>
          </div>
        </div>

        {upcomingClasses.length ? (
          <div className="classes-catalog-grid">
            {upcomingClasses.map((classItem) => {
              const priceChild = getClassPrimaryPrice(classItem);
              const priceFamily = getClassFamilyPrice(classItem);
              const spotsLeft = getClassSpotsLeft(classItem);
              const capacity = getClassCapacity(classItem);

              return (
                <article className="classes-card panel stack" key={classItem.id}>
                  {classItem.image_url ? (
                    <img className="classes-card-image" src={classItem.image_url} alt={classItem.title} />
                  ) : null}
                  <div className="classes-card-header">
                    <div className="stack" style={{ gap: 6 }}>
                      <div className="field-guide-meta-row">
                        {classItem.is_featured ? <span className="badge">Featured</span> : null}
                        <span className="pill">{classItem.status}</span>
                      </div>
                      <h3>{classItem.title}</h3>
                    </div>
                  </div>
                  <p className="panel-copy" style={{ margin: 0 }}>
                    {classItem.short_description || classItem.description || "Class details coming soon."}
                  </p>
                  <ul className="chip-list">
                    <li>{formatClassDate(getClassDateValue(classItem))}</li>
                    <li>{formatClassTime(classItem)}</li>
                    <li>{classItem.location || "Location TBD"}</li>
                  </ul>
                  <div className="classes-price-row">
                    <div className="classes-price-chip">
                      <span>Child</span>
                      <strong>{formatPrice(priceChild)}</strong>
                    </div>
                    <div className="classes-price-chip">
                      <span>Family</span>
                      <strong>{formatPrice(priceFamily)}</strong>
                    </div>
                    {spotsLeft !== null || capacity !== null ? (
                      <div className="classes-price-chip">
                        <span>Spots left</span>
                        <strong>{spotsLeft ?? capacity ?? "TBD"}</strong>
                      </div>
                    ) : null}
                  </div>
                  <div className="cta-row">
                    <Link className="button button-primary" href={getClassHref(classItem)}>
                      View class
                    </Link>
                    {getClassChildRegistrationLink(classItem) ? (
                      <a
                        className="button button-ghost"
                        href={getClassChildRegistrationLink(classItem) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Quick register
                      </a>
                    ) : isPublicView ? (
                      <Link className="button button-ghost" href={`/auth/sign-up?next=${encodeURIComponent(getClassHref(classItem))}`}>
                        Create account
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No upcoming classes yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                As soon as the next classes are published, families will be able to open them here and choose the right registration path.
              </p>
            </div>
          </div>
        )}
      </section>

      {pastClasses.length ? (
        <section className="panel stack">
          <div className="field-section-header">
            <div>
              <p className="eyebrow">Past classes</p>
              <h3>Recently completed or older class listings</h3>
            </div>
          </div>
          <div className="classes-past-list">
            {pastClasses.map((classItem) => (
              <Link className="classes-past-row" href={getClassHref(classItem)} key={classItem.id}>
                <div>
                  <strong>{classItem.title}</strong>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    {classItem.short_description || classItem.location || "Open for full details"}
                  </p>
                </div>
                <span className="muted">
                  {formatClassDate(getClassDateValue(classItem))}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
