import type { CoverageCard } from "@/lib/compliance/coverageRules";

function titleCaseStatus(status: CoverageCard["status"]) {
  switch (status) {
    case "covered":
      return "Covered";
    case "weak":
      return "Weak";
    case "missing":
      return "Missing";
    default:
      return status;
  }
}

export function SubjectTracker({ coverage }: { coverage: CoverageCard[] }) {
  return (
    <section className="panel stack">
      <div className="header-row">
        <div>
          <p className="eyebrow">Maryland 8-Subject Coverage Tracker</p>
          <h3>Documentation strength for the current review period</h3>
        </div>
      </div>
      <div className="premium-subject-grid">
        {coverage.map((item) => (
          <article key={item.subject} className="premium-subject-card">
            <div className="header-row">
              <h4>{item.subject}</h4>
              <span className={`premium-status-pill premium-status-${item.status}`}>{titleCaseStatus(item.status)}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {item.evidenceCount} evidence item{item.evidenceCount === 1 ? "" : "s"}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Last evidence: {item.lastEvidenceDate ?? "None saved yet"}
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              Suggested next action: {item.suggestedNextAction}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
