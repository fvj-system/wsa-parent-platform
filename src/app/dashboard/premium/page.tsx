import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SubjectTracker } from "@/components/premium/SubjectTracker";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, formatPremiumStudentName, getPremiumDashboardSnapshot, homeschoolDisclaimer } from "@/lib/premium/data";

export default async function PremiumDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const [{ student }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const snapshot = await getPremiumDashboardSnapshot({
    supabase,
    context,
    selectedStudentId: student,
  });

  const weakOrMissing = snapshot.coverage.filter((item) => item.status !== "covered");

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title={`Welcome back, ${context.familyName} Family`}
      description="Plan lessons, track subjects, save evidence, and prepare review-ready homeschool records."
    >
      <PremiumPortalTabs />

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Student selector</p>
            <h3>Choose the active planning profile</h3>
          </div>
        </div>
        <div className="cta-row">
          {snapshot.students.map((studentRow) => (
            <Link
              key={studentRow.id}
              href={`/dashboard/premium?student=${studentRow.id}`}
              className={`button ${snapshot.activeStudent?.id === studentRow.id ? "button-primary" : "button-ghost"}`}
            >
              {formatPremiumStudentName(studentRow)}
            </Link>
          ))}
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat">
          <span>Active Student</span>
          <strong>{snapshot.activeStudent ? formatPremiumStudentName(snapshot.activeStudent) : "Add student"}</strong>
        </article>
        <article className="stat">
          <span>Evidence Items</span>
          <strong>{snapshot.portfolioItemCount}</strong>
        </article>
        <article className="stat">
          <span>Weak or Missing</span>
          <strong>{weakOrMissing.length}</strong>
        </article>
        <article className="stat">
          <span>Review Window</span>
          <strong>{snapshot.reviewWindow.startDate}</strong>
        </article>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Today&apos;s Homeschool Plan</p>
              <h3>{snapshot.todayPlan ? String(snapshot.todayPlan.title ?? "Today’s plan") : "No plan generated yet"}</h3>
            </div>
            <Link className="button button-primary" href={`/dashboard/premium/lessons${snapshot.activeStudent ? `?student=${snapshot.activeStudent.id}` : ""}`}>
              Generate Today’s Plan
            </Link>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            {snapshot.todayPlan
              ? `${String(snapshot.todayPlan.daily_assignments ? (snapshot.todayPlan.daily_assignments as Array<unknown>).length : 0)} assignments saved for today.`
              : "Generate a subject-by-subject plan with estimated time and evidence prompts."}
          </p>
          {(snapshot.todayPlan?.daily_assignments as Array<Record<string, unknown>> | undefined)?.slice(0, 4).map((assignment) => (
            <article key={String(assignment.activity_title)} className="premium-inline-card">
              <strong>{String(assignment.subject_name ?? "Subject")}</strong>
              <span>{String(assignment.activity_title ?? "")}</span>
            </article>
          ))}
        </section>

        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Worksheets Ready to Print</p>
              <h3>Recent worksheet library</h3>
            </div>
            <Link className="button button-primary" href={`/dashboard/premium/worksheets${snapshot.activeStudent ? `?student=${snapshot.activeStudent.id}` : ""}`}>
              Create Worksheet
            </Link>
          </div>
          <div className="stack">
            {snapshot.recentWorksheets.length ? (
              snapshot.recentWorksheets.map((worksheet) => (
                <article key={String(worksheet.id)} className="premium-inline-card">
                  <strong>{String(worksheet.subject ?? "Worksheet")}</strong>
                  <span>{String(worksheet.topic ?? "")}</span>
                  <a href={`/dashboard/premium/worksheets/${String(worksheet.id)}`}>Print</a>
                </article>
              ))
            ) : (
              <p className="panel-copy" style={{ margin: 0 }}>
                No worksheets generated yet.
              </p>
            )}
          </div>
        </section>
      </section>

      <SubjectTracker coverage={snapshot.coverage} />

      <section className="content-grid">
        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Portfolio Evidence Status</p>
              <h3>Evidence by subject</h3>
            </div>
            <Link className="button button-primary" href={`/dashboard/premium/portfolio${snapshot.activeStudent ? `?student=${snapshot.activeStudent.id}` : ""}`}>
              Upload Evidence
            </Link>
          </div>
          <div className="premium-checklist">
            {Object.entries(snapshot.evidenceBySubject).map(([subjectName, count]) => (
              <article key={subjectName} className="premium-inline-card">
                <strong>{subjectName}</strong>
                <span>{count} saved items</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Review Packet Status</p>
              <h3>Current review period</h3>
            </div>
            <Link className="button button-primary" href={`/dashboard/premium/review-packet${snapshot.activeStudent ? `?student=${snapshot.activeStudent.id}` : ""}`}>
              Build Review Packet
            </Link>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            Subjects covered: {snapshot.coverage.filter((item) => item.status === "covered").length} • Weak or missing: {weakOrMissing.length}
          </p>
          {snapshot.recentReviewPackets.length ? (
            snapshot.recentReviewPackets.map((packet) => (
              <article key={String(packet.id)} className="premium-inline-card">
                <strong>{String(packet.current_status ?? "draft")}</strong>
                <span>{String(packet.review_period_start ?? "")} to {String(packet.review_period_end ?? "")}</span>
              </article>
            ))
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              No review packets built yet.
            </p>
          )}
        </section>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Outdoor Learning Mission</p>
            <h3>{snapshot.outdoorMission.title}</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>{snapshot.outdoorMission.description}</p>
          <p className="muted" style={{ margin: 0 }}>
            Counts toward: {snapshot.outdoorMission.countsToward.join(", ")}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Evidence to save: {snapshot.outdoorMission.evidenceToSave}
          </p>
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Premium callout</p>
            <h3>WSA Premium connects outdoor learning, daily academics, and portfolio documentation into one family dashboard.</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>{homeschoolDisclaimer}</p>
        </section>
      </section>
    </PageShell>
  );
}
