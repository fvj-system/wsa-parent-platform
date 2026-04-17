"use client";

import { useState, useTransition } from "react";
import { StudentCard } from "@/components/student-card";
import { defaultStudentReadingLevel, readingLevelOptions, type StudentRecord } from "@/lib/students";

type StudentsManagerProps = {
  initialStudents: StudentRecord[];
};

type CreateStudentResponse = {
  student: StudentRecord;
};

export function StudentsManager({ initialStudents }: StudentsManagerProps) {
  const [students, setStudents] = useState(initialStudents);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="stack">
      <article className="panel stack students-roster-panel">
        <div className="header-row">
          <div>
            <p className="eyebrow">Student roster</p>
            <h3>{students.length ? "Open a student profile" : "No students added yet"}</h3>
            <p className="panel-copy">
              {students.length
                ? "Open current student profiles here, then add another child only when you need to."
                : "Add your first child profile to start connecting daily adventures to progress."}
            </p>
          </div>
          <div className="nav-actions print-hide">
            <button
              type="button"
              className={isCreateOpen ? "button button-ghost" : "button button-primary"}
              onClick={() => {
                setError("");
                setIsCreateOpen((current) => !current);
              }}
            >
              {isCreateOpen ? "Close add student" : "Add student"}
            </button>
          </div>
        </div>

        {isCreateOpen ? (
          <form
            className="stack student-create-form students-create-inline"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              const form = event.currentTarget;
              const formData = new FormData(form);

              startTransition(async () => {
                const response = await fetch("/api/students", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    name: String(formData.get("name") || ""),
                    age: Number(formData.get("age") || 8),
                    interests: String(formData.get("interests") || ""),
                    readingLevel: String(formData.get("readingLevel") || defaultStudentReadingLevel)
                  })
                });

                const payload = (await response.json()) as CreateStudentResponse | { error: string };
                if (!response.ok || "error" in payload) {
                  setError("error" in payload ? payload.error : "Unable to create student.");
                  return;
                }

                setStudents((current) => [payload.student, ...current]);
                form.reset();
                setIsCreateOpen(false);
              });
            }}
          >
            <div className="students-create-inline-grid">
              <label>
                Name
                <input name="name" placeholder="Avery" required />
              </label>
              <label>
                Age
                <input name="age" type="number" min={3} max={18} defaultValue={8} required />
              </label>
              <label>
                Interests
                <input name="interests" placeholder="birds, drawing, bugs, hiking" />
              </label>
              <label>
                Reading level
                <select name="readingLevel" defaultValue={defaultStudentReadingLevel}>
                  {readingLevelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="cta-row">
              <button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create student"}
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setError("");
                  setIsCreateOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </form>
        ) : null}

        {students.length ? (
          <div className="content-grid">
            {students.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <p className="panel-copy" style={{ margin: 0 }}>
            Use <strong>Add student</strong> to create the first profile, then the roster will appear here.
          </p>
        )}
      </article>
    </section>
  );
}
