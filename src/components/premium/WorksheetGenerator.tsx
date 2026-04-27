"use client";

import { useMemo, useState, useTransition } from "react";
import type { PremiumStudent, WorksheetPayload } from "@/lib/premium/types";
import { formatPremiumStudentName } from "@/lib/premium/data";

type WorksheetGeneratorProps = {
  students: PremiumStudent[];
  activeStudentId?: string | null;
  recentWorksheets: Array<Record<string, unknown>>;
};

export function WorksheetGenerator({ students, activeStudentId, recentWorksheets }: WorksheetGeneratorProps) {
  const [studentId, setStudentId] = useState(activeStudentId ?? students[0]?.id ?? "");
  const [subject, setSubject] = useState("English");
  const [topic, setTopic] = useState("Nature journaling");
  const [difficulty, setDifficulty] = useState("moderate");
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
        topic,
        grade_level: selectedStudent.grade_level ?? "3",
        reading_level: selectedStudent.reading_level ?? "early_reader",
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
          <p className="eyebrow">Worksheets Ready to Print</p>
          <h3>Create a printable worksheet</h3>
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
            Subject
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
            Topic
            <input value={topic} onChange={(event) => setTopic(event.target.value)} />
          </label>
          <label>
            Difficulty
            <input value={difficulty} onChange={(event) => setDifficulty(event.target.value)} />
          </label>
          <label>
            Number of questions
            <input value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} />
          </label>
          <label className="classes-waiver-toggle">
            <input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} />
            <span>Include answer key</span>
          </label>
        </div>

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
            {isPending ? "Creating..." : "Create Worksheet"}
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
          <h3>Saved worksheet pages</h3>
        </div>
        <div className="stack">
          {recentWorksheets.length ? (
            recentWorksheets.map((item) => (
              <article key={String(item.id)} className="premium-inline-card">
                <strong>{String(item.subject ?? "Worksheet")}</strong>
                <span>{String(item.topic ?? "")}</span>
                <a href={`/dashboard/premium/worksheets/${String(item.id)}`}>Print</a>
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
            <h3>{worksheet?.title ?? "Your printable worksheet will appear here"}</h3>
          </div>
        </div>

        {worksheet ? (
          <div className="stack">
            <p className="panel-copy" style={{ margin: 0 }}>{worksheet.instructions}</p>
            {worksheet.questions.map((question) => (
              <article key={question.number} className="premium-inline-card">
                <strong>{question.number}. {question.prompt}</strong>
                {question.choices?.length ? <span>{question.choices.join(" • ")}</span> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="panel-copy" style={{ margin: 0 }}>
            Generate a worksheet to preview the questions before printing.
          </p>
        )}
      </section>
    </section>
  );
}
