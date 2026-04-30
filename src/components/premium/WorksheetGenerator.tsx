"use client";

import { useMemo, useState, useTransition } from "react";
import type { PremiumStudent, WorksheetPayload } from "@/lib/premium/types";
import { formatPremiumStudentName } from "@/lib/premium/data";
import { getWorksheetCurriculumOverview } from "@/lib/premium/worksheet-curriculum";

type WorksheetGeneratorProps = {
  students: PremiumStudent[];
  activeStudentId?: string | null;
  recentWorksheets: Array<Record<string, unknown>>;
};

export function WorksheetGenerator({ students, activeStudentId, recentWorksheets }: WorksheetGeneratorProps) {
  const [studentId, setStudentId] = useState(activeStudentId ?? students[0]?.id ?? "");
  const [subject, setSubject] = useState("English");
  const [difficulty, setDifficulty] = useState("on_level");
  const [questionCount, setQuestionCount] = useState("6");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [worksheet, setWorksheet] = useState<WorksheetPayload | null>(null);
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? students[0],
    [studentId, students],
  );

  const curriculum = useMemo(() => getWorksheetCurriculumOverview(subject), [subject]);
  const recentSubjectCount = useMemo(
    () => recentWorksheets.filter((item) => String(item.subject ?? "") === subject).length,
    [recentWorksheets, subject],
  );
  const predictedLessonNumber = (recentSubjectCount % curriculum.lessonCount) + 1;

  async function createWorksheet() {
    if (!selectedStudent) return;

    setError("");
    setWarning("");
    const response = await fetch("/api/ai/generate-worksheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: selectedStudent.id,
        student_name: formatPremiumStudentName(selectedStudent),
        subject,
        grade_level: selectedStudent.grade_level ?? "3",
        reading_level: selectedStudent.reading_level ?? "early_reader",
        math_level: selectedStudent.math_level ?? "addition_subtraction",
        difficulty,
        number_of_questions: Number(questionCount),
        include_answer_key: includeAnswerKey,
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      warning?: string | null;
      worksheet?: WorksheetPayload;
      worksheet_id?: string;
    };

    if (!response.ok || !result.worksheet || !result.worksheet_id) {
      setError(result.error ?? "Unable to create worksheet.");
      return;
    }

    setWorksheet(result.worksheet);
    setWorksheetId(result.worksheet_id);
    setWarning(result.warning ?? "");
  }

  return (
    <section className="content-grid">
      <section className="panel stack">
        <div>
          <p className="eyebrow">Curriculum Worksheets</p>
          <h3>Generate the next lesson in a real learning path</h3>
          <p className="panel-copy" style={{ margin: 0 }}>
            Each worksheet now follows a sequenced subject track with an objective, mini lesson, vocabulary, and a fun mission.
          </p>
        </div>

        <div className="premium-form-grid">
          <label>
            Student
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {formatPremiumStudentName(student)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subject path
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>English</option>
              <option>Mathematics</option>
              <option>Science</option>
              <option>Social Studies</option>
              <option>Art</option>
              <option>Music</option>
              <option>Health</option>
              <option>Physical Education</option>
            </select>
          </label>
          <label>
            Support level
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="supported">Supported</option>
              <option value="on_level">On level</option>
              <option value="stretch">Stretch</option>
            </select>
          </label>
          <label>
            Question count
            <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}>
              <option value="6">6 questions</option>
              <option value="7">7 questions</option>
              <option value="8">8 questions</option>
            </select>
          </label>
          <label className="classes-waiver-toggle">
            <input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} />
            <span>Include answer key</span>
          </label>
        </div>

        <article className="premium-inline-card premium-curriculum-card">
          <div className="header-row">
            <div>
              <strong>{curriculum.title}</strong>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {curriculum.unitTitle}
              </p>
            </div>
            <span className="premium-status-pill premium-status-covered">
              Lesson {predictedLessonNumber} of {curriculum.lessonCount}
            </span>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            {curriculum.description}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Fun angle: {curriculum.funTheme}
          </p>
          <div className="premium-checklist">
            {curriculum.skills.map((skill) => (
              <span key={skill} className="premium-checkbox-card">
                {skill}
              </span>
            ))}
          </div>
        </article>

        <div className="cta-row">
          <button
            type="button"
            disabled={isPending || !selectedStudent}
            onClick={() => {
              startTransition(() => {
                void createWorksheet();
              });
            }}
          >
            {isPending ? "Building lesson..." : "Generate Next Worksheet"}
          </button>
          {worksheetId ? (
            <a className="button button-ghost" href={`/dashboard/premium/worksheets/${worksheetId}`}>
              Print
            </a>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {warning ? <p className="success">{warning}</p> : null}
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Recent worksheets</p>
          <h3>Saved lesson pages</h3>
        </div>
        <div className="stack">
          {recentWorksheets.length ? (
            recentWorksheets.map((item) => (
              <article key={String(item.id)} className="premium-inline-card">
                <strong>{String(item.topic ?? item.subject ?? "Worksheet")}</strong>
                <span>{String(item.subject ?? "")}</span>
                <a href={`/dashboard/premium/worksheets/${String(item.id)}`}>Open printable</a>
              </article>
            ))
          ) : (
            <p className="panel-copy" style={{ margin: 0 }}>
              No worksheets saved yet.
            </p>
          )}
        </div>
      </section>

      <section className="panel stack premium-wide-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="header-row">
          <div>
            <p className="eyebrow">Worksheet preview</p>
            <h3>{worksheet?.title ?? "Your curriculum worksheet will appear here"}</h3>
          </div>
          {worksheet?.lesson_number && worksheet?.total_lessons ? (
            <span className="badge">
              Lesson {worksheet.lesson_number} of {worksheet.total_lessons}
            </span>
          ) : null}
        </div>

        {worksheet ? (
          <div className="stack">
            <article className="premium-inline-card premium-curriculum-card">
              <strong>{worksheet.track_title}</strong>
              {worksheet.learning_objective ? <p className="panel-copy" style={{ margin: 0 }}>Objective: {worksheet.learning_objective}</p> : null}
              {worksheet.essential_question ? <p className="muted" style={{ margin: 0 }}>Essential question: {worksheet.essential_question}</p> : null}
            </article>

            {worksheet.sections?.length ? (
              <div className="premium-subject-grid">
                {worksheet.sections.map((section) => (
                  <article key={`${section.kind}-${section.title}`} className="premium-inline-card">
                    <strong>{section.title}</strong>
                    <p className="panel-copy" style={{ margin: 0 }}>{section.body}</p>
                    {section.bullets?.length ? (
                      <ul className="premium-list">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            <div className="stack">
              {worksheet.questions.map((question) => (
                <article key={question.number} className="premium-inline-card">
                  <strong>
                    {question.number}. {question.prompt}
                  </strong>
                  {question.choices?.length ? <span>{question.choices.join(" | ")}</span> : null}
                  {question.hint ? <span className="muted">Hint: {question.hint}</span> : null}
                </article>
              ))}
            </div>

            {worksheet.extension_activity ? (
              <article className="premium-inline-card">
                <strong>Extension idea</strong>
                <p className="panel-copy" style={{ margin: 0 }}>{worksheet.extension_activity}</p>
              </article>
            ) : null}
          </div>
        ) : (
          <p className="panel-copy" style={{ margin: 0 }}>
            Choose a student and subject path to preview the next lesson, complete with mini lesson guidance and printable questions.
          </p>
        )}
      </section>
    </section>
  );
}
