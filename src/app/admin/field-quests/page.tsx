import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getFieldQuestLocationLabel, getFieldQuestSelect, type FieldQuestRecord } from "@/lib/field-quests";

export default async function AdminFieldQuestsPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: quests }, { data: completions }, { data: events }] = await Promise.all([
    supabase
      .from("field_quests")
      .select(getFieldQuestSelect())
      .order("updated_at", { ascending: false }),
    supabase
      .from("field_quest_completions")
      .select("quest_id"),
    supabase
      .from("field_quest_events")
      .select("quest_id, event_type"),
  ]);

  const rows = (quests ?? []) as unknown as FieldQuestRecord[];
  const completionCounts = new Map<string, number>();
  for (const item of completions ?? []) {
    completionCounts.set(item.quest_id, (completionCounts.get(item.quest_id) ?? 0) + 1);
  }

  const eventCounts = new Map<string, Record<string, number>>();
  for (const item of events ?? []) {
    const current = eventCounts.get(item.quest_id) ?? {};
    current[item.event_type] = (current[item.event_type] ?? 0) + 1;
    eventCounts.set(item.quest_id, current);
  }

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Field Quests"
      description="Create public missions that drive signups, badge saves, homeschool documentation, and class interest."
    >
      <section className="stats-grid">
        <article className="stat"><span>Published</span><strong>{rows.filter((item) => item.status === "published").length}</strong></article>
        <article className="stat"><span>Page views</span><strong>{rows.reduce((sum, item) => sum + (eventCounts.get(item.id)?.page_view ?? 0), 0)}</strong></article>
        <article className="stat"><span>Starts</span><strong>{rows.reduce((sum, item) => sum + (eventCounts.get(item.id)?.start ?? 0), 0)}</strong></article>
        <article className="stat"><span>Saved completions</span><strong>{rows.reduce((sum, item) => sum + (completionCounts.get(item.id) ?? 0), 0)}</strong></article>
      </section>

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Mission builder</p>
            <h3>Public quest catalog</h3>
          </div>
          <Link className="button button-primary" href="/admin/field-quests/new">
            Create Field Quest
          </Link>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          These quests are public-facing growth pages. Families can discover them from Facebook, complete them with a student, earn a badge, and move toward WSA classes.
        </p>
      </section>

      <section className="stack">
        {rows.map((quest) => {
          const analytics = eventCounts.get(quest.id) ?? {};
          return (
            <article className="panel stack" key={quest.id}>
              <div className="header-row">
                <div>
                  <p className="eyebrow">{quest.status}</p>
                  <h3>{quest.title}</h3>
                </div>
                <span className="pill">{quest.difficulty_level}</span>
              </div>
              <p className="panel-copy" style={{ margin: 0 }}>
                {quest.short_description}
              </p>
              <ul className="chip-list">
                <li>{getFieldQuestLocationLabel(quest)}</li>
                <li>{quest.estimated_time}</li>
                <li>Ages {quest.age_range}</li>
                <li>Badge: {quest.badge_name}</li>
              </ul>
              <div className="chip-list">
                <li>{analytics.page_view ?? 0} views</li>
                <li>{analytics.start ?? 0} starts</li>
                <li>{completionCounts.get(quest.id) ?? 0} saved completions</li>
                <li>{analytics.signup_click ?? 0} signup clicks</li>
                <li>{analytics.signup_completed ?? 0} tracked signups</li>
                <li>{analytics.class_click ?? 0} class clicks</li>
              </div>
              <div className="cta-row">
                <Link className="button button-primary" href={`/admin/field-quests/${quest.id}`}>
                  View
                </Link>
                <Link className="button button-ghost" href={`/field-quests/${quest.slug}`} target="_blank">
                  Open public page
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
}
