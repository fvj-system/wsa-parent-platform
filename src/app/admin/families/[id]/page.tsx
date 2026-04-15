import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { loadAdminOperationsDataset } from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";

export default async function AdminFamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { supabase, user }] = await Promise.all([params, requireAdmin()]);
  const dataset = await loadAdminOperationsDataset(supabase);
  const household = dataset.households.find((item) => item.id === id);

  if (!household) {
    notFound();
  }

  const memberships = dataset.memberships.filter((item) => item.household_id === id);
  const profiles = dataset.profiles.filter((item) => item.household_id === id);
  const students = dataset.students.filter((item) => item.household_id === id);
  const bookings = dataset.bookings.filter((item) => item.household_id === id);
  const waivers = dataset.waivers.filter((item) => item.household_id === id);
  const discoveries = dataset.discoveries.filter((item) => item.household_id === id);
  const completions = dataset.completions.filter((item) => item.household_id === id);
  const portfolioEntries = dataset.portfolioEntries.filter((item) => item.household_id === id);
  const studentIds = new Set(students.map((item) => item.id));
  const badgeCount = dataset.badges.filter((item) => studentIds.has(item.student_id)).length;
  const classMap = new Map(dataset.classes.map((item) => [item.id, item]));

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={household.name}
      description="One family workspace for parent contacts, students, waivers, class activity, and broader homeschool engagement."
    >
      <section className="stats-grid">
        <article className="stat"><span>Parents linked</span><strong>{memberships.length}</strong></article>
        <article className="stat"><span>Students</span><strong>{students.length}</strong></article>
        <article className="stat"><span>Registrations</span><strong>{bookings.length}</strong></article>
        <article className="stat"><span>Attended</span><strong>{bookings.filter((item) => item.booking_status === "attended").length}</strong></article>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Parent contacts</p>
            <h3>Adults in this household</h3>
          </div>
          {memberships.map((membership) => {
            const profile = profiles.find((item) => item.id === membership.user_id);
            const authUser = dataset.authUsers.get(membership.user_id);
            return (
              <article key={membership.user_id} className="note-card">
                <div className="copy">
                  <h4>{profile?.full_name || "Parent account"}</h4>
                  <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                    {membership.role} • {authUser?.email ?? "No email found"} • {profile?.phone || "No phone"}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Household activity</p>
            <h3>Quick pulse</h3>
          </div>
          <div className="chip-list">
            <li>{waivers.length} waivers</li>
            <li>{discoveries.length} discoveries</li>
            <li>{portfolioEntries.length} documentation entries</li>
            <li>{completions.length} completions</li>
            <li>{badgeCount} badges earned</li>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            Use this page when you need to understand both family logistics and how much learning activity is actually happening inside the app.
          </p>
        </section>
      </section>

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Students</p>
            <h3>Learners in this household</h3>
          </div>
          <Link className="button button-ghost" href="/admin/families">Back to families</Link>
        </div>
        <div className="content-grid">
          {students.map((student) => (
            <article key={student.id} className="note-card">
              <div className="copy">
                <h4>{student.name}</h4>
                <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                  Age {student.age} • {student.current_rank} • {student.completed_adventures_count} completed adventures
                </p>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  Interests: {student.interests.join(", ") || "No interests saved"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Waivers</p>
            <h3>Signed forms</h3>
          </div>
          <div className="stack">
            {waivers.length ? waivers.map((waiver) => (
              <article key={waiver.id} className="note-card">
                <div className="copy">
                  <h4>{waiver.signature_name}</h4>
                  <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                    {waiver.waiver_type} • {new Date(waiver.accepted_at).toLocaleDateString()}
                  </p>
                </div>
              </article>
            )) : <p className="panel-copy">No waivers found yet.</p>}
          </div>
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Recent classes</p>
            <h3>Registrations and attendance</h3>
          </div>
          <div className="stack">
            {bookings.length ? bookings.slice(0, 10).map((booking) => {
              const classItem = classMap.get(booking.class_id);
              const student = students.find((item) => item.id === booking.student_id);
              return (
                <article key={booking.id} className="note-card">
                  <div className="copy">
                    <h4>{classItem?.title ?? "Class"}</h4>
                    <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                      {student?.name ?? "Household"} • {booking.booking_status} • {booking.payment_status}
                    </p>
                  </div>
                </article>
              );
            }) : <p className="panel-copy">No class bookings found yet.</p>}
          </div>
        </section>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Discoveries</p>
            <h3>Recent creature log activity</h3>
          </div>
          <div className="stack">
            {discoveries.length ? discoveries.slice(0, 8).map((discovery) => (
              <article key={discovery.id} className="note-card">
                <div className="copy">
                  <h4>{discovery.common_name}</h4>
                  <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                    {discovery.category} • {new Date(discovery.observed_at).toLocaleDateString()}
                  </p>
                </div>
              </article>
            )) : <p className="panel-copy">No discoveries saved yet.</p>}
          </div>
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Documentation</p>
            <h3>Recent homeschool evidence</h3>
          </div>
          <div className="stack">
            {portfolioEntries.length ? portfolioEntries.slice(0, 8).map((entry) => (
              <article key={entry.id} className="note-card">
                <div className="copy">
                  <h4>{entry.title}</h4>
                  <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                    {entry.entry_type} • {new Date(entry.occurred_at).toLocaleDateString()}
                  </p>
                </div>
              </article>
            )) : <p className="panel-copy">No documentation entries yet.</p>}
          </div>
        </section>
      </section>
    </AdminShell>
  );
}
