"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BuckStallionNote } from "@/components/buck-stallion-note";
import { HistoryList } from "@/components/history-list";
import { PrintButton } from "@/components/print-button";
import type { GenerationRecord, WeekPlannerOutput } from "@/lib/generations";
import type { StudentRecord } from "@/lib/students";

type WeekPlannerGeneratorProps = {
  initialHistory: GenerationRecord[];
  students: StudentRecord[];
};

type WeekPlannerResponse = {
  generation: GenerationRecord;
  output: WeekPlannerOutput;
};

type WeekPlannerPrintContext = {
  planningMode: "student" | "family";
  learnerNames: string[];
  focusArea: string;
  daysPerWeek: number;
  preferredLessonLength: string;
  settingPreference: string;
  locationLabel: string;
};

export function WeekPlannerGenerator({ initialHistory, students }: WeekPlannerGeneratorProps) {
  const [history, setHistory] = useState(initialHistory);
  const [result, setResult] = useState<WeekPlannerOutput | null>(null);
  const [printContext, setPrintContext] = useState<WeekPlannerPrintContext | null>(null);
  const [error, setError] = useState("");
  const [planningMode, setPlanningMode] = useState<"student" | "family">(students.length > 1 ? "family" : "student");
  const [selectedIds, setSelectedIds] = useState<string[]>(students[0] ? [students[0].id] : []);
  const [isPending, startTransition] = useTransition();

  const selectedStudents = students.filter((student) => selectedIds.includes(student.id));
  const familyMode = planningMode === "family";

  return (
    <section className="content-grid">
      <article className="panel stack planner-panel print-hide">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Parent planning</p>
            <h3>Build the week's family rhythm</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Your students are already loaded, so this page can stay focused on the real parent job: shaping one calm, usable week.
            </p>
          </div>
        </div>

        <BuckStallionNote
          compact
          title="Start with the family rhythm, then personalize."
          body="Use Family Week for the shared backbone first. Once that looks right, student pages and daily briefings can carry the age-specific detail."
        />

        <div className="planner-command-links">
          <Link className="button button-ghost" href="/discover/catalog">
            Household Creature Log
          </Link>
          <Link className="button button-ghost" href="/students">
            Student Profiles
          </Link>
          <Link className="button button-ghost" href="/portfolio">
            Homeschool Review
          </Link>
        </div>

        <div className="planner-mode-bar">
          <button
            className={`student-switcher-pill ${!familyMode ? "student-switcher-pill-active" : ""}`}
            type="button"
            onClick={() => {
              setPlanningMode("student");
              setSelectedIds((current) => (current[0] ? [current[0]] : students[0] ? [students[0].id] : []));
            }}
          >
            Student Week
          </button>
          <button
            className={`student-switcher-pill ${familyMode ? "student-switcher-pill-active" : ""}`}
            type="button"
            onClick={() => {
              setPlanningMode("family");
              setSelectedIds(students.map((student) => student.id));
            }}
          >
            Family Week
          </button>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            const form = event.currentTarget;
            const formData = new FormData(form);
            const plannerStudents = students.filter((student) => selectedIds.includes(student.id));

            if (!plannerStudents.length) {
              setError("Choose at least one student before generating a week plan.");
              return;
            }

            startTransition(async () => {
              const focusArea = String(formData.get("focusArea") || "");
              const daysPerWeek = Number(formData.get("daysPerWeek") || 5);
              const preferredLessonLength = String(formData.get("preferredLessonLength") || "");
              const interests = String(formData.get("interests") || "");
              const settingPreference = String(formData.get("settingPreference") || "");
              const locationLabel = String(formData.get("locationLabel") || "Southern Maryland");
              const response = await fetch("/api/generate-week-plan", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  planningMode,
                  childAge: familyMode ? undefined : plannerStudents[0]?.age,
                  selectedStudentIds: plannerStudents.map((student) => student.id),
                  selectedStudentNames: plannerStudents.map((student) => student.name),
                  selectedStudentAges: plannerStudents.map((student) => student.age),
                  focusArea,
                  daysPerWeek,
                  preferredLessonLength,
                  interests,
                  settingPreference,
                  locationLabel
                })
              });

              const payload = (await response.json()) as WeekPlannerResponse | { error: string };

              if (!response.ok || "error" in payload) {
                setError("error" in payload ? payload.error : "Week planner generation failed.");
                return;
              }

              setResult(payload.output);
              setPrintContext({
                planningMode,
                learnerNames: plannerStudents.map((student) => student.name),
                focusArea,
                daysPerWeek,
                preferredLessonLength,
                settingPreference,
                locationLabel,
              });
              setHistory((current) => [payload.generation, ...current]);
            });
          }}
        >
          <section className="planner-student-panel">
            <div className="header-row">
              <div>
                <h4>{familyMode ? "Family Week learners" : "Student Week learner"}</h4>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  {familyMode
                    ? "Pick the children you want included in one shared weekly plan for outings, lessons, and logistics."
                    : "Choose the student whose age and interests should shape the whole week."}
                </p>
              </div>
              {students.length ? (
                <button
                  className="button button-ghost"
                  type="button"
                  onClick={() => setSelectedIds(students.map((student) => student.id))}
                >
                  Whole family
                </button>
              ) : null}
            </div>
            {students.length ? (
              <div className="planner-student-grid">
                {students.map((student) => {
                  const selected = selectedIds.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      className={`planner-student-card ${selected ? "planner-student-card-active" : ""}`}
                      type="button"
                      onClick={() => {
                        if (familyMode) {
                          setSelectedIds((current) =>
                            current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id]
                          );
                        } else {
                          setSelectedIds([student.id]);
                        }
                      }}
                    >
                      <strong>{student.name}</strong>
                      <span>Age {student.age}</span>
                      <span>{student.interests.slice(0, 2).join(", ") || "General nature study"}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="field-empty-state">
                <div className="copy">
                  <h4>No students added yet</h4>
                  <p className="panel-copy" style={{ marginBottom: 0 }}>
                    Add a student first if you want age-aware week plans. You can still build a broad family plan later.
                  </p>
                </div>
              </div>
            )}
          </section>

          <div className="planner-summary-strip">
            <strong>{familyMode ? "Family Week" : "Student Week"}</strong>
            <span>
              {selectedStudents.length
                ? selectedStudents.map((student) => student.name).join(", ")
                : "No students selected yet"}
            </span>
          </div>

          <label>
            Focus area
            <input name="focusArea" placeholder="pond life, early American history, forest ecology" required />
          </label>
          <label>
            Days per week
            <input name="daysPerWeek" type="number" min={1} max={7} defaultValue={5} required />
          </label>
          <label>
            Preferred lesson length
            <input name="preferredLessonLength" placeholder="30-45 minutes" defaultValue="30-45 minutes" required />
          </label>
          <label>
            Interests
            <input
              name="interests"
              placeholder="animals, drawing, hikes, local history, hands-on projects"
              defaultValue={selectedStudents.flatMap((student) => student.interests).slice(0, 6).join(", ")}
              required
            />
          </label>
          <label>
            Setting preference
            <select name="settingPreference" defaultValue="mixed indoor and outdoor">
              <option value="mostly outdoor">Mostly outdoor</option>
              <option value="mixed indoor and outdoor">Mixed indoor and outdoor</option>
              <option value="mostly indoor">Mostly indoor</option>
            </select>
          </label>
          <label>
            Home region
            <input name="locationLabel" defaultValue="Southern Maryland" required />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Planning..." : familyMode ? "Generate family week" : "Generate student week"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </article>

      <article className="panel stack planner-result-panel print-sheet week-planner-print-sheet">
        <div className="header-row">
          <div>
            <p className="eyebrow">This week's plan</p>
            <h3>{result ? "Parent-ready weekly overview" : "No plan generated yet"}</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              {result
                ? "Use this as the shared weekly backbone, then let Today and each student profile carry the day-by-day detail."
                : "Your generated weekly plan will appear here after you submit the planner."}
            </p>
          </div>
          {result ? <PrintButton label="Print weekly planner" /> : null}
        </div>

        {result ? (
          <>
            <div className="stack print-hide">
              {printContext ? (
                <section className="week-planner-print-context">
                  <h4>Plan setup</h4>
                  <div className="week-planner-print-meta">
                    <p>
                      <strong>Plan type:</strong>{" "}
                      {printContext.planningMode === "family" ? "Family Week" : "Student Week"}
                    </p>
                    <p>
                      <strong>Learners:</strong> {printContext.learnerNames.join(", ")}
                    </p>
                    <p>
                      <strong>Focus area:</strong> {printContext.focusArea}
                    </p>
                    <p>
                      <strong>Home region:</strong> {printContext.locationLabel}
                    </p>
                    <p>
                      <strong>Days per week:</strong> {printContext.daysPerWeek}
                    </p>
                    <p>
                      <strong>Lesson length:</strong> {printContext.preferredLessonLength}
                    </p>
                    <p>
                      <strong>Setting preference:</strong> {printContext.settingPreference}
                    </p>
                  </div>
                </section>
              ) : null}

              <section>
                <h4>This Week at a Glance</h4>
                <p>{result.weeklyOverview}</p>
              </section>

              <section>
                <h4>Daily family rhythm</h4>
                <div className="stack">
                  {result.dailyPlan.map((day) => (
                    <article className="note-card" key={day.dayLabel}>
                      <div className="copy">
                        <h4>{day.dayLabel}</h4>
                        <p className="muted">{day.focus}</p>
                        <ul className="result-list">
                          {day.activities.map((activity) => (
                            <li key={activity}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h4>Outings and field ideas</h4>
                <ul className="result-list">
                  {result.suggestedFieldTrips.map((trip) => (
                    <li key={trip}>{trip}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h4>Parent prep list</h4>
                <ul className="result-list">
                  {result.materialsList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h4>Parent notes</h4>
                <p>{result.parentNotes}</p>
              </section>

              {result.printableSummary ? (
                <section>
                  <h4>Printable summary</h4>
                  <p>{result.printableSummary}</p>
                </section>
              ) : null}
            </div>

            <div className="week-planner-print-document print-only">
              {printContext ? (
                <section className="week-planner-print-block">
                  <h2>Plan setup</h2>
                  <div className="week-planner-print-meta">
                    <p>
                      <strong>Plan type:</strong>{" "}
                      {printContext.planningMode === "family" ? "Family Week" : "Student Week"}
                    </p>
                    <p>
                      <strong>Learners:</strong> {printContext.learnerNames.join(", ")}
                    </p>
                    <p>
                      <strong>Focus area:</strong> {printContext.focusArea}
                    </p>
                    <p>
                      <strong>Home region:</strong> {printContext.locationLabel}
                    </p>
                    <p>
                      <strong>Days per week:</strong> {printContext.daysPerWeek}
                    </p>
                    <p>
                      <strong>Lesson length:</strong> {printContext.preferredLessonLength}
                    </p>
                    <p>
                      <strong>Setting preference:</strong> {printContext.settingPreference}
                    </p>
                  </div>
                </section>
              ) : null}

              <section className="week-planner-print-block">
                <h2>Weekly overview</h2>
                <p>{result.weeklyOverview}</p>
              </section>

              <section className="week-planner-print-block">
                <h2>Daily rhythm / plan</h2>
                <div className="week-planner-print-days">
                  {result.dailyPlan.map((day) => (
                    <article className="week-planner-print-day" key={day.dayLabel}>
                      <h3>{day.dayLabel}</h3>
                      <p className="week-planner-print-focus">{day.focus}</p>
                      <ul>
                        {day.activities.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

              <section className="week-planner-print-block">
                <h2>Outings and field ideas</h2>
                <ul>
                  {result.suggestedFieldTrips.map((trip) => (
                    <li key={trip}>{trip}</li>
                  ))}
                </ul>
              </section>

              <section className="week-planner-print-block">
                <h2>Parent prep list</h2>
                <ul>
                  {result.materialsList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="week-planner-print-block">
                <h2>Parent notes</h2>
                <p>{result.parentNotes}</p>
              </section>

              {result.printableSummary ? (
                <section className="week-planner-print-block">
                  <h2>Printable summary</h2>
                  <p>{result.printableSummary}</p>
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </article>

      <article className="panel stack planner-history-panel print-hide" style={{ gridColumn: "1 / -1" }}>
        <div>
          <p className="eyebrow">History</p>
          <h3>Recent week planners</h3>
        </div>
        <HistoryList items={history} emptyMessage="Week planners will appear here after the first successful run." />
      </article>
    </section>
  );
}
