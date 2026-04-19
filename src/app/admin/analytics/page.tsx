import Link from "next/link";
import { AdminLineChart } from "@/components/admin-line-chart";
import { AdminShell } from "@/components/admin-shell";
import {
  buildAttendanceTrend,
  loadAdminOperationsDataset,
  resolveAdminDateRange,
} from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";
import { getClassDateValue } from "@/lib/classes";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ range }, { supabase, user }] = await Promise.all([
    searchParams,
    requireAdmin(),
  ]);
  const selectedRange = resolveAdminDateRange(range, 180);
  const dataset = await loadAdminOperationsDataset(supabase);
  const filteredBookings = dataset.bookings.filter((booking) => {
    const bookedAt = new Date(booking.booked_at);
    return bookedAt >= selectedRange.start && bookedAt <= selectedRange.end;
  });
  const trend = buildAttendanceTrend({
    bookings: filteredBookings,
    classes: dataset.classes,
    start: selectedRange.start,
    end: selectedRange.end,
  });

  const totalPaid = filteredBookings.filter((item) => item.payment_status === "paid").length;
  const totalAttended = filteredBookings.filter((item) => item.booking_status === "attended").length;
  const uniqueFamilies = new Set(filteredBookings.map((item) => item.household_id).filter(Boolean)).size;
  const uniqueStudents = new Set(filteredBookings.map((item) => item.student_id).filter(Boolean)).size;

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Analytics"
      description="A planning view for how class demand and attendance are moving over time."
    >
      <section className="panel stack">
        <div className="cta-row">
          <Link className={`button ${selectedRange.days === 30 ? "button-primary" : "button-ghost"}`} href="/admin/analytics?range=30d">30 days</Link>
          <Link className={`button ${selectedRange.days === 90 ? "button-primary" : "button-ghost"}`} href="/admin/analytics?range=90d">90 days</Link>
          <Link className={`button ${selectedRange.days === 180 ? "button-primary" : "button-ghost"}`} href="/admin/analytics?range=180d">6 months</Link>
          <Link className={`button ${selectedRange.days === 365 ? "button-primary" : "button-ghost"}`} href="/admin/analytics?range=365d">1 year</Link>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat"><span>Registrations</span><strong>{filteredBookings.length}</strong></article>
        <article className="stat"><span>Paid</span><strong>{totalPaid}</strong></article>
        <article className="stat"><span>Attended</span><strong>{totalAttended}</strong></article>
        <article className="stat"><span>Unique families</span><strong>{uniqueFamilies}</strong></article>
      </section>

      <section className="content-grid">
        <AdminLineChart
          title="Attendance trend line"
          subtitle={`Registrations grouped across ${selectedRange.label.toLowerCase()}.`}
          points={trend}
        />

        <section className="panel stack">
          <div>
            <p className="eyebrow">Read this simply</p>
            <h3>What this chart means</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            This line shows how many learner registrations landed in each time bucket. It helps spot momentum, quiet stretches, and whether new class offerings are pulling families back in.
          </p>
          <div className="chip-list">
            <li>{uniqueStudents} unique students</li>
            <li>
              {dataset.classes.filter((item) => {
                const classDate = getClassDateValue(item);
                if (!classDate) return false;
                const parsedDate = new Date(`${classDate}T00:00:00`);
                return parsedDate >= selectedRange.start && parsedDate <= selectedRange.end;
              }).length} classes in range
            </li>
            <li>{filteredBookings.filter((item) => item.payment_status === "refunded").length} refunded</li>
            <li>{filteredBookings.filter((item) => item.booking_status === "no_show").length} no-shows</li>
          </div>
        </section>
      </section>
    </AdminShell>
  );
}
