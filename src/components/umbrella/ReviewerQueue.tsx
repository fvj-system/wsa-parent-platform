type ReviewerQueueProps = {
  reviews: Array<Record<string, unknown>>;
};

export function ReviewerQueue({ reviews }: ReviewerQueueProps) {
  return (
    <section className="panel stack">
      <div className="header-row">
        <div>
          <p className="eyebrow">Reviewer queue</p>
          <h3>Reviews awaiting action</h3>
        </div>
      </div>
      <div className="stack">
        {reviews.length ? (
          reviews.map((review) => (
            <article key={String(review.id)} className="premium-inline-card">
              <div className="header-row">
                <strong>{String((review.families as { name?: string | null } | undefined)?.name ?? "WSA Family")}</strong>
                <span className={`premium-status-pill premium-status-${String(review.decision ?? "weak").replace("_", "-")}`}>
                  {String(review.decision ?? "awaiting_review")}
                </span>
              </div>
              <p style={{ margin: 0 }}>
                {String((review.students as { name?: string | null; first_name?: string | null; last_name?: string | null } | undefined)?.name ?? "Student")}
              </p>
              <a href={`/dashboard/umbrella/reviews?review=${String(review.id)}`}>Open review</a>
            </article>
          ))
        ) : (
          <p className="panel-copy" style={{ margin: 0 }}>
            No reviews are waiting right now.
          </p>
        )}
      </div>
    </section>
  );
}
