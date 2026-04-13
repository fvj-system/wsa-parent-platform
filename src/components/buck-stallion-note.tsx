type BuckStallionNoteProps = {
  title: string;
  body: string;
  compact?: boolean;
};

export function BuckStallionNote({ title, body, compact = false }: BuckStallionNoteProps) {
  return (
    <aside className={`buck-note ${compact ? "buck-note-compact" : ""}`}>
      <div className="buck-note-badge" aria-hidden="true">
        <span className="rank-emblem rank-emblem-small rank-stallion" />
      </div>
      <div className="buck-note-copy">
        <p className="eyebrow">{compact ? "WSA note" : "WSA guide note"}</p>
        <h4>{title}</h4>
        <p className="panel-copy" style={{ marginBottom: 0 }}>
          {body}
        </p>
      </div>
    </aside>
  );
}
