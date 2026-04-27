import { PageShell } from "@/components/page-shell";
import { UmbrellaPortalTabs } from "@/components/umbrella/umbrella-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listUmbrellaFamilies } from "@/lib/premium/data";

export default async function UmbrellaFamiliesPage() {
  const { supabase, user } = await requireUser();
  const context = await ensurePremiumContext(supabase, user.id);
  const families = await listUmbrellaFamilies(supabase);

  return (
    <PageShell
      userLabel={user.email ?? "WSA user"}
      eyebrow="WSA UmbrellaOS"
      title="Families"
      description="View family rosters, student profiles, enrollment placeholders, and review history in one operations surface."
    >
      <UmbrellaPortalTabs />
      {!context.isReviewer && !context.isStaff ? (
        <section className="panel stack">
          <p className="panel-copy" style={{ margin: 0 }}>
            Reviewer or admin role required for operational family views.
          </p>
        </section>
      ) : null}

      <section className="content-grid">
        {families.map((family) => (
          <article key={String(family.id)} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">Family</p>
                <h3>{String(family.name ?? "WSA Family")}</h3>
              </div>
              <span className="badge">{String(family.payment_status ?? "not_configured")}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {String(family.county ?? "County not set")} • {String(family.local_school_system ?? "Local school system not set")}
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              Students: {Array.isArray(family.students) ? family.students.length : 0} • Reviews: {Array.isArray(family.reviews) ? family.reviews.length : 0}
            </p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
