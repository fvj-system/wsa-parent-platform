import { AdminShell } from "@/components/admin-shell";
import {
  buildStudentEngagementRows,
  loadAdminOperationsDataset,
  matchesAdminQuery,
} from "@/lib/admin-portal";
import { requireAdmin } from "@/lib/auth";

export default async function AdminEngagementPage({
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
  const rows = buildStudentEngagementRows(dataset)
    .filter((row) =>
      matchesAdminQuery(query, [row.studentName, row.householdName, row.currentRank]),
    )
    .sort((left, right) => right.score - left.score);

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Engagement"
      description="A positive internal ranking view built to spot momentum, celebrate participation, and notice who may need more encouragement."
    >
      <section className="panel stack">
        <form className="content-grid" method="get">
          <label style={{ gridColumn: "1 / -1" }}>
            Search student or household
            <input name="q" defaultValue={query} placeholder="Student name, household, or rank" />
          </label>
          <div className="cta-row" style={{ gridColumn: "1 / -1" }}>
            <button type="submit">Filter leaderboard</button>
          </div>
        </form>
      </section>

      <section className="stats-grid">
        <article className="stat"><span>Students ranked</span><strong>{rows.length}</strong></article>
        <article className="stat"><span>Total badges</span><strong>{dataset.badges.length}</strong></article>
        <article className="stat"><span>Total discoveries</span><strong>{dataset.discoveries.length}</strong></article>
        <article className="stat"><span>Total documentation</span><strong>{dataset.portfolioEntries.length}</strong></article>
      </section>

      <section className="panel stack">
        <p className="panel-copy" style={{ margin: 0 }}>
          This is not meant to shame anyone. It is an internal encouragement board. Higher scores simply mean a student has been more active across discoveries, badges, adventures, classes, and documentation.
        </p>
      </section>

      <section className="stack">
        {rows.map((row, index) => (
          <article key={row.studentId} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">#{index + 1}</p>
                <h3>{row.studentName}</h3>
                <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                  {row.householdName} • {row.currentRank}
                </p>
              </div>
              <span className="pill">{row.score} engagement points</span>
            </div>
            <div className="chip-list">
              <li>{row.badgesEarned} badges</li>
              <li>{row.discoveriesLogged} discoveries</li>
              <li>{row.completedAdventures} completed adventures</li>
              <li>{row.classAttendance} class attendance marks</li>
              <li>{row.documentationEntries} documentation entries</li>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
