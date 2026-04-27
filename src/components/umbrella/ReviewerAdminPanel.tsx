"use client";

import { useState, useTransition } from "react";

type ReviewerAdminPanelProps = {
  families: Array<{ id: string; name: string }>;
  students: Array<{ id: string; name: string }>;
};

export function ReviewerAdminPanel({ families, students }: ReviewerAdminPanelProps) {
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [maxLoad, setMaxLoad] = useState("20");
  const [reviewerUserId, setReviewerUserId] = useState("");
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [studentId, setStudentId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function saveReviewerProfile() {
    setError("");
    setSuccess("");
    const response = await fetch("/api/umbrella/reviewers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "profile",
        user_id: userId,
        display_name: displayName,
        bio,
        max_family_load: Number(maxLoad),
        active: true,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to save reviewer profile.");
      return;
    }

    setSuccess("Reviewer profile saved.");
  }

  async function saveAssignment() {
    setError("");
    setSuccess("");
    const response = await fetch("/api/umbrella/reviewers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "assignment",
        reviewer_user_id: reviewerUserId,
        family_id: familyId,
        student_id: studentId || undefined,
        notes,
        active: true,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to save reviewer assignment.");
      return;
    }

    setSuccess("Reviewer assignment saved.");
  }

  return (
    <section className="content-grid">
      <section className="panel stack">
        <div>
          <p className="eyebrow">Create reviewer profile</p>
          <h3>Register reviewer credentials</h3>
        </div>
        <label>
          Reviewer user ID
          <input value={userId} onChange={(event) => setUserId(event.target.value)} />
        </label>
        <label>
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label>
          Bio
          <textarea rows={3} value={bio} onChange={(event) => setBio(event.target.value)} />
        </label>
        <label>
          Max family load
          <input value={maxLoad} onChange={(event) => setMaxLoad(event.target.value)} />
        </label>
        <div className="cta-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                void saveReviewerProfile();
              });
            }}
          >
            {isPending ? "Saving..." : "Create Reviewer Profile"}
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Assign reviewer</p>
          <h3>Map reviewer workload</h3>
        </div>
        <label>
          Reviewer user ID
          <input value={reviewerUserId} onChange={(event) => setReviewerUserId(event.target.value)} />
        </label>
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
            <option value="">All family students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
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
                void saveAssignment();
              });
            }}
          >
            {isPending ? "Saving..." : "Assign Reviewer"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
      </section>
    </section>
  );
}
