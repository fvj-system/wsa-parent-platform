"use client";

import { useState, useTransition } from "react";
import { ReviewChecklist } from "@/components/umbrella/ReviewChecklist";

type ReviewDecisionPanelProps = {
  reviewId: string;
  initialDecision: "awaiting_review" | "in_review" | "approved" | "needs_correction" | "rejected";
  initialSummary?: string | null;
  initialCorrectionNotes?: string | null;
  initialRows: Array<{
    subject: string;
    reviewer_status: "sufficient" | "weak" | "missing";
    reviewer_note: string;
    parent_action_needed: string;
    ai_summary?: string;
  }>;
};

export function ReviewDecisionPanel({
  reviewId,
  initialDecision,
  initialSummary,
  initialCorrectionNotes,
  initialRows,
}: ReviewDecisionPanelProps) {
  const [decision, setDecision] = useState<"in_review" | "approved" | "needs_correction" | "rejected">(
    initialDecision === "awaiting_review" ? "in_review" : (initialDecision as "in_review" | "approved" | "needs_correction" | "rejected"),
  );
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [correctionNotes, setCorrectionNotes] = useState(initialCorrectionNotes ?? "");
  const [dueDate, setDueDate] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function saveDecision() {
    setError("");
    setSuccess("");

    if (decision === "needs_correction" && !correctionNotes.trim()) {
      setError("Correction notes are required when requesting corrections.");
      return;
    }

    const response = await fetch("/api/umbrella/reviews/decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        review_id: reviewId,
        decision,
        reviewer_summary: summary,
        correction_notes: correctionNotes,
        due_date: dueDate || undefined,
        findings: rows,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to save review decision.");
      return;
    }

    setSuccess("Reviewer decision saved.");
  }

  return (
    <section className="stack">
      <section className="panel stack">
        <div>
          <p className="eyebrow">Review decision</p>
          <h3>Human reviewer decision required</h3>
          <p className="panel-copy" style={{ margin: 0 }}>
            AI summaries do not approve reviews. Final decisions must be made by a qualified human reviewer.
          </p>
        </div>

        <div className="cta-row">
          <button type="button" className={`button ${decision === "in_review" ? "button-primary" : "button-ghost"}`} onClick={() => setDecision("in_review")}>
            Mark In Review
          </button>
          <button type="button" className={`button ${decision === "approved" ? "button-primary" : "button-ghost"}`} onClick={() => setDecision("approved")}>
            Approve Review
          </button>
          <button type="button" className={`button ${decision === "needs_correction" ? "button-primary" : "button-ghost"}`} onClick={() => setDecision("needs_correction")}>
            Needs Correction
          </button>
          <button type="button" className={`button ${decision === "rejected" ? "button-primary" : "button-ghost"}`} onClick={() => setDecision("rejected")}>
            Reject
          </button>
        </div>

        <label>
          Reviewer summary
          <textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>

        {decision === "needs_correction" ? (
          <>
            <label>
              Correction notes
              <textarea rows={3} value={correctionNotes} onChange={(event) => setCorrectionNotes(event.target.value)} />
            </label>
            <label>
              Optional due date
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </>
        ) : null}

        <div className="cta-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                void saveDecision();
              });
            }}
          >
            {isPending ? "Saving..." : "Save Decision"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
      </section>

      <ReviewChecklist rows={rows} onChange={setRows} />
    </section>
  );
}
