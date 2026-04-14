import Link from "next/link";
import { BadgeCard } from "@/components/badge-card";
import { HomeschoolReviewBuilder } from "@/components/homeschool-review-builder";
import { PortfolioNoteForm } from "@/components/portfolio-note-form";
import { PortfolioEntryForm } from "@/components/portfolio-entry-form";
import { PortfolioSummaryControls } from "@/components/portfolio-summary-controls";
import { PrintButton } from "@/components/print-button";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import type { StudentAchievementRecord, StudentBadgeRecord } from "@/lib/badges";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { generationKindLabel, type GenerationRecord } from "@/lib/generations";
import {
  getPortfolioEvidenceLabel,
  type PortfolioEntryRecord,
  type ReviewEvidenceItem
} from "@/lib/homeschool-review";
import {
  type PortfolioNoteRecord,
  type PortfolioRange,
  filterPortfolioGenerations,
  formatDateLabel,
  getCompletionLabel,
  groupCompletedGenerations,
  summarizePortfolioNarrative
} from "@/lib/portfolio";
import type { StudentRecord } from "@/lib/students";

type PortfolioStudentViewProps = {
  student: StudentRecord;
  range: PortfolioRange;
  completions: ActivityCompletionRecord[];
  linkedGenerations: GenerationRecord[];
  completionGenerations: GenerationRecord[];
  classBookings: Array<ClassBookingRecord & { classes?: ClassRecord | null }>;
  badges: StudentBadgeRecord[];
  achievements: StudentAchievementRecord[];
  notes: PortfolioNoteRecord[];
  documentationEntries: Array<PortfolioEntryRecord & { resolvedImageUrl: string | null; resolvedImageAlt: string }>;
  reviewEvidenceItems: ReviewEvidenceItem[];
};

