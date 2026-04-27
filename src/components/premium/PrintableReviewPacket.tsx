import { PrintButton } from "@/components/print-button";
import type { PrintableReviewPacketData } from "@/lib/premium/types";

export function PrintableReviewPacket({ packet }: { packet: PrintableReviewPacketData }) {
  return (
    <section className="panel stack print-sheet premium-print-packet">
      <div className="header-row">
        <div>
          <p className="eyebrow">Printable packet</p>
          <h3>{packet.title}</h3>
        </div>
        <PrintButton label="Print Packet" />
      </div>

      <section>
        <h4>{packet.student_name}</h4>
        <p>Review period: {packet.review_period_start} to {packet.review_period_end}</p>
        <p>Parent/guardian: {packet.parent_guardian}</p>
        <p>Generated date: {packet.generated_date}</p>
      </section>

      <section>
        <h4>Student summary</h4>
        <p>Grade level: {packet.student_summary.grade_level}</p>
        <p>Reading level: {packet.student_summary.reading_level}</p>
        <p>Math level: {packet.student_summary.math_level}</p>
        <p>{packet.student_summary.general_progress_summary}</p>
      </section>

      <section className="stack">
        <h4>Subject-by-subject evidence</h4>
        {packet.subjects.map((subject) => (
          <article key={subject.subject} className="premium-inline-card">
            <div className="header-row">
              <strong>{subject.subject}</strong>
              <span className={`premium-status-pill premium-status-${subject.status}`}>
                {subject.status}
              </span>
            </div>
            <p style={{ margin: 0 }}>Evidence count: {subject.evidenceCount}</p>
            <p style={{ margin: 0 }}>Most recent evidence: {subject.mostRecentEvidenceTitle ?? "None yet"}</p>
            <p style={{ margin: 0 }}>{subject.summaryOfLearning}</p>
            <p style={{ margin: 0 }}>Parent action items: {subject.parentActionItems}</p>
          </article>
        ))}
      </section>

      <section className="stack">
        <h4>Portfolio evidence list</h4>
        {packet.evidence_items.map((item) => (
          <article key={item.id} className="premium-inline-card">
            <strong>{item.title}</strong>
            <span>{item.date} | {item.type}</span>
            <span>{item.subject_tags.join(", ") || "No subject tags"}</span>
            {item.parent_notes ? <span>{item.parent_notes}</span> : null}
          </article>
        ))}
      </section>

      <section>
        <h4>AI-assisted organizational summary</h4>
        <p>{packet.ai_assisted_summary}</p>
      </section>

      <section>
        <h4>Parent notes</h4>
        <p>{packet.parent_notes || "No additional parent notes were provided."}</p>
      </section>

      <section>
        <h4>Human reviewer section</h4>
        <p>Reviewer name: ______________________________</p>
        <p>Review date: ______________________________</p>
        <p>Decision: approved / needs correction / rejected</p>
        <p>Reviewer notes: ________________________________________________</p>
        <p>Reviewer signature: ____________________________________________</p>
      </section>
    </section>
  );
}
