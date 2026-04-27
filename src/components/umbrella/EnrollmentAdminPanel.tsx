"use client";

import { useState, useTransition } from "react";

type EnrollmentAdminPanelProps = {
  families: Array<{ id: string; name: string }>;
  students: Array<{ id: string; name: string }>;
};

export function EnrollmentAdminPanel({ families, students }: EnrollmentAdminPanelProps) {
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [status, setStatus] = useState("draft");
  const [supervisingStatus, setSupervisingStatus] = useState("portfolio_support_only");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function saveEnrollment() {
    setError("");
    setSuccess("");

    const response = await fetch("/api/umbrella/enrollments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        family_id: familyId,
        student_id: studentId,
        enrollment_status: status,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        supervising_entity_status: supervisingStatus,
        notes,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to save enrollment.");
      return;
    }

    setSuccess("Enrollment saved.");
  }

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Manage enrollment</p>
        <h3>Create or update umbrella-ready enrollment</h3>
      </div>
      <div className="premium-form-grid">
        <label>
          Family
          <select value={familyId} onChange={(event) => setFamilyId(event.target.value)}>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Student
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enrollment status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="withdrawn">withdrawn</option>
            <option value="graduated">graduated</option>
          </select>
        </label>
        <label>
          Supervising entity status
          <select value={supervisingStatus} onChange={(event) => setSupervisingStatus(event.target.value)}>
            <option value="portfolio_support_only">portfolio_support_only</option>
            <option value="partner_umbrella">partner_umbrella</option>
            <option value="wsa_registered_umbrella">wsa_registered_umbrella</option>
          </select>
        </label>
        <label>
          Start date
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>
      <label>
        Notes
        <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="cta-row">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              void saveEnrollment();
            });
          }}
        >
          {isPending ? "Saving..." : "Save Enrollment"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
    </section>
  );
}
