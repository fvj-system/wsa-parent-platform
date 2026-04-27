"use client";

import { useState, useTransition } from "react";
import type { PremiumStudent } from "@/lib/premium/types";
import { formatGradeLevel, formatLevelLabel, formatPremiumStudentName } from "@/lib/premium/data";

type PremiumStudentsManagerProps = {
  initialStudents: PremiumStudent[];
};

type StudentDraft = {
  first_name: string;
  last_name: string;
  birthdate: string;
  grade_level: string;
  reading_level: string;
  math_level: string;
  science_level: string;
  writing_level: string;
  notes: string;
  active: boolean;
};

const emptyDraft: StudentDraft = {
  first_name: "",
  last_name: "",
  birthdate: "",
  grade_level: "3",
  reading_level: "early_reader",
  math_level: "addition_subtraction",
  science_level: "general",
  writing_level: "developing",
  notes: "",
  active: false,
};

export function PremiumStudentsManager({ initialStudents }: PremiumStudentsManagerProps) {
  const [students, setStudents] = useState(initialStudents);
  const [draft, setDraft] = useState<StudentDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeStudentId = students.find((student) => student.active)?.id ?? null;

  function hydrateDraft(student: PremiumStudent) {
    setDraft({
      first_name: student.first_name ?? student.name ?? "",
      last_name: student.last_name ?? "",
      birthdate: student.birthdate ?? "",
      grade_level: student.grade_level ?? "3",
      reading_level: student.reading_level ?? "early_reader",
      math_level: student.math_level ?? "addition_subtraction",
      science_level: student.science_level ?? "general",
      writing_level: student.writing_level ?? "developing",
      notes: student.notes ?? "",
      active: Boolean(student.active),
    });
  }

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  async function saveStudent(nextDraft = draft, targetId = editingId) {
    setError("");
    setSuccess("");

    const response = await fetch(targetId ? `/api/premium/students/${targetId}` : "/api/premium/students", {
      method: targetId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nextDraft,
        last_name: nextDraft.last_name || undefined,
        birthdate: nextDraft.birthdate || undefined,
        science_level: nextDraft.science_level || undefined,
        writing_level: nextDraft.writing_level || undefined,
        notes: nextDraft.notes || undefined,
      }),
    });

    const result = (await response.json()) as { error?: string; student?: PremiumStudent };
    if (!response.ok || !result.student) {
      setError(result.error ?? "Unable to save student.");
      return;
    }

    const savedStudent = result.student;

    setStudents((current) => {
      const next = targetId
        ? current.map((student) => (student.id === savedStudent.id ? savedStudent : student))
        : [savedStudent, ...current];

      if (savedStudent.active) {
        return next.map((student) => ({
          ...student,
          active: student.id === savedStudent.id,
        }));
      }

      return next;
    });

    setSuccess(targetId ? "Student profile updated." : "Student added.");
    resetForm();
  }

  return (
    <section className="stack">
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">{editingId ? "Edit student" : "Add student"}</p>
            <h3>Student profile system</h3>
            <p className="panel-copy" style={{ margin: 0 }}>
              Add students, set the active student, and keep grade and learning levels current for planning and review packets.
            </p>
          </div>
          {editingId ? (
            <button type="button" className="button button-ghost" onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="premium-form-grid">
          <label>
            First name
            <input value={draft.first_name} onChange={(event) => setDraft((current) => ({ ...current, first_name: event.target.value }))} />
          </label>
          <label>
            Last name
            <input value={draft.last_name} onChange={(event) => setDraft((current) => ({ ...current, last_name: event.target.value }))} />
          </label>
          <label>
            Birthdate
            <input type="date" value={draft.birthdate} onChange={(event) => setDraft((current) => ({ ...current, birthdate: event.target.value }))} />
          </label>
          <label>
            Grade level
            <input value={draft.grade_level} onChange={(event) => setDraft((current) => ({ ...current, grade_level: event.target.value }))} />
          </label>
          <label>
            Reading level
            <input value={draft.reading_level} onChange={(event) => setDraft((current) => ({ ...current, reading_level: event.target.value }))} />
          </label>
          <label>
            Math level
            <input value={draft.math_level} onChange={(event) => setDraft((current) => ({ ...current, math_level: event.target.value }))} />
          </label>
          <label>
            Science level
            <input value={draft.science_level} onChange={(event) => setDraft((current) => ({ ...current, science_level: event.target.value }))} />
          </label>
          <label>
            Writing level
            <input value={draft.writing_level} onChange={(event) => setDraft((current) => ({ ...current, writing_level: event.target.value }))} />
          </label>
        </div>

        <label>
          Notes
          <textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
        </label>

        <label className="classes-waiver-toggle">
          <input type="checkbox" checked={draft.active} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} />
          <span>Set as active student for planning</span>
        </label>

        <div className="cta-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                void saveStudent();
              });
            }}
          >
            {isPending ? "Saving..." : editingId ? "Save student" : "Add student"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
      </section>

      <section className="content-grid">
        {students.map((student) => (
          <article key={student.id} className="panel stack">
            <div className="header-row">
              <div>
                <p className="eyebrow">{student.id === activeStudentId ? "Active student" : "Student profile"}</p>
                <h3>{formatPremiumStudentName(student)}</h3>
              </div>
              {student.active ? <span className="badge">Active</span> : null}
            </div>
            <p className="panel-copy" style={{ margin: 0 }}>
              {formatGradeLevel(student.grade_level)} | Reading: {formatLevelLabel(student.reading_level)} | Math: {formatLevelLabel(student.math_level)}
            </p>
            {student.notes ? <p className="muted" style={{ margin: 0 }}>{student.notes}</p> : null}
            <div className="cta-row">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setEditingId(student.id);
                  hydrateDraft(student);
                }}
              >
                Edit Student
              </button>
              <a className="button button-ghost" href={`/dashboard/premium?student=${student.id}`}>
                View Progress
              </a>
              {!student.active ? (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    startTransition(() => {
                      const nextDraft = {
                        first_name: student.first_name ?? student.name ?? "",
                        last_name: student.last_name ?? "",
                        birthdate: student.birthdate ?? "",
                        grade_level: student.grade_level ?? "3",
                        reading_level: student.reading_level ?? "early_reader",
                        math_level: student.math_level ?? "addition_subtraction",
                        science_level: student.science_level ?? "general",
                        writing_level: student.writing_level ?? "developing",
                        notes: student.notes ?? "",
                        active: true,
                      };
                      setEditingId(student.id);
                      setDraft(nextDraft);
                      void saveStudent(nextDraft, student.id);
                    });
                  }}
                >
                  Set Active Student
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
