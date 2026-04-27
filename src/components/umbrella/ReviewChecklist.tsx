"use client";

type ChecklistRow = {
  subject: string;
  reviewer_status: "sufficient" | "weak" | "missing";
  reviewer_note: string;
  parent_action_needed: string;
  ai_summary?: string;
};

type ReviewChecklistProps = {
  rows: ChecklistRow[];
  onChange: (next: ChecklistRow[]) => void;
};

export function ReviewChecklist({ rows, onChange }: ReviewChecklistProps) {
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Review checklist</p>
        <h3>Subject-by-subject reviewer status</h3>
      </div>

      <div className="stack">
        {rows.map((row, index) => (
          <article key={row.subject} className="premium-inline-card premium-review-check-card">
            <div className="header-row">
              <strong>{row.subject}</strong>
              <select
                value={row.reviewer_status}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = {
                    ...row,
                    reviewer_status: event.target.value as ChecklistRow["reviewer_status"],
                  };
                  onChange(next);
                }}
              >
                <option value="sufficient">sufficient</option>
                <option value="weak">weak</option>
                <option value="missing">missing</option>
              </select>
            </div>
            <label>
              Reviewer note
              <textarea
                rows={2}
                value={row.reviewer_note}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = {
                    ...row,
                    reviewer_note: event.target.value,
                  };
                  onChange(next);
                }}
              />
            </label>
            <label>
              Parent action needed
              <textarea
                rows={2}
                value={row.parent_action_needed}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = {
                    ...row,
                    parent_action_needed: event.target.value,
                  };
                  onChange(next);
                }}
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
