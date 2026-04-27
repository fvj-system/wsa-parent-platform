import { PageShell } from "@/components/page-shell";
import { EnrollmentAdminPanel } from "@/components/umbrella/EnrollmentAdminPanel";
import { UmbrellaPortalTabs } from "@/components/umbrella/umbrella-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listUmbrellaEnrollments } from "@/lib/premium/data";

export default async function UmbrellaEnrollmentsPage() {
  const { supabase, user } = await requireUser();
  const context = await ensurePremiumContext(supabase, user.id);
  const enrollments = await listUmbrellaEnrollments(supabase);
  const [{ data: families }, { data: students }] = await Promise.all([
    supabase.from("families").select("id, name").order("name", { ascending: true }),
    supabase.from("students").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <PageShell
      userLabel={user.email ?? "WSA user"}
      eyebrow="WSA UmbrellaOS"
      title="Enrollments"
      description="Track umbrella-ready enrollment states, supervising entity status, and operational notes for each student."
    >
      <UmbrellaPortalTabs />
      {context.isStaff ? (
        <EnrollmentAdminPanel
          families={(families ?? []) as Array<{ id: string; name: string }>}
          students={(students ?? []) as Array<{ id: string; name: string }>}
        />
      ) : (
        <section className="panel stack">
          <p className="panel-copy" style={{ margin: 0 }}>
            Admin role recommended for editing enrollment records.
          </p>
        </section>
      )}
      <section className="content-grid">
        {enrollments.map((enrollment) => (
          <article key={String(enrollment.id)} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">Enrollment</p>
                <h3>{String((enrollment.students as { name?: string | null } | undefined)?.name ?? "Student")}</h3>
              </div>
              <span className="badge">{String(enrollment.enrollment_status ?? "draft")}</span>
            </div>
            <p className="panel-copy" style={{ margin: 0 }}>
              {String((enrollment.families as { name?: string | null } | undefined)?.name ?? "WSA Family")}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Supervising entity status: {String(enrollment.supervising_entity_status ?? "portfolio_support_only")}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              {String(enrollment.start_date ?? "No start date")} to {String(enrollment.end_date ?? "Open")}
            </p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
