import Link from "next/link";
import {
  getClassCapacity,
  getClassChildRegistrationLink,
  getClassDateValue,
  getClassFamilyPrice,
  getClassFamilyRegistrationLink,
  getClassPrimaryPrice,
  getClassSpotsLeft,
  type ClassRecord
} from "@/lib/classes";

type ClassDetailViewProps = {
  classItem: ClassRecord;
};

function formatClassDate(value: string | null) {
  if (!value) return "Date TBD";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatPrice(value: number | null) {
  if (value === null) return "TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function ClassDetailView({ classItem }: ClassDetailViewProps) {
  const classDate = formatClassDate(getClassDateValue(classItem));
  const childLink = getClassChildRegistrationLink(classItem);
  const familyLink = getClassFamilyRegistrationLink(classItem);
  const childPrice = getClassPrimaryPrice(classItem);
  const familyPrice = getClassFamilyPrice(classItem);
  const spotsLeft = getClassSpotsLeft(classItem);
  const capacity = getClassCapacity(classItem);
  const canRegister = classItem.status === "scheduled" || classItem.status === "published";

  return (
    <section className="stack">
      <section className="panel stack">
        <div className="cta-row">
          <Link className="button button-ghost" href="/classes">
            Back to classes
          </Link>
          <div className="field-guide-meta-row">
            {classItem.is_featured ? <span className="badge">Featured</span> : null}
            <span className="pill">{classItem.status}</span>
          </div>
        </div>

        {classItem.image_url ? (
          <img className="class-detail-image" src={classItem.image_url} alt={classItem.title} />
        ) : null}

        <div className="field-section-header">
          <div>
            <p className="eyebrow">Class details</p>
            <h2 className="page-title" style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}>{classItem.title}</h2>
            <p className="lede" style={{ margin: 0 }}>
              {classItem.short_description || classItem.description || "Class details coming soon."}
            </p>
          </div>
        </div>

        <div className="result-sections class-detail-grid">
          <section>
            <h4>Date</h4>
            <p>{classDate}</p>
          </section>
          <section>
            <h4>Time</h4>
            <p>{classItem.start_time && classItem.end_time ? `${classItem.start_time} - ${classItem.end_time}` : "Time TBD"}</p>
          </section>
          <section>
            <h4>Location</h4>
            <p>{classItem.location || "Location details coming soon."}</p>
          </section>
          <section>
            <h4>Age range</h4>
            <p>{classItem.age_range || "All family ages welcome"}</p>
          </section>
          <section>
            <h4>Child price</h4>
            <p>{formatPrice(childPrice)}</p>
          </section>
          <section>
            <h4>Family price</h4>
            <p>{formatPrice(familyPrice)}</p>
          </section>
          {spotsLeft !== null || capacity !== null ? (
            <section>
              <h4>Spots left</h4>
              <p>{spotsLeft ?? capacity ?? "TBD"}</p>
            </section>
          ) : null}
        </div>

        <section>
          <h4>Full class description</h4>
          <p>{classItem.description || "Full details will be added here soon."}</p>
        </section>

        <section>
          <h4>What to bring</h4>
          <p>{classItem.what_to_bring || "Bring water, weather-ready layers, and sturdy shoes."}</p>
        </section>

        <section className="trail-note trail-note-framed stack">
          <div>
            <p className="eyebrow">Register</p>
            <h4 style={{ marginTop: 4 }}>Choose the right registration path</h4>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            WSA helps you choose the class here. The register buttons open the live Jotform flow for waiver and Stripe payment.
          </p>
          <div className="cta-row">
            {canRegister && childLink ? (
              <a className="button button-primary" href={childLink} target="_blank" rel="noreferrer">
                Register as Child
              </a>
            ) : null}
            {canRegister && familyLink ? (
              <a className="button button-ghost" href={familyLink} target="_blank" rel="noreferrer">
                Register as Family
              </a>
            ) : null}
          </div>
          {!canRegister ? (
            <p className="muted" style={{ margin: 0 }}>
              This class is not currently open for new registration.
            </p>
          ) : null}
          {canRegister && !childLink && !familyLink ? (
            <p className="error" style={{ margin: 0 }}>
              Registration link coming soon. Please check back after the class form is connected.
            </p>
          ) : null}
        </section>
      </section>
    </section>
  );
}
