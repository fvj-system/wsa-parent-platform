type PortfolioSummaryControlsProps = {
  range: "7d" | "30d" | "month" | "custom";
  startDate: string;
  endDate: string;
};

export function PortfolioSummaryControls({ range, startDate, endDate }: PortfolioSummaryControlsProps) {
  return (
    <section className="panel stack print-hide">
      <div>
        <p className="eyebrow">Portfolio summary</p>
        <h3>Choose a reporting period</h3>
        <p className="panel-copy">Switch between quick windows or define a custom date range before printing.</p>
      </div>

      <div className="cta-row">
        <a className={`button ${range === "7d" ? "button-primary" : "button-ghost"}`} href="?range=7d">
          Last 7 days
        </a>
        <a className={`button ${range === "30d" ? "button-primary" : "button-ghost"}`} href="?range=30d">
          Last 30 days
        </a>
        <a className={`button ${range === "month" ? "button-primary" : "button-ghost"}`} href="?range=month">
          Current month
        </a>
      </div>

      <form className="portfolio-range-form" method="get">
        <input type="hidden" name="range" value="custom" />
        <label className="portfolio-range-field">
          Start date
          <input type="date" name="start" defaultValue={range === "custom" ? startDate : ""} />
        </label>
        <label className="portfolio-range-field">
          End date
          <input type="date" name="end" defaultValue={range === "custom" ? endDate : ""} />
        </label>
        <button type="submit" className="button button-ghost">
          Apply custom range
        </button>
      </form>
    </section>
  );
}
