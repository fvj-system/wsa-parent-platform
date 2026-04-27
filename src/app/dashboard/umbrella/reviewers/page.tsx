import { PageShell } from "@/components/page-shell";
import { ReviewerAdminPanel } from "@/components/umbrella/ReviewerAdminPanel";
import { UmbrellaPortalTabs } from "@/components/umbrella/umbrella-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listReviewerProfilesWithAssignments } from "@/lib/premium/data";

export default async function UmbrellaReviewersPage() {
  const { supabase, user } = await requireUser();
  const context = await ensurePremiumContext(supabase, user.id);
  const reviewers = await listReviewerProfilesWithAssignments(supabase);
  const [{ data: families }, { data: students }] = await Promise.all([
    supabase.from("families").select("id, name").order("name", { ascending: true }),
    supabase.from("students").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <PageShell
      userLabel={user.email ?? "WSA user"}
      eyebrow="WSA UmbrellaOS"
      title="Reviewers"
      description="Track reviewer profiles, assignment load, and readiness for packet review operations."
    >
      <UmbrellaPortalTabs />
      {context.isStaff ? (
        <ReviewerAdminPanel
          families={(families ?? []) as Array<{ id: string; name: string }>}
          students={(students ?? []) as Array<{ id: string; name: string }>}
        />
      ) : (
        <section className="panel stack">
          <p className="panel-copy" style={{ margin: 0 }}>
            Admin role recommended for creating reviewer profiles and assigning workloads.
          </p>
        </section>
      )}
      <section className="content-grid">
        {reviewers.map((reviewer) => (
          <article key={String(reviewer.id)} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">Reviewer</p>
                <h3>{String(reviewer.display_name ?? "Reviewer")}</h3>
              </div>
              <span className="badge">{String(reviewer.active ? "active" : "inactive")}</span>
            </div>
            <p className="panel-copy" style={{ margin: 0 }}>{String(reviewer.bio ?? "No reviewer bio yet.")}</p>
            <p className="muted" style={{ margin: 0 }}>
              Workload: {Array.isArray(reviewer.reviewer_assignments) ? reviewer.reviewer_assignments.length : 0} assignments • Max family load: {String(reviewer.max_family_load ?? 20)}
            </p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
