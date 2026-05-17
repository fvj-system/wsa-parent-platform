import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFieldQuestDeleteButton } from "@/components/admin-field-quest-delete-button";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import {
  getFieldQuestLocationLabel,
  getFieldQuestSelect,
  normalizeFieldQuestChecklistItems,
  type FieldQuestRecord,
} from "@/lib/field-quests";

export default async function AdminFieldQuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const [{ data: quest }, { data: events }, { data: completions }] = await Promise.all([
    supabase
      .from("field_quests")
      .select(getFieldQuestSelect())
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("field_quest_events")
      .select("event_type")
      .eq("quest_id", id),
    supabase
      .from("field_quest_completions")
      .select("student_id, students:students(name), completed_at")
      .eq("quest_id", id)
      .order("completed_at", { ascending: false }),
  ]);

  if (!quest) {
    notFound();
  }

  const questRecord = quest as unknown as FieldQuestRecord;
  const eventCounts = (events ?? []).reduce<Record<string, number>>((acc, item) => {
    acc[item.event_type] = (acc[item.event_type] ?? 0) + 1;
    return acc;
  }, {});
  const linkedClass = questRecord.linked_class_id
    ? await supabase
        .from("classes")
        .select("id, title")
        .eq("id", questRecord.linked_class_id)
        .maybeSingle()
        .then((result) => (result.error ? null : result.data))
    : null;

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={questRecord.title}
      description="See the public mission, its analytics, and who has already saved it into the WSA learning record."
    >
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">{questRecord.status}</p>
            <h3>{questRecord.title}</h3>
          </div>
          <div className="cta-row">
            <Link className="button button-primary" href={`/admin/field-quests/${questRecord.id}/edit`}>
              Edit quest
            </Link>
            <Link className="button button-ghost" href={`/field-quests/${questRecord.slug}`} target="_blank">
              Open public page
            </Link>
          </div>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          {questRecord.description}
        </p>
        <ul className="chip-list">
          <li>{getFieldQuestLocationLabel(questRecord)}</li>
          <li>{questRecord.difficulty_level}</li>
          <li>{questRecord.estimated_time}</li>
          <li>Ages {questRecord.age_range}</li>
          <li>Badge: {questRecord.badge_name}</li>
        </ul>
      </section>

      <section className="stats-grid">
        <article className="stat"><span>Page views</span><strong>{eventCounts.page_view ?? 0}</strong></article>
        <article className="stat"><span>Starts</span><strong>{eventCounts.start ?? 0}</strong></article>
        <article className="stat"><span>Saved completions</span><strong>{(completions ?? []).length}</strong></article>
        <article className="stat"><span>Class clicks</span><strong>{eventCounts.class_click ?? 0}</strong></article>
        <article className="stat"><span>Signup clicks</span><strong>{eventCounts.signup_click ?? 0}</strong></article>
        <article className="stat"><span>Tracked signups</span><strong>{eventCounts.signup_completed ?? 0}</strong></article>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Mission structure</p>
            <h3>Checklist and growth hooks</h3>
          </div>
          <div className="chip-list">
            {questRecord.subject_tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </div>
          <ul className="stack" style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {normalizeFieldQuestChecklistItems(questRecord.checklist_json).map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {questRecord.clue_text || "No optional clue added."}
          </p>
          <div className="chip-list">
            <li>{questRecord.requires_photo ? "Requires photo" : "Photo optional"}</li>
            <li>{questRecord.requires_note ? "Requires note" : "Note optional"}</li>
            <li>{questRecord.is_backyard_friendly ? "Backyard friendly" : "Destination quest"}</li>
            {questRecord.is_park_quest ? <li>Park quest</li> : null}
            {questRecord.is_creek_water ? <li>Creek / water</li> : null}
            {questRecord.is_history ? <li>History</li> : null}
            {questRecord.is_animal ? <li>Animal</li> : null}
            {questRecord.is_easy_young_kids ? <li>Easy for young kids</li> : null}
          </div>
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Class connection</p>
            <h3>Join a WSA Class CTA</h3>
          </div>
          {linkedClass ? (
            <div className="stack">
              <p className="panel-copy" style={{ margin: 0 }}>
                Linked to {linkedClass.title}
              </p>
              <div className="cta-row">
                <Link className="button button-ghost" href={`/admin/classes/${linkedClass.id}`}>
                  Open class
                </Link>
              </div>
            </div>
          ) : (
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              No WSA class is attached to this quest yet.
            </p>
          )}

          <div>
            <p className="eyebrow">Quest completions</p>
            <h3>Students who saved this badge</h3>
          </div>
          {(completions ?? []).length ? (
            <div className="stack">
              {(completions ?? []).map((item, index) => {
                const row = item as { completed_at: string; students?: { name?: string } | Array<{ name?: string }> | null };
                const student = Array.isArray(row.students) ? row.students[0] : row.students;
                return (
                  <article className="note-card" key={`${student?.name ?? "student"}-${index}`}>
                    <div className="copy">
                      <h4>{student?.name ?? "Student"}</h4>
                      <p className="muted" style={{ margin: "8px 0 0" }}>
                        Saved {new Date(row.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              No saved completions yet.
            </p>
          )}
        </section>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Danger zone</p>
          <h3>Delete this quest</h3>
        </div>
        <p className="panel-copy" style={{ marginBottom: 0 }}>
          Deleting removes the public quest and its quest-specific analytics history. Student activity and earned badges already written into broader WSA records remain intact.
        </p>
        <AdminFieldQuestDeleteButton questId={questRecord.id} questTitle={questRecord.title} />
      </section>
    </AdminShell>
  );
}
