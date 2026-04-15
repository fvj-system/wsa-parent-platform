import Link from "next/link";
import { MarkCompleteCard } from "@/components/mark-complete-card";
import { getGenerationInput, getGenerationOutput, type GenerationRecord } from "@/lib/generations";
import { getRankProgress, type StudentRecord } from "@/lib/students";

type DashboardTodayNextStepProps = {
  students: StudentRecord[];
  activeStudent: StudentRecord | null;
  todayAdventure: GenerationRecord | null;
  todayAdventureCompleted: boolean;
  recentCompletedLabel?: string;
};

function CompassIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 15l2.2-6.2L17 7l-2 5.8L9 15Z" />
    </svg>
  );
}

export function DashboardTodayNextStep({
  students,
  activeStudent,
  todayAdventure,
  todayAdventureCompleted,
  recentCompletedLabel
}: DashboardTodayNextStepProps) {
  if (!students.length) {
    return (
      <section className="panel stack dashboard-command-center">
        <div className="field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <CompassIcon />
            </span>
            <div>
              <p className="eyebrow">Today&apos;s field briefing</p>
              <h3>Start by adding your first student</h3>
            </div>
          </div>
        </div>
        <div className="field-empty-state">
          <div className="copy">
            <h4>No student context yet</h4>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Add the first child profile so Wild Stallion Academy can connect adventures, progress, badges, and classes to a real learning trail.
            </p>
          </div>
        </div>
        <div className="cta-row">
          <Link className="button button-primary button-strong" href="/students">
            Add your first student
          </Link>
          <Link className="button button-ghost" href="/classes">
            Browse classes
          </Link>
        </div>
      </section>
    );
  }

  const studentInput = todayAdventure ? ((getGenerationInput(todayAdventure) ?? {}) as Record<string, unknown>) : {};
  const output = todayAdventure ? ((getGenerationOutput(todayAdventure) ?? {}) as Record<string, unknown>) : {};
  const displayedStudentName =
    activeStudent?.name ??
    (typeof studentInput.studentName === "string" ? studentInput.studentName : "") ??
    "Your student";
  const rankProgress = activeStudent ? getRankProgress(activeStudent.completed_adventures_count) : null;

  let statusLabel = "Not started";
  let statusCopy = "Generate today&apos;s adventure to anchor the homeschool day with one clear mission.";
  if (todayAdventure && !todayAdventureCompleted) {
    statusLabel = "Ready to go";
    statusCopy = "Today&apos;s mission is already prepared. Open it, print it, or mark it complete after you head outside.";
  }

  if (todayAdventureCompleted) {
    statusLabel = "Completed today";
    statusCopy = "Today&apos;s adventure has already been logged. You can print it, revisit it, or plan the next one.";
  }

  return (
    <section className="panel stack dashboard-command-center">
      <div className="header-row field-section-header">
        <div className="field-section-heading">
          <span className="field-guide-icon-disc">
            <CompassIcon />
          </span>
            <div>
            <p className="eyebrow">Today&apos;s field briefing</p>
            <h3>{displayedStudentName}&apos;s next expedition step</h3>
          </div>
        </div>
        <span className="badge">{statusLabel}</span>
      </div>

      {students.length > 1 ? (
        <div className="student-switcher">
          {students.map((student) => (
            <Link
              key={student.id}
              className={`student-switcher-pill ${activeStudent?.id === student.id ? "student-switcher-pill-active" : ""}`}
              href={`/dashboard?student=${student.id}`}
            >
              {student.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="dashboard-command-grid">
        <div className="specimen-card dashboard-command-main">
          <div className="stack">
            <div className="field-guide-meta-row">
              <span className="pill">{activeStudent?.current_rank ?? "Colt"}</span>
              {activeStudent ? <span className="pill">{activeStudent.completed_adventures_count} completed adventures</span> : null}
            </div>
            <h4>{todayAdventure ? todayAdventure.title : "No daily adventure generated yet"}</h4>
            <p className="panel-copy" style={{ margin: 0 }}>
              {statusCopy}
            </p>
            {todayAdventure ? (
              <p className="panel-copy" style={{ margin: 0 }}>
                {typeof output.challengeActivity === "string"
                  ? output.challengeActivity
                  : "Open today&apos;s adventure to see the observation mission, question, and family challenge."}
              </p>
            ) : null}
          </div>
          <div className="cta-row">
            {todayAdventure ? (
              <Link className="button button-ghost" href={`/generations/${todayAdventure.id}?print=1`}>
                Print
              </Link>
            ) : null}
          </div>
          {todayAdventure && !todayAdventureCompleted ? (
            <MarkCompleteCard studentId={todayAdventure.student_id} generationId={todayAdventure.id} compact />
          ) : null}
        </div>

        <aside className="stack">
          <article className="trail-note trail-note-framed">
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Explorer focus
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              {activeStudent
                ? `${activeStudent.name} is currently a ${activeStudent.current_rank}. ${
                    rankProgress?.nextRank
                      ? `${rankProgress.totalNeededForNextRank! - rankProgress.completedInRank} more completed adventures unlock ${rankProgress.nextRank}.`
                      : "Top rank reached."
                  }`
                : "Choose a student to make today&apos;s plan more personal."}
            </p>
          </article>

          <article className="trail-note trail-note-framed">
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Recent fieldwork
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              {recentCompletedLabel || "Nothing has been marked complete yet. Logging finished activities helps ranks and badges move."}
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}
