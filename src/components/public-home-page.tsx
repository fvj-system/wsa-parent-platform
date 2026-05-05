import Link from "next/link";
import { ClassesCatalog } from "@/components/classes-catalog";
import { PublicSiteShell } from "@/components/public-site-shell";
import type { ClassRecord } from "@/lib/classes";

type PublicHomePageProps = {
  userEmail?: string | null;
  featuredClasses: ClassRecord[];
};

export function PublicHomePage({ userEmail, featuredClasses }: PublicHomePageProps) {
  return (
    <PublicSiteShell userEmail={userEmail}>
      <section className="hero">
        <div className="stack">
          <p className="eyebrow">Wild Stallion Academy</p>
          <h1 className="display">Outdoor homeschool adventures for Maryland families.</h1>
          <p className="lede">
            WSA turns local parks, trails, wildlife, weather, and history into hands-on learning experiences your kids can actually remember.
          </p>
          <div className="cta-row" style={{ justifyContent: "flex-start" }}>
            <Link className="button button-primary" href="/classes">
              View upcoming classes
            </Link>
            {userEmail ? (
              <Link className="button button-ghost" href="/dashboard">
                Open family dashboard
              </Link>
            ) : (
              <Link className="button button-ghost" href="/auth/sign-up">
                Create family account
              </Link>
            )}
          </div>
        </div>

        <aside className="panel stack" style={{ margin: 0 }}>
          <p className="eyebrow">Built for parents</p>
          <h3>Pick a class, prepare your family, and keep learning proof organized.</h3>
          <ul className="chip-list">
            <li>Nature-based homeschool learning</li>
            <li>Maryland wildlife and local history</li>
            <li>Family-friendly outdoor classes</li>
            <li>Portfolio and review-packet tools</li>
          </ul>
        </aside>
      </section>

      <section className="stats-grid">
        <article className="stat stack">
          <p className="eyebrow">1</p>
          <h3>Browse classes</h3>
          <p className="panel-copy">See dates, age ranges, prices, locations, and what your family should bring.</p>
        </article>
        <article className="stat stack">
          <p className="eyebrow">2</p>
          <h3>Create your profile</h3>
          <p className="panel-copy">Keep student profiles, household details, class history, and outdoor learning records together.</p>
        </article>
        <article className="stat stack">
          <p className="eyebrow">3</p>
          <h3>Show up ready</h3>
          <p className="panel-copy">Use clear class details, weather-aware notes, waivers, and what-to-bring lists.</p>
        </article>
        <article className="stat stack">
          <p className="eyebrow">4</p>
          <h3>Save the learning</h3>
          <p className="panel-copy">Turn outdoor adventures into portfolio evidence, badges, worksheets, and review-packet support.</p>
        </article>
      </section>

      <section className="panel stack">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Upcoming WSA classes</p>
            <h2 className="page-title">Find the next outdoor learning day.</h2>
            <p className="lede" style={{ margin: 0 }}>
              Start with a real class. The family dashboard and homeschool tools become more useful after your children begin logging real outdoor learning.
            </p>
          </div>
        </div>
        <ClassesCatalog upcomingClasses={featuredClasses} pastClasses={[]} isPublicView />
        <div className="cta-row" style={{ justifyContent: "flex-start" }}>
          <Link className="button button-primary" href="/classes">
            View all classes
          </Link>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel stack">
          <p className="eyebrow">Why parents choose WSA</p>
          <h3>Homeschool learning should not feel trapped at the kitchen table.</h3>
          <p className="panel-copy">
            WSA helps families get outside, observe real nature, build confidence, and connect outdoor experiences to practical homeschool records.
          </p>
        </article>
        <article className="panel stack">
          <p className="eyebrow">Parent trust</p>
          <h3>Clear expectations before your family arrives.</h3>
          <p className="panel-copy">
            Class pages explain location, weather expectations, what to bring, age fit, waiver steps, and registration status before checkout.
            Parent-controlled student profiles keep family details inside the signed-in dashboard.
          </p>
          <ul className="chip-list">
            <li>Outdoor safety notes</li>
            <li>Parent-signed class waiver</li>
            <li>Family-controlled student records</li>
            <li>No public child profile pages</li>
          </ul>
          <Link className="button button-ghost" href="/parents">
            Read parent FAQ
          </Link>
        </article>
        <article className="panel stack">
          <p className="eyebrow">Premium homeschool tools</p>
          <h3>Turn adventures into organized proof.</h3>
          <p className="panel-copy">
            WSA Premium is being built to help families turn outdoor learning into subject coverage, portfolio evidence, worksheets, and printable review packets.
          </p>
          <Link className="button button-ghost" href={userEmail ? "/dashboard/premium" : "/auth/sign-up?next=/dashboard/premium"}>
            Explore Premium
          </Link>
        </article>
      </section>
    </PublicSiteShell>
  );
}
