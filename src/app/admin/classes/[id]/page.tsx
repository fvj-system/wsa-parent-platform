import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBookingActions } from "@/components/admin-booking-actions";
import { AdminShell } from "@/components/admin-shell";
import { listAdminUsers } from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import type { StudentRecord } from "@/lib/students";

export default async function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();

  const [{ data: classItem }, { data: bookings }, { data: students }, { data: profiles }, { data: completions }, authUsers] = await Promise.all([
    supabase
      .from("classes")
      .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, internal_notes, waiver_required, status, created_at, updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
      .eq("class_id", id)
      .order("booked_at", { ascending: false }),
    supabase
      .from("students")
      .select("id, user_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at"),
    supabase
      .from("profiles")
      .select("id, full_name, household_name, phone, is_admin, created_at, updated_at"),
    supabase
      .from("activity_completions")
      .select("id, user_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
      .eq("activity_type", "in_person_class"),
    listAdminUsers(supabase)
  ]);

  if (!classItem) {
    notFound();
  }

  const studentMap = new Map(((students ?? []) as StudentRecord[]).map((student) => [student.id, student]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as { full_name?: string; household_name?: string; phone?: string }]));
  const completionMap = new Set(((completions ?? []) as ActivityCompletionRecord[]).map((item) => item.class_booking_id).filter(Boolean));

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={(classItem as ClassRecord).title}
      description="Review operational details, registrations, payments, and attendance from one admin workspace."
    >
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">{(classItem as ClassRecord).class_type}</p>
            <h3>{(classItem as ClassRecord).title}</h3>
          </div>
          <div className="nav-actions">
            <Link className="button button-ghost" href={`/admin/classes/${id}/edit`}>Edit class</Link>
          </div>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>{(classItem as ClassRecord).description || "No description added."}</p>
        <div className="chip-list">
          <li>{new Date((classItem as ClassRecord).date).toLocaleDateString()}</li>
          <li>{(classItem as ClassRecord).location || "Location TBD"}</li>
          <li>{(classItem as ClassRecord).status}</li>
          <li>{(classItem as ClassRecord).spots_remaining} spots left</li>
        </div>
        {(classItem as ClassRecord).internal_notes ? (
          <section>
            <h4>Internal notes</h4>
            <p>{(classItem as ClassRecord).internal_notes}</p>
          </section>
        ) : null}
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Registrations</p>
          <h3>Bookings and attendance</h3>
        </div>
        {((bookings ?? []) as ClassBookingRecord[]).length ? (
          <div className="stack">
            {((bookings ?? []) as ClassBookingRecord[]).map((booking) => {
              const student = booking.student_id ? studentMap.get(booking.student_id) : null;
              const profile = profileMap.get(booking.user_id);
              const attended = completionMap.has(booking.id);
              const email = authUsers.get(booking.user_id)?.email ?? "No email found";

              return (
                <article className="note-card" key={booking.id}>
                  <div className="copy">
                    <div className="header-row">
                      <div>
                        <h4>{student?.name ?? "Unassigned student"}</h4>
                        <p className="muted" style={{ margin: "8px 0 0" }}>
                          {profile?.household_name || profile?.full_name || "Parent account"} • {new Date(booking.booked_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="pill">{attended ? "attended" : booking.booking_status}</span>
                    </div>
                    <p className="panel-copy" style={{ margin: "10px 0 0" }}>
                      Payment: {booking.payment_status} • Paid ${(booking.amount_paid_cents / 100).toFixed(2)}
                    </p>
                    <p className="muted" style={{ margin: "10px 0 0" }}>
                      {email} {profile?.phone ? `• Phone: ${profile.phone}` : ""} • Stripe session: {booking.stripe_checkout_session_id || "none"}
                    </p>
                    <div style={{ marginTop: 14 }}>
                      <AdminBookingActions bookingId={booking.id} disabled={attended} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="panel-copy">No registrations yet for this class.</p>
        )}
      </section>
    </AdminShell>
  );
}
