import { PageShell } from "@/components/page-shell";
import { UmbrellaPortalTabs } from "@/components/umbrella/umbrella-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, loadComplianceSnapshot } from "@/lib/premium/data";

export default async function UmbrellaCompliancePage() {
  const { supabase, user } = await requireUser();
  await ensurePremiumContext(supabase, user.id);
  const compliance = await loadComplianceSnapshot(supabase);

  return (
    <PageShell
      userLabel={user.email ?? "WSA user"}
      eyebrow="WSA UmbrellaOS"
      title="Compliance"
      description="Watch subject gaps, overdue reviews, correction-heavy families, and AI actions still awaiting human confirmation."
    >
      <UmbrellaPortalTabs />
      <section className="stats-grid">
        <article className="stat"><span>Overdue Reviews</span><strong>{compliance.overdueReviews}</strong></article>
        <article className="stat"><span>Needs Correction</span><strong>{compliance.familiesNeedingCorrection}</strong></article>
        <article className="stat"><span>AI Pending</span><strong>{compliance.aiPendingConfirmation}</strong></article>
        <article className="stat"><span>Subject Gaps</span><strong>{compliance.subjectGaps.length}</strong></article>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Subjects with the most missing evidence</p>
          <h3>Gap watch</h3>
        </div>
        <div className="premium-checklist">
          {compliance.subjectGaps.map((gap) => (
            <article key={gap.subject} className="premium-inline-card">
              <strong>{gap.subject}</strong>
              <span>{gap.count} missing findings</span>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
