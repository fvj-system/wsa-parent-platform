import type { AdminTrendPoint } from "@/lib/admin-portal";

type AdminLineChartProps = {
  title: string;
  subtitle: string;
  points: AdminTrendPoint[];
};

export function AdminLineChart({
  title,
  subtitle,
  points,
}: AdminLineChartProps) {
  const safePoints = points.length ? points : [{ label: "No data", value: 0 }];
  const maxValue = Math.max(...safePoints.map((point) => point.value), 1);
  const width = 720;
  const height = 220;
  const padding = 28;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const path = safePoints
    .map((point, index) => {
      const x =
        padding +
        (safePoints.length === 1
          ? chartWidth / 2
          : (chartWidth / (safePoints.length - 1)) * index);
      const y =
        padding + chartHeight - (point.value / maxValue) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Attendance trend</p>
        <h3>{title}</h3>
        <p className="panel-copy" style={{ margin: "8px 0 0" }}>
          {subtitle}
        </p>
      </div>
      <div className="admin-chart-shell">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="admin-line-chart"
          role="img"
          aria-label={title}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((step) => {
            const y = padding + chartHeight - step * chartHeight;
            return (
              <line
                key={step}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(68, 47, 28, 0.16)"
                strokeDasharray="5 6"
              />
            );
          })}
          <path
            d={path}
            fill="none"
            stroke="rgb(143, 85, 40)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {safePoints.map((point, index) => {
            const x =
              padding +
              (safePoints.length === 1
                ? chartWidth / 2
                : (chartWidth / (safePoints.length - 1)) * index);
            const y =
              padding + chartHeight - (point.value / maxValue) * chartHeight;
            return (
              <g key={`${point.label}-${index}`}>
                <circle cx={x} cy={y} r="5" fill="rgb(48, 75, 51)" />
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  className="admin-line-chart-label"
                >
                  {point.label}
                </text>
                <text
                  x={x}
                  y={Math.max(16, y - 10)}
                  textAnchor="middle"
                  className="admin-line-chart-value"
                >
                  {point.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
