import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  buildHouseholdSummaries,
  loadAdminOperationsDataset,
  matchesAdminQuery,
} from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";
import { getClassDateValue } from "@/lib/classes";

export default async function AdminAttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    classId?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const [{ q, classId, start, end }, { supabase, user }] = await Promise.all([
    searchParams,
    requireAdmin(),
  ]);
  const query = (q ?? "").trim();
  const dataset = await loadAdminOperationsDataset(supabase);
  const startDate = start ? new Date(`${start}T00:00:00`) : null;
  const endDate = end ? new Date(`${end}T23:59:59`) : null;
  const filteredBookings = dataset.bookings.filter((booking) => {
    if (classId && booking.class_id !== classId) return false;
    const bookedAt = new Date(booking.booked_at);
    if (startDate && bookedAt < startDate) return false;
    if (endDate && bookedAt > endDate) return false;
    return true;
  });

  const summaries = buildHouseholdSummaries({
    ...dataset,
    bookings: filteredBookings,
  })
    .filter((family) => family.registrationCount > 0)
    .filter((family) =>
      matchesAdminQuery(query, [
        family.householdName,
        ...family.parentNames,
        ...family.parentEmails,
        ...family.studentNames,
        ...family.classTitles,
      ]),
    )
    .sort((left, right) => right.attendedCount - left.attendedCount);

  const classes = [...dataset.classes].sort(
    (left, right) =>
      new Date(`${getClassDateValue(right) ?? "1970-01-01"}T00:00:00`).getTime() -
      new Date(`${getClassDateValue(left) ?? "1970-01-01"}T00:00:00`).getTime(),
  );

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Attendees"
      description="A master class contact list for outreach, re-engagement, and seeing which families keep returning."
    >
      <section className="panel stack">
        <form className="content-grid" method="get">
          <label>
            Search by family, student, or email
            <input name="q" defaultValue={query} placeholder="Smith, email, or student name" />
          </label>
          <label>
            Class
            <select name="classId" defaultValue={classId ?? ""}>
              <option value="">All classes</option>
              {classes.map((classItem) => {
                const classDate = getClassDateValue(classItem);

                return (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.title} | {classDate ? new Date(`${classDate}T00:00:00`).toLocaleDateString() : "Date TBD"}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Start date
            <input name="start" type="date" defaultValue={start ?? ""} />
          </label>
          <label>
            End date
            <input name="end" type="date" defaultValue={end ?? ""} />
          </label>
          <div className="cta-row" style={{ gridColumn: "1 / -1" }}>
            <button type="submit">Filter attendees</button>
            {(query || classId || start || end) ? <Link className="button button-ghost" href="/admin/attendees">Clear</Link> : null}
          </div>
        </form>
      </section>

      <section className="stats-grid">
        <article className="stat"><span>Matching families</span><strong>{summaries.length}</strong></article>
        <article className="stat"><span>Registrations in filter</span><strong>{filteredBookings.length}</strong></article>
        <article className="stat"><span>Families with repeats</span><strong>{summaries.filter((item) => item.registrationCount >= 2).length}</strong></article>
        <article className="stat"><span>Saved waivers</span><strong>{summaries.filter((item) => item.waiverOnFile).length}</strong></article>
      </section>

      <section className="stack">
        {summaries.map((family) => (
          <article key={family.householdId} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">Attendee household</p>
                <h3>{family.householdName}</h3>
                <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                  {family.parentNames.join(", ") || "Parent account"} | {family.parentEmails.join(", ") || "No email found"}
                </p>
              </div>
              <span className="pill">{family.attendedCount} attended</span>
            </div>
            <div className="chip-list">
              <li>{family.registrationCount} registrations</li>
              <li>{family.studentCount} students</li>
              <li>{family.waiverOnFile ? "Waiver on file" : "Waiver not on file"}</li>
              <li>{family.recentClassTitle ?? "No class title yet"}</li>
            </div>
            <p className="panel-copy" style={{ margin: 0 }}>
              Students: {family.studentNames.join(", ") || "None yet"}<br />
              Phones: {family.phoneNumbers.join(", ") || "No phone saved"}<br />
              Recent class date: {family.recentClassDate ? new Date(family.recentClassDate).toLocaleDateString() : "Unknown"}
            </p>
            <div className="cta-row">
              <Link className="button button-ghost" href={`/admin/families/${family.householdId}`}>
                Open family record
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
