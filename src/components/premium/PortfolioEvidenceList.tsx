import type { PortfolioItemRecord } from "@/lib/premium/types";

export function PortfolioEvidenceList({ items }: { items: PortfolioItemRecord[] }) {
  return (
    <section className="panel stack">
      <div className="header-row">
        <div>
          <p className="eyebrow">Portfolio Evidence Status</p>
          <h3>Saved evidence by subject</h3>
        </div>
        <span className="badge">{items.length} items</span>
      </div>

      <div className="stack">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="premium-inline-card">
              <div className="header-row">
                <strong>{item.title}</strong>
                <span>{item.activity_date}</span>
              </div>
              <p className="panel-copy" style={{ margin: 0 }}>{item.description}</p>
              <p className="muted" style={{ margin: 0 }}>
                {item.evidence_type} • {(item.tags ?? []).map((tag) => tag.subject_areas?.name).filter(Boolean).join(", ") || "No subject tags yet"}
              </p>
            </article>
          ))
        ) : (
          <p className="panel-copy" style={{ margin: 0 }}>
            No portfolio evidence has been saved yet.
          </p>
        )}
      </div>
    </section>
  );
}
