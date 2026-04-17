import Link from "next/link";
import { normalizeStudentReadingLevel, type StudentRecord } from "@/lib/students";

type StudentCardProps = {
  student: StudentRecord;
  badgeCount?: number;
};

function getRankClassName(rank: string) {
  switch (rank.toLowerCase()) {
    case "bronco":
      return "rank-bronco";
    case "mustang":
      return "rank-mustang";
    case "stallion":
      return "rank-stallion";
    default:
      return "rank-colt";
  }
}

export function StudentCard({ student, badgeCount = 0 }: StudentCardProps) {
  const showBadgeCount = typeof badgeCount === "number" && badgeCount > 0;

  return (
    <article className="panel stack specimen-card">
      <div className="header-row">
        <div>
          <p className="eyebrow">Student</p>
          <h3>{student.name}</h3>
        </div>
        <span className="rank-pill">
          <span className={`rank-emblem rank-emblem-small ${getRankClassName(student.current_rank)}`} aria-hidden="true" />
          {student.current_rank}
        </span>
      </div>
      <p className="panel-copy" style={{ margin: 0 }}>
        Age {student.age} | {student.completed_adventures_count} completed adventures
      </p>
      <p className="panel-copy" style={{ margin: 0 }}>
        Interests: {student.interests.length ? student.interests.join(", ") : "Still exploring"}
      </p>
      <p className="panel-copy" style={{ margin: 0 }}>
        Reading level: {normalizeStudentReadingLevel(student.reading_level)}
      </p>
      <div className="chip-list">
        <li>{student.current_rank}</li>
        {showBadgeCount ? <li>{badgeCount} badge{badgeCount === 1 ? "" : "s"}</li> : null}
      </div>
      <div className="cta-row">
        <Link className="button button-ghost" href={`/students/${student.id}`}>
          View profile
        </Link>
        <Link className="button button-primary" href={`/daily-adventure?studentId=${student.id}`}>
          Start today&apos;s adventure
        </Link>
      </div>
    </article>
  );
}