function SectionList({
  title,
  items,
  emptyMessage
}: {
  title: string;
  items: Array<{ id: string; title: string; meta: string }>;
  emptyMessage: string;
}) {
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Portfolio record</p>
        <h3>{title}</h3>
      </div>
      {items.length ? (
        <div className="stack">
          {items.map((item) => (
            <article className="note-card" key={item.id}>
              <div className="copy">
                <h4>{item.title}</h4>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  {item.meta}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-copy">{emptyMessage}</p>
      )}
    </section>
  );
}

export function PortfolioStudentView({
  student,
  range,
  completions,
  linkedGenerations,
  completionGenerations,
  classBookings,
  badges,
  achievements,
  notes,
  documentationEntries,
  reviewEvidenceItems,
}: PortfolioStudentViewProps) {
  const groupedGenerations = groupCompletedGenerations(completions, completionGenerations);
  const savedGenerations = filterPortfolioGenerations(linkedGenerations, completions, range);
  const narrative = summarizePortfolioNarrative({
    student,
    range,
    completions,
    linkedGenerations: savedGenerations,
    badges,
    achievements,
    classBookings
  });

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Homeschool review packet</p>
            <h2 style={{ margin: 0 }}>{student.name}</h2>
            <p className="panel-copy" style={{ margin: "10px 0 0" }}>
              Age {student.age} • {student.current_rank} rank • {student.completed_adventures_count} completed adventures
            </p>
          </div>
          <div className="nav-actions print-hide">
            <Link className="button button-ghost" href={`/students/${student.id}`}>
              Back to student dashboard
            </Link>
            <PrintButton label="Print homeschool review" />
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat">
            <span>Completed activities</span>
            <strong>{completions.length}</strong>
          </article>
          <article className="stat">
            <span>Badges earned</span>
            <strong>{badges.length}</strong>
          </article>
          <article className="stat">
            <span>Classes attended</span>
            <strong>{classBookings.length}</strong>
          </article>
          <article className="stat">
            <span>Reporting period</span>
            <strong>{range.key === "custom" ? "Custom" : range.key.toUpperCase()}</strong>
          </article>
        </div>
      </section>

      <PortfolioSummaryControls range={range.key} startDate={range.startDate} endDate={range.endDate} />

      <section className="panel stack print-hide">
        <div>
          <p className="eyebrow">Documentation evidence</p>
          <h3>Add homeschool proof to this student record</h3>
          <p className="panel-copy">
            Use this log for projects, worksheets, classes, field trips, landmarks, discoveries, and other educational evidence tied to photo documentation.
          </p>
        </div>
        <PortfolioEntryForm studentId={student.id} studentName={student.name} />
      </section>

      <HomeschoolReviewBuilder
        studentName={student.name}
        studentId={student.id}
        rangeLabel={range.label}
        startDate={range.startDate}
        endDate={range.endDate}
        evidenceItems={reviewEvidenceItems}
        parentNotes={notes.map((note) => note.note)}
      />

      <section className="panel stack print-sheet">
        <div>
          <p className="eyebrow">Educational significance</p>
          <h3>Learning story for {range.label}</h3>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {narrative}
          </p>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Evidence log</p>
          <h3>Documented homeschool entries</h3>
          <p className="panel-copy">
            These entries are the picture-backed proof layer for projects, field trips, worksheets, classes, and nature documentation.
          </p>
        </div>
        {documentationEntries.length ? (
          <div className="content-grid">
            {documentationEntries.map((entry) => (
              <article className="note-card homeschool-evidence-card" key={entry.id}>
                {entry.resolvedImageUrl ? (
                  <img
                    src={entry.resolvedImageUrl}
                    alt={entry.resolvedImageAlt}
                  />
                ) : null}
                <div className="copy">
                  <div className="field-guide-meta-row">
                    <span className="badge">{getPortfolioEvidenceLabel(entry.entry_type)}</span>
                    <span className="muted">
                      {formatDateLabel(entry.occurred_at.slice(0, 10))}
                    </span>
                  </div>
                  <h4>{entry.title}</h4>
                  {entry.summary ? (
                    <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                      {entry.summary}
                    </p>
                  ) : null}
                  {entry.parent_note ? (
                    <p className="muted" style={{ margin: "10px 0 0" }}>
                      Note: {entry.parent_note}
                    </p>
                  ) : null}
                  <p className="muted" style={{ margin: "10px 0 0" }}>
                    {entry.student_id ? "Student entry" : "Household evidence entry"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="panel-copy">No extra homeschool evidence entries were saved in this period yet.</p>
        )}
      </section>

      <SectionList
        title="Completed activities"
        items={completions.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${getCompletionLabel(item.activity_type)} • ${formatDateLabel(item.completed_at.slice(0, 10))}${item.parent_rating ? ` • Parent rating ${item.parent_rating}/5` : ""}`
        }))}
        emptyMessage="No completed activities were logged in this period."
      />

      <SectionList
        title="Daily adventures"
        items={groupedGenerations.dailyAdventures.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${generationKindLabel(item.tool_type)} • ${formatDateLabel(item.created_at.slice(0, 10))}`
        }))}
        emptyMessage="No daily adventures were completed in this period."
      />

      <SectionList
        title="Animal studies"
        items={groupedGenerations.animalStudies.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${generationKindLabel(item.tool_type)} • ${formatDateLabel(item.created_at.slice(0, 10))}`
        }))}
        emptyMessage="No animal studies were completed in this period."
      />

      <SectionList
        title="Lessons completed"
        items={groupedGenerations.lessons.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${generationKindLabel(item.tool_type)} • ${formatDateLabel(item.created_at.slice(0, 10))}`
        }))}
        emptyMessage="No completed lessons were recorded in this period."
      />

      <SectionList
        title="Week plans completed"
        items={groupedGenerations.weekPlans.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${generationKindLabel(item.tool_type)} • ${formatDateLabel(item.created_at.slice(0, 10))}`
        }))}
        emptyMessage="No completed week plans were recorded in this period."
      />

      <SectionList
        title="In-person classes attended"
        items={classBookings.map((item) => ({
          id: item.id,
          title: item.classes?.title ?? "In-person class",
          meta: `${item.classes?.location ?? "Location TBD"} • ${item.classes?.date ? formatDateLabel(item.classes.date) : formatDateLabel(item.booked_at.slice(0, 10))}`
        }))}
        emptyMessage="No attended classes were recorded in this period."
      />

      <SectionList
        title="Saved linked generations"
        items={savedGenerations.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `${generationKindLabel(item.tool_type)} • saved ${formatDateLabel(item.created_at.slice(0, 10))}`
        }))}
        emptyMessage="No extra linked generations were intentionally saved in this period."
      />

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Badges and achievements</p>
            <h3>Earned during this period</h3>
          </div>
        </div>
        {badges.length || achievements.length ? (
          <div className="content-grid">
            {badges.map((item) =>
              item.badges ? <BadgeCard key={item.id} badge={item.badges} earnedAt={item.earned_at} /> : null
            )}
            {achievements.map((item) =>
              item.achievements ? (
                <article className="note-card" key={item.id}>
                  <div className="copy">
                    <h4>{item.achievements.name}</h4>
                    <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                      {item.achievements.description}
                    </p>
                    <p className="muted" style={{ margin: "10px 0 0" }}>
                      Earned {formatDateLabel(item.earned_at.slice(0, 10))}
                    </p>
                  </div>
                </article>
              ) : null
            )}
          </div>
        ) : (
          <p className="panel-copy">No badges or achievements were earned in this period.</p>
        )}
      </section>

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Parent notes</p>
            <h3>Reflections and observations</h3>
          </div>
        </div>
        <PortfolioNoteForm studentId={student.id} />
        {notes.length ? (
          <div className="stack">
            {notes.map((note) => (
              <article className="note-card" key={note.id}>
                <div className="copy">
                  <p className="panel-copy" style={{ margin: 0 }}>
                    {note.note}
                  </p>
                  <p className="muted" style={{ margin: "10px 0 0" }}>
                    Added {formatDateLabel(note.created_at.slice(0, 10))}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="panel-copy">No parent notes yet for this reporting period.</p>
        )}
      </section>
    </div>
  );
}
