"use client";

import { useState, useTransition } from "react";
import {
  normalizeStudentReadingLevel,
  readingLevelOptions,
  type StudentReadingLevel
} from "@/lib/students";

type StudentReadingLevelEditorProps = {
  studentId: string;
  studentName: string;
  currentReadingLevel?: string | null;
};

export function StudentReadingLevelEditor({
  studentId,
  studentName,
  currentReadingLevel
}: StudentReadingLevelEditorProps) {
  const [readingLevel, setReadingLevel] = useState<StudentReadingLevel>(
    normalizeStudentReadingLevel(currentReadingLevel)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="trail-note trail-note-framed stack">
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Reading level
        </p>
        <p className="panel-copy" style={{ margin: 0 }}>
          Keep {studentName}&apos;s planner books matched to what they can handle right now.
        </p>
      </div>
      <label>
        Current reading level
        <select
          value={readingLevel}
          onChange={(event) => {
            setReadingLevel(event.target.value as StudentReadingLevel);
            setMessage("");
            setError("");
          }}
        >
          {readingLevelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="cta-row">
        <button
          type="button"
          className="button button-primary"
          disabled={isPending}
          onClick={() => {
            setMessage("");
            setError("");

            startTransition(async () => {
              const response = await fetch(`/api/students/${studentId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ readingLevel })
              });
              const payload = (await response.json()) as { error?: string };

              if (!response.ok) {
                setError(payload.error || "Unable to save reading level.");
                return;
              }

              setMessage("Reading level saved. Planner book picks will use this next time.");
              window.setTimeout(() => {
                window.location.reload();
              }, 500);
            });
          }}
        >
          {isPending ? "Saving..." : "Save reading level"}
        </button>
      </div>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
