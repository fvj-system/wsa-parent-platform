import Link from "next/link";
import type { PortfolioOverviewCard } from "@/lib/portfolio";

type PortfolioStudentCardProps = {
  item: PortfolioOverviewCard;
};

export function PortfolioStudentCard({ item }: PortfolioStudentCardProps) {
  return (
    <article className="panel stack">
      <div className="header-row">
        <div>
          <p className="eyebrow">Student portfolio</p>
          <h3>{item.student.name}</h3>
        </div>
        <span className="pill">{item.student.current_rank}</span>
      </div>

      <p className="panel-copy" style={{ margin: 0 }}>
        Age {item.student.age} | {item.completionCount} completed activities | {item.badgeCount} badges | {item.classCount} classes
      </p>

      <p className="panel-copy" style={{ margin: 0 }}>
        {item.recentActivityTitle ? `Most recent: ${item.recentActivityTitle}` : "No completed activity recorded yet."}
      </p>

      <div className="cta-row">
        <Link className="button button-primary" href={`/portfolio/${item.student.id}`}>
          Open homeschool review
        </Link>
        <Link className="button button-ghost" href={`/daily-adventure?studentId=${item.student.id}`}>
          Start today&apos;s adventure
        </Link>
      </div>
    </article>
  );
}
