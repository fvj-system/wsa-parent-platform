type EvidenceBySubjectProps = {
  subjects: Array<{
    subject: string;
    status: string;
    evidenceCount: number;
    summaryOfLearning?: string;
    parentActionItems?: string;
  }>;
};

export function EvidenceBySubject({ subjects }: EvidenceBySubjectProps) {
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Evidence by subject</p>
        <h3>Snapshot from the submitted packet</h3>
      </div>
      <div className="premium-subject-grid">
        {subjects.map((subject) => (
          <article key={subject.subject} className="premium-subject-card">
            <div className="header-row">
              <strong>{subject.subject}</strong>
              <span className={`premium-status-pill premium-status-${subject.status}`}>{subject.status}</span>
            </div>
            <p style={{ margin: 0 }}>Evidence count: {subject.evidenceCount}</p>
            {subject.summaryOfLearning ? <p style={{ margin: 0 }}>{subject.summaryOfLearning}</p> : null}
            {subject.parentActionItems ? <p style={{ margin: 0 }}>Action: {subject.parentActionItems}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
