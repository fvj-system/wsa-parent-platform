import Link from "next/link";
import { AdminLineChart } from "@/components/admin-line-chart";
import { AdminShell } from "@/components/admin-shell";
import {
  buildAttendanceTrend,
  buildHouseholdSummaries,
  buildStudentEngagementRows,
  loadAdminOperationsDataset,
  resolveAdminDateRange,
} from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ range }, { supabase, user }] = await Promise.all([
    searchParams,
    requireAdmin(),
  ]);

  const selectedRange = resolveAdminDateRange(range, 90);
  const dataset = await loadAdminOperationsDataset(supabase);
  const householdSummaries = buildHouseholdSummaries(dataset);
  const engagementRows = buildStudentEngagementRows(dataset).sort(
    (left, right) => right.score - left.score,
  );
  const trend = buildAttendanceTrend({
    bookings: dataset.bookings,
    classes: dataset.classes,
    start: selectedRange.start,
    end: selectedRange.end,
  });

  const recentBookings = dataset.bookings.slice(0, 8);
  const classMap = new Map(dataset.classes.map((item) => [item.id, item]));
  const studentMap = new Map(dataset.students.map((item) => [item.id, item]));
  const householdMap = new Map(dataset.households.map((item) => [item.id, item]));

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Admin Overview"
      description="A compact operations view for classes, families, registrations, attendance, and healthy app engagement."
    >
      <section className="stats-grid">
        <article className="stat"><span>Households</span><strong>{dataset.households.length}</strong></article>
        <article className="stat"><span>Students</span><strong>{dataset.students.length}</strong></article>
        <article className="stat"><span>Registrations</span><strong>{dataset.bookings.length}</strong></article>
        <article className="stat"><span>Attended</span><strong>{dataset.bookings.filter((item) => item.booking_status === "attended").length}</strong></article>
      </section>

      <section className="content-grid">
        <AdminLineChart
          title="Attendance over time"
          subtitle={`Showing registrations across ${selectedRange.label.toLowerCase()}.`}
          points={trend}
        />

        <section className="panel stack">
          <div>
            <p className="eyebrow">Quick window</p>
            <h3>Choose a time range</h3>
          </div>
          <div className="cta-row">
            <Link className={`button ${selectedRange.days === 30 ? "button-primary" : "button-ghost"}`} href="/admin?range=30d">30 days</Link>
            <Link className={`button ${selectedRange.days === 90 ? "button-primary" : "button-ghost"}`} href="/admin?range=90d">90 days</Link>
            <Link className={`button ${selectedRange.days === 180 ? "button-primary" : "button-ghost"}`} href="/admin?range=180d">6 months</Link>
            <Link className={`button ${selectedRange.days === 365 ? "button-primary" : "button-ghost"}`} href="/admin?range=365d">1 year</Link>
          </div>
          <div className="chip-list">
            <li>{dataset.waivers.filter((item) => item.save_on_file).length} waivers on file</li>
            <li>{dataset.discoveries.length} discoveries</li>
            <li>{dataset.portfolioEntries.length} documentation entries</li>
            <li>{dataset.badges.length} badges earned</li>
          </div>
          <div className="cta-row">
            <Link className="button button-primary" href="/admin/classes">Manage classes</Link>
            <Link className="button button-ghost" href="/admin/field-quests">Manage Field Quests</Link>
            <Link className="button button-ghost" href="/admin/attendees">Open attendee list</Link>
            <Link className="button button-ghost" href="/admin/engagement">View engagement</Link>
          </div>
        </section>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Recent registrations</p>
              <h3>Newest signups</h3>
            </div>
            <Link className="button button-ghost" href="/admin/attendees">See all attendees</Link>
          </div>
          <div className="stack">
            {recentBookings.map((booking) => (
              <article key={booking.id} className="note-card">
                <div className="copy">
                  <h4>{booking.student_id ? studentMap.get(booking.student_id)?.name ?? "Student" : "Household registration"}</h4>
                  <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                    {householdMap.get(booking.household_id ?? "")?.name ?? "WSA Household"} • {classMap.get(booking.class_id)?.title ?? "Class"}
                  </p>
                  <p className="muted" style={{ margin: "8px 0 0" }}>
                    {dataset.authUsers.get(booking.user_id)?.email ?? "No email found"} • {new Date(booking.booked_at).toLocaleString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Top engagement</p>
              <h3>Most active learners</h3>
            </div>
            <Link className="button button-ghost" href="/admin/engagement">Full ranking</Link>
          </div>
          <div className="stack">
            {engagementRows.slice(0, 6).map((row, index) => (
              <article key={row.studentId} className="note-card">
                <div className="copy">
                  <div className="header-row">
                    <div>
                      <h4>{index + 1}. {row.studentName}</h4>
                      <p className="muted" style={{ margin: "8px 0 0" }}>
                        {row.householdName} • {row.currentRank}
                      </p>
                    </div>
                    <span className="pill">{row.score} pts</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Family pulse</p>
            <h3>Most involved households</h3>
          </div>
          <Link className="button button-ghost" href="/admin/families">View family directory</Link>
        </div>
        <div className="content-grid">
          {householdSummaries
            .sort((left, right) => right.registrationCount - left.registrationCount)
            .slice(0, 6)
            .map((family) => (
              <article key={family.householdId} className="note-card">
                <div className="copy">
                  <h4>{family.householdName}</h4>
                  <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                    {family.studentCount} students • {family.attendedCount} attended • {family.discoveryCount} discoveries
                  </p>
                  <div className="cta-row" style={{ marginTop: 12 }}>
                    <Link className="button button-ghost" href={`/admin/families/${family.householdId}`}>
                      Open family
                    </Link>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>
    </AdminShell>
  );
}
