import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  buildHouseholdSummaries,
  loadAdminOperationsDataset,
  matchesAdminQuery,
} from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";

export default async function AdminFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, { supabase, user }] = await Promise.all([
    searchParams,
    requireAdmin(),
  ]);
  const query = (q ?? "").trim();
  const dataset = await loadAdminOperationsDataset(supabase);
  const summaries = buildHouseholdSummaries(dataset)
    .filter((family) =>
      matchesAdminQuery(query, [
        family.householdName,
        ...family.parentNames,
        ...family.parentEmails,
        ...family.studentNames,
        ...family.phoneNumbers,
        ...family.classTitles,
      ]),
    )
    .sort((left, right) => right.registrationCount - left.registrationCount);

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Families"
      description="Search households, parent contacts, students, waivers, registrations, and recent family activity from one place."
    >
      <section className="panel stack">
        <form className="content-grid" method="get">
          <label style={{ gridColumn: "1 / -1" }}>
            Search households, parents, students, email, or phone
            <input
              name="q"
              defaultValue={query}
              placeholder="Smith, student name, email, or phone"
            />
          </label>
          <div className="cta-row" style={{ gridColumn: "1 / -1" }}>
            <button type="submit">Search families</button>
            {query ? <Link className="button button-ghost" href="/admin/families">Clear</Link> : null}
          </div>
        </form>
      </section>

      <section className="stats-grid">
        <article className="stat"><span>Matching families</span><strong>{summaries.length}</strong></article>
        <article className="stat"><span>Students covered</span><strong>{summaries.reduce((sum, item) => sum + item.studentCount, 0)}</strong></article>
        <article className="stat"><span>Waivers on file</span><strong>{summaries.filter((item) => item.waiverOnFile).length}</strong></article>
        <article className="stat"><span>Families with 2+ classes</span><strong>{summaries.filter((item) => item.registrationCount >= 2).length}</strong></article>
      </section>

      <section className="stack">
        {summaries.map((family) => (
          <article key={family.householdId} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">Household</p>
                <h3>{family.householdName}</h3>
                <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                  {family.parentNames.join(", ") || "No parent name saved yet"}
                </p>
              </div>
              <div className="cta-row">
                <span className="pill">{family.registrationCount} registrations</span>
                <Link className="button button-primary" href={`/admin/families/${family.householdId}`}>
                  Open family
                </Link>
              </div>
            </div>
            <div className="chip-list">
              <li>{family.studentCount} students</li>
              <li>{family.attendedCount} attended</li>
              <li>{family.discoveryCount} discoveries</li>
              <li>{family.documentationCount} documentation entries</li>
              <li>{family.waiverOnFile ? "Waiver on file" : "Waiver not saved on file"}</li>
            </div>
            <p className="panel-copy" style={{ margin: 0 }}>
              Emails: {family.parentEmails.join(", ") || "No email found"}<br />
              Phones: {family.phoneNumbers.join(", ") || "No phone saved"}<br />
              Students: {family.studentNames.join(", ") || "No students added yet"}
            </p>
            {family.recentClassTitle ? (
              <p className="muted" style={{ margin: 0 }}>
                Recent class: {family.recentClassTitle} on {new Date(family.recentClassDate ?? "").toLocaleDateString()}
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
