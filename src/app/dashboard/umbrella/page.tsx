import { PageShell } from "@/components/page-shell";
import { UmbrellaPortalTabs } from "@/components/umbrella/umbrella-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, homeschoolDisclaimer, loadUmbrellaOverview } from "@/lib/premium/data";

export default async function UmbrellaHomePage() {
  const { supabase, user } = await requireUser();
  const context = await ensurePremiumContext(supabase, user.id);
  const overview = await loadUmbrellaOverview(supabase);

  return (
    <PageShell
      userLabel={user.email ?? "WSA user"}
      eyebrow="WSA UmbrellaOS"
      title="Umbrella-ready workflow"
      description="Reviewer and admin tools for portfolio review preparation, family oversight, and documentation operations."
    >
      <UmbrellaPortalTabs />

      {!context.isReviewer && !context.isStaff ? (
        <section className="panel stack">
          <h3>Admin and reviewer tools</h3>
          <p className="panel-copy" style={{ margin: 0 }}>
            These routes are reserved for reviewer and admin workflows. You can still use WSA Premium Homeschool for planning, evidence, and review packet preparation.
          </p>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="stat"><span>Families</span><strong>{overview.totalFamilies}</strong></article>
        <article className="stat"><span>Awaiting Review</span><strong>{overview.awaitingReview}</strong></article>
        <article className="stat"><span>Needs Correction</span><strong>{overview.needsCorrection}</strong></article>
        <article className="stat"><span>Approved</span><strong>{overview.approved}</strong></article>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Human review workflow</p>
            <h3>Qualified reviewer decision remains required</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>{homeschoolDisclaimer}</p>
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Operational snapshot</p>
            <h3>Current workload</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            Active reviewer assignments: {overview.totalAssignments} • Total reviews: {overview.totalReviews} • Active enrollments: {overview.activeEnrollments}
          </p>
        </section>
      </section>
    </PageShell>
  );
}
