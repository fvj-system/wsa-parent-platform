import Link from "next/link";
import { AdminClassStatusActions } from "@/components/admin-class-status-actions";
import { AdminClassImportCard } from "@/components/admin-class-import-card";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";

export default async function AdminClassesPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const { supabase, user } = await requireAdmin();
  const today = new Date().toISOString().slice(0, 10);

  let classQuery = supabase
    .from("classes")
    .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, internal_notes, waiver_required, status, created_at, updated_at")
    .order("date", { ascending: true });

  if (filter === "open") classQuery = classQuery.eq("status", "published");
  if (filter === "full") classQuery = classQuery.eq("status", "full");
  if (filter === "cancelled") classQuery = classQuery.eq("status", "cancelled");
  if (filter === "completed") classQuery = classQuery.eq("status", "completed");
  if (filter === "upcoming") classQuery = classQuery.gte("date", today);
  if (filter === "past") classQuery = classQuery.lt("date", today);

  const [{ data: classes }, { data: bookings }] = await Promise.all([
    classQuery,
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
  ]);

  const classRows = (classes ?? []) as ClassRecord[];
  const bookingRows = (bookings ?? []) as ClassBookingRecord[];
  const registrationsByClass = bookingRows.reduce<Record<string, number>>((acc, booking) => {
    if (booking.booking_status !== "cancelled") {
      acc[booking.class_id] = (acc[booking.class_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  const metrics = {
    upcoming: classRows.filter((item) => item.date >= today).length,
    open: classRows.filter((item) => item.status === "published").length,
    full: classRows.filter((item) => item.status === "full").length,
    registrationsThisMonth: bookingRows.filter((item) => item.booked_at.slice(0, 7) === today.slice(0, 7)).length,
    unpaid: bookingRows.filter((item) => item.payment_status === "unpaid" || item.payment_status === "failed").length
  };

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Classes"
      description="An operator cockpit for class publishing, registrations, attendance, and class status."
    >
      <section className="stats-grid">
        <article className="stat"><span>Upcoming classes</span><strong>{metrics.upcoming}</strong></article>
        <article className="stat"><span>Open classes</span><strong>{metrics.open}</strong></article>
        <article className="stat"><span>Full classes</span><strong>{metrics.full}</strong></article>
        <article className="stat"><span>Registrations this month</span><strong>{metrics.registrationsThisMonth}</strong></article>
      </section>

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Class operations</h3>
          </div>
          <Link className="button button-primary" href="/admin/classes/new">
            Create new class
          </Link>
        </div>
        <div className="cta-row">
          <Link className="button button-ghost" href="/admin/classes?filter=upcoming">Upcoming</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=open">Open</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=full">Full</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=cancelled">Cancelled</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=completed">Completed</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=past">Past</Link>
        </div>
      </section>

      <AdminClassImportCard />

      <section className="stack">
        {classRows.map((item) => (
          <article className="panel stack" key={item.id}>
            <div className="header-row">
              <div>
                <p className="eyebrow">{item.class_type}</p>
                <h3>{item.title}</h3>
              </div>
              <span className="pill">{item.status}</span>
            </div>
            <p className="panel-copy" style={{ margin: 0 }}>
              {new Date(item.date).toLocaleDateString()} • {item.location || "Location TBD"} • ${(item.price_cents / 100).toFixed(2)}
            </p>
            <div className="chip-list">
              <li>{item.spots_remaining} spots left</li>
              <li>{registrationsByClass[item.id] ?? 0} registrations</li>
            </div>
            <div className="cta-row">
              <Link className="button button-primary" href={`/admin/classes/${item.id}`}>View</Link>
              <Link className="button button-ghost" href={`/admin/classes/${item.id}/edit`}>Edit</Link>
            </div>
            <AdminClassStatusActions classId={item.id} />
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
