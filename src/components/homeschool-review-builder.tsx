"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  buildFallbackHomeschoolReview,
  marylandSubjectLabels,
  type HomeschoolReviewSummary,
  type ReviewEvidenceItem,
} from "@/lib/homeschool-review";

type HomeschoolReviewBuilderProps = {
  studentName: string;
  studentId: string;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  evidenceItems: ReviewEvidenceItem[];
  parentNotes: string[];
};

export function HomeschoolReviewBuilder({
  studentName,
  studentId,
  rangeLabel,
  startDate,
  endDate,
  evidenceItems,
  parentNotes,
}: HomeschoolReviewBuilderProps) {
  const [customParentSummary, setCustomParentSummary] = useState("");
  const [includeParentNotes, setIncludeParentNotes] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [aiReview, setAiReview] = useState<HomeschoolReviewSummary | null>(null);
  const fallbackReview = useMemo(
    () =>
      buildFallbackHomeschoolReview({
        studentName,
        rangeLabel,
        evidenceItems,
        parentNotes: includeParentNotes ? parentNotes : [],
        customParentSummary,
      }),
    [studentName, rangeLabel, evidenceItems, parentNotes, includeParentNotes, customParentSummary],
  );
  const printableParentNotes = includeParentNotes ? parentNotes : [];
  const review = aiReview ?? fallbackReview;

  useEffect(() => {
    setAiReview(null);
  }, [studentName, rangeLabel, evidenceItems, parentNotes, includeParentNotes, customParentSummary]);

  function escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  return (
    <div className="stack">
      <section className="panel stack print-hide">
        <div>
          <p className="eyebrow">Homeschool review builder</p>
          <h3>Build a Maryland subject review packet</h3>
          <p className="panel-copy">
            Add outside learning notes, choose whether to include parent reflections, and generate subject summaries from the documented evidence.
          </p>
        </div>

        <label>
          Outside learning summary
          <textarea
            rows={4}
            value={customParentSummary}
            onChange={(event) => setCustomParentSummary(event.target.value)}
            placeholder="Add anything important the student learned outside the app that you want included in the review."
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={includeParentNotes}
            onChange={(event) => setIncludeParentNotes(event.target.checked)}
          />
          Include saved parent notes in the review
        </label>

        <div className="cta-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError("");

              startTransition(async () => {
                const response = await fetch("/api/homeschool-review", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    studentName,
                    rangeLabel,
                    customParentSummary: customParentSummary.trim() || undefined,
                    parentNotes: includeParentNotes ? parentNotes : [],
                    evidenceItems,
                  }),
                });

                const payload = (await response.json()) as {
                  review?: HomeschoolReviewSummary;
                  error?: string;
                };

                if (!response.ok || payload.error || !payload.review) {
                  setError(payload.error ?? "Could not build the homeschool review right now.");
                  setAiReview(null);
                  return;
                }

                setAiReview(payload.review.mode === "ai" ? payload.review : null);
              });
            }}
          >
            {isPending ? "Generating..." : "Generate AI subject summaries"}
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${studentName} homeschool review</title>
    <style>
      body { font-family: Georgia, serif; color: #21140d; margin: 24px; line-height: 1.5; }
      h1, h2, h3 { margin: 0 0 10px; }
      h1 { font-size: 30px; }
      h2 { font-size: 20px; margin-top: 24px; }
      h3 { font-size: 16px; margin-top: 18px; }
      .muted { color: #5b4a3a; }
      .section { margin-top: 20px; padding: 16px; border: 1px solid #d8ccb8; border-radius: 12px; }
      ul { padding-left: 20px; }
      li + li { margin-top: 6px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(studentName)} Homeschool Review</h1>
    <p class="muted">${escapeHtml(rangeLabel)} (${escapeHtml(startDate)} to ${escapeHtml(endDate)})</p>
    <div class="section">
      <h2>Overall Summary</h2>
      <p>${escapeHtml(review.overallSummary)}</p>
    </div>
    ${
      customParentSummary.trim()
        ? `<div class="section"><h2>Parent Outside Learning Summary</h2><p>${escapeHtml(customParentSummary.trim())}</p></div>`
        : ""
    }
    ${
      printableParentNotes.length
        ? `<div class="section"><h2>Parent Notes</h2><ul>${printableParentNotes
            .map((note) => `<li>${escapeHtml(note)}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    <div class="section">
      <h2>Maryland Core Subjects</h2>
      ${marylandSubjectLabels
        .map(
          (subject) =>
            `<div><h3>${escapeHtml(subject)}</h3><p>${escapeHtml(review.subjects[subject])}</p></div>`,
        )
        .join("")}
    </div>
    <div class="section">
      <h2>Documented Evidence</h2>
      <ul>${evidenceItems
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.title)}</strong> (${escapeHtml(item.categoryLabel)}, ${escapeHtml(item.occurredAt.slice(
              0,
              10,
            ))})<br/>${escapeHtml(item.summary)}</li>`,
        )
        .join("")}</ul>
    </div>
  </body>
</html>`;
              const blob = new Blob([html], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-homeschool-review.html`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download review HTML
          </button>
        </div>

        {error ? <p className="error" style={{ margin: 0 }}>{error}</p> : null}
        <p className="muted" style={{ margin: 0 }}>
          If AI is unavailable, the page still shows a structured fallback review so you can print it safely.
        </p>
      </section>

      <section className="panel stack print-sheet homeschool-review-sheet">
        <div className="header-row">
          <div>
            <p className="eyebrow">Homeschool review</p>
            <h3>{studentName}</h3>
            <p className="panel-copy" style={{ margin: "8px 0 0" }}>
              {rangeLabel}
            </p>
          </div>
          <span className="pill">{review.mode === "ai" ? "AI summary" : "Structured summary"}</span>
        </div>

        <section>
          <h4>Overall learning summary</h4>
          <p>{review.overallSummary}</p>
        </section>

        {customParentSummary.trim() ? (
          <section>
            <h4>Parent outside learning summary</h4>
            <p>{customParentSummary.trim()}</p>
          </section>
        ) : null}

        {printableParentNotes.length ? (
          <section>
            <h4>Parent notes included</h4>
            <ul className="result-list result-list-tight">
              {printableParentNotes.map((note, index) => (
                <li key={`${studentId}-parent-note-${index}`}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="result-sections homeschool-review-subject-grid">
          {marylandSubjectLabels.map((subject) => (
            <section key={subject}>
              <h4>{subject}</h4>
              <p>{review.subjects[subject]}</p>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
