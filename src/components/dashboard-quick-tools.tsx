import Link from "next/link";

const primaryTools = [
  { title: "Today", href: "/daily-adventure", subtitle: "Daily Adventure" },
  { title: "Students", href: "/students", subtitle: "Progress and ranks" },
  { title: "Classes", href: "/classes", subtitle: "Browse and book" },
  { title: "Portfolio", href: "/portfolio", subtitle: "Print records" }
];

const secondaryTools = [
  { title: "Week Planner", href: "/planner" },
  { title: "Animal of the Day", href: "/animal-of-the-day" },
  { title: "History", href: "/history" },
  { title: "Classes", href: "/classes" }
];

export function DashboardQuickTools() {
  return (
    <section className="panel stack">
      <div className="field-section-header">
        <div>
          <p className="eyebrow">Explore next</p>
          <h3>Useful tools and records</h3>
        </div>
      </div>

      <div className="dashboard-tool-grid">
        {primaryTools.map((tool) => (
          <Link className="specimen-card dashboard-tool-card" href={tool.href} key={tool.title}>
            <span>{tool.subtitle}</span>
            <strong>{tool.title}</strong>
          </Link>
        ))}
      </div>

      <div className="chip-list" style={{ marginTop: 0 }}>
        {secondaryTools.map((tool) => (
          <li key={tool.title}>
            <Link href={tool.href}>{tool.title}</Link>
          </li>
        ))}
      </div>
    </section>
  );
}
