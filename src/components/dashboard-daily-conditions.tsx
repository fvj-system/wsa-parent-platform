import type { TideSummary } from "@/lib/context/tides";
import type { WeatherContext } from "@/lib/context/weather/nws";

type DashboardDailyConditionsProps = {
  weather: WeatherContext | null;
  fallbackSummary: string;
  tide: TideSummary;
};

export function DashboardDailyConditions({ weather, fallbackSummary, tide }: DashboardDailyConditionsProps) {
  const weatherLabel = weather?.shortForecast ?? "Mixed conditions";
  const high = weather?.temperature ?? "--";
  const low = weather?.lowTemperature ?? "--";
  const nextHigh = tide.highTides[0] ?? "--";
  const nextLow = tide.lowTides[0] ?? "--";

  return (
    <section className="specimen-card daily-conditions-panel">
      <div className="daily-conditions-panel-head">
        <div>
          <p className="eyebrow">Conditions</p>
          <h3>Today&apos;s field read</h3>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          Weather, tides, and the quick nature read in one spot.
        </p>
      </div>

      <div className="daily-conditions-grid">
        <article className="daily-condition-item">
          <span className="eyebrow">Weather</span>
          <strong>{weatherLabel}</strong>
          <span className="muted">H {high} deg / L {low} deg</span>
        </article>

        <article className="daily-condition-item">
          <span className="eyebrow">Tides</span>
          <strong>{tide.hasTideData ? `High ${nextHigh}` : "No tide pressure"}</strong>
          <span className="muted">{tide.hasTideData ? `Low ${nextLow}` : tide.summary}</span>
        </article>

        <article className="daily-condition-item daily-condition-item-wide">
          <span className="eyebrow">Field Read</span>
          <strong className="daily-condition-field-read">{fallbackSummary}</strong>
        </article>
      </div>
    </section>
  );
}
