import Link from "next/link";
import { PublicSiteShell } from "@/components/public-site-shell";
import { createClient } from "@/lib/supabase/server";

const policySections = [
  {
    title: "Weather and trail conditions",
    summary:
      "WSA classes are outdoor learning experiences, so weather, trail conditions, air quality, and park access can change the plan.",
    details: [
      "Families should dress for outdoor conditions and check class notes before leaving home.",
      "WSA may adjust the route, activity, meeting spot, timing, or class format when safety or weather requires it.",
      "If a class needs to be postponed or canceled, families should receive the clearest available update through the active registration/contact path."
    ]
  },
  {
    title: "Parent or guardian attendance",
    summary:
      "WSA is designed for homeschool families, so parent awareness and family participation are part of the model unless a specific class says otherwise.",
    details: [
      "A parent or responsible guardian should remain available and aware during class activities.",
      "Any drop-off expectations should be explicitly stated on the class listing or registration materials before families assume drop-off is available.",
      "Parents are responsible for sharing relevant medical, allergy, mobility, behavior, or emergency notes before class."
    ]
  },
  {
    title: "Class waiver and emergency notes",
    summary:
      "A parent or guardian signs the class waiver before payment when a waiver is required for registration.",
    details: [
      "Emergency contact and medical notes should be accurate at the time of registration.",
      "Saved household waivers are meant to reduce repeated typing, not prevent parents from updating important safety details.",
      "WSA should treat emergency and medical notes as private operational information for class safety."
    ]
  },
  {
    title: "Photo and media consent",
    summary:
      "Family trust is easier when photo/media expectations are clear before class.",
    details: [
      "Parents should be told when photos or videos may be taken during a class or event.",
      "Public marketing use should require clear parent consent, especially when children are identifiable.",
      "If a family does not consent to public media use, WSA should provide a practical way to record that preference before or during class."
    ]
  },
  {
    title: "AI tools and student data",
    summary:
      "WSA may use AI-assisted tools for lessons, worksheets, nature prompts, and portfolio organization, but parents should stay in control of student records.",
    details: [
      "Student profiles, portfolio notes, generated lessons, and review materials belong inside the signed-in family experience.",
      "AI-generated content should be treated as parent-reviewed educational support, not as a replacement for parent judgment or official review advice.",
      "Families should avoid entering sensitive details into optional notes unless those details are needed for learning or class safety."
    ]
  },
  {
    title: "Refunds, transfers, and cancellations",
    summary:
      "Payment expectations should be simple and visible before a family registers.",
    details: [
      "If WSA cancels or postpones a class, families should receive clear options such as transfer, credit, or refund according to the active policy.",
      "If a family cannot attend, transfer or refund availability should depend on the final published policy and class capacity planning needs.",
      "This page is a parent-facing policy guide; final refund language should be reviewed before production use."
    ]
  },
  {
    title: "Homeschool portfolio evidence",
    summary:
      "WSA classes can become useful homeschool proof when parents save what happened, what was learned, and what the child created or observed.",
    details: [
      "Class attendance, nature observations, worksheets, photos parents approve, and student reflections can support portfolio records.",
      "Parents should review and choose what belongs in official homeschool documentation.",
      "WSA Premium tools are intended to help organize evidence, not guarantee acceptance by any reviewer, umbrella group, or agency."
    ]
  }
];

export default async function ParentPoliciesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PublicSiteShell userEmail={user?.email ?? null}>
      <section className="page-header panel">
        <div className="page-header-copy">
          <p className="eyebrow">Parent FAQ and policies</p>
          <h1 className="page-title">Clear expectations before your family registers.</h1>
          <p className="lede">
            This guide explains how WSA thinks about outdoor safety, parent consent, class waivers, photos, AI-assisted homeschool tools,
            refunds, and portfolio evidence. It is parent-facing guidance, not legal advice.
          </p>
          <div className="cta-row" style={{ justifyContent: "flex-start" }}>
            <Link className="button button-primary" href="/classes">
              View classes
            </Link>
            <Link className="button button-ghost" href={user ? "/dashboard" : "/auth/sign-up?next=/parents"}>
              {user ? "Open dashboard" : "Create family account"}
            </Link>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Quick answer</p>
            <h2 className="page-title" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              WSA is built around parent control, outdoor common sense, and useful homeschool records.
            </h2>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Parents should know what class they are choosing, what risks are normal for outdoor learning, what information WSA needs for safety,
              and how student records stay inside the family account.
            </p>
          </div>
        </div>
        <ul className="chip-list">
          <li>Parent/guardian waiver before payment</li>
          <li>Weather-aware outdoor class planning</li>
          <li>Private family/student records</li>
          <li>Explicit media consent expectations</li>
          <li>Parent-reviewed AI homeschool support</li>
        </ul>
      </section>

      <section className="stack">
        {policySections.map((section) => (
          <article className="panel stack" key={section.title}>
            <div>
              <p className="eyebrow">Policy guide</p>
              <h3>{section.title}</h3>
              <p className="panel-copy" style={{ marginBottom: 0 }}>{section.summary}</p>
            </div>
            <ul className="result-list">
              {section.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="trail-note trail-note-framed stack">
        <div>
          <p className="eyebrow">Production note</p>
          <h3>Still needs final policy review before full family scale.</h3>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          This page gives WSA a clearer parent-facing policy surface. Before using it as final production policy language,
          Lou should review it for legal, insurance, refund, child privacy, and media-consent fit.
        </p>
      </section>
    </PublicSiteShell>
  );
}
