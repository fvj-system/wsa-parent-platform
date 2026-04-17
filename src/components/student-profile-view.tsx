import Link from "next/link";
import { AchievementCard } from "@/components/achievement-card";
import { BadgeCard } from "@/components/badge-card";
import { BuckStallionNote } from "@/components/buck-stallion-note";
import { HistoryList } from "@/components/history-list";
import { MarkCompleteCard } from "@/components/mark-complete-card";
import { StudentReadingLevelEditor } from "@/components/student-reading-level-editor";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import type { StudentAchievementRecord, StudentBadgeRecord } from "@/lib/badges";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { getDiscoveryCategoryLabel, type DiscoveryRecord } from "@/lib/discoveries";
import { generationKindLabel, type GenerationRecord } from "@/lib/generations";
import { getRankDescription, getRankProgress, normalizeStudentReadingLevel, type StudentRecord } from "@/lib/students";

type StudentProfileViewProps = {
  student: StudentRecord;
  completedAdventures: GenerationRecord[];
  linkedGenerations: GenerationRecord[];
  recentCompletions: ActivityCompletionRecord[];
  recentDiscoveries: DiscoveryRecord[];
  classBookings: Array<ClassBookingRecord & { classes?: ClassRecord | null }>;
  badges: StudentBadgeRecord[];
  achievements: StudentAchievementRecord[];
};

function getCompletionBadge(completion: ActivityCompletionRecord) {
  switch (completion.activity_type) {
    case "daily_adventure":
      return "Daily Adventure";
    case "animal_of_the_day":
      return "Animal Study";
    case "nature_discovery":
      return "Nature Discovery";
    case "lesson_generator":
      return "Lesson";
    case "week_planner":
      return "Week Planner";
    case "in_person_class":
      return "Class";
  }
}

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

function TrailIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 7-7 7-7-7 7-7Z" />
      <path d="M12 17v4" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4h9a2 2 0 0 1 2 2v14H9a2 2 0 0 0-2 2V4Z" />
      <path d="M7 4H6a2 2 0 0 0-2 2v14h3" />
      <path d="M10 8h5" />
      <path d="M10 12h5" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg aria-hidden="true" className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l6 3v5c0 4.1-2.4 7.1-6 9-3.6-1.9-6-4.9-6-9V6l6-3Z" />
      <path d="M9.5 11.5l1.6 1.6 3.4-3.6" />
    </svg>
  );
}

export function StudentProfileView({
  student,
  completedAdventures,
  linkedGenerations,
  recentCompletions,
  recentDiscoveries,
  classBookings,
  badges,
  achievements
}: StudentProfileViewProps) {
  const rankProgress = getRankProgress(student.completed_adventures_count);
  const recentBadge = badges[0]?.badges;
  const recentAchievement = achievements[0]?.achievements;
  const discoveryCount = recentCompletions.filter((item) => item.activity_type === "nature_discovery").length;
  const completedGenerationIds = new Set(recentCompletions.map((item) => item.generation_id).filter(Boolean));
  const completedBookingIds = new Set(recentCompletions.map((item) => item.class_booking_id).filter(Boolean));
  const upcomingBookings = classBookings.filter((item) => item.payment_status === "paid" && !completedBookingIds.has(item.id));
  const nextRankMessage = rankProgress.nextRank
    ? `${rankProgress.totalNeededForNextRank! - rankProgress.completedInRank} more to reach ${rankProgress.nextRank}.`
    : "Top rank reached. Keep building the trail.";

  return (
    <div className="stack student-profile-rhythm">
      <section className="panel student-hero">
        <div className="student-hero-main">
          <div className="field-section-header">
            <div>
              <p className="eyebrow">Student profile</p>
              <h3>
                {student.name}, age {student.age}
              </h3>
              <p className="panel-copy" style={{ margin: 0 }}>
                {getRankDescription(student.current_rank)}
              </p>
            </div>
          </div>
          <div className="chip-list">
            <li>{student.completed_adventures_count} completed adventures</li>
            <li>{badges.length} badge{badges.length === 1 ? "" : "s"} earned</li>
            <li>Reading: {normalizeStudentReadingLevel(student.reading_level)}</li>
            <li>{student.interests.length ? student.interests.join(", ") : "Still exploring interests"}</li>
          </div>
          <div className="cta-row">
            <Link className="button button-primary" href={`/daily-adventure?studentId=${student.id}`}>
              Start today's adventure
            </Link>
            <Link className="button button-ghost" href={`/portfolio/${student.id}`}>
              Homeschool review PDF
            </Link>
            <Link className="button button-ghost" href="/discover/catalog">
              Creature log
            </Link>
          </div>
        </div>
        <div className="student-hero-side">
          <div className="rank-pill" style={{ justifyContent: "flex-start" }}>
            <span className={`rank-emblem ${getRankClassName(student.current_rank)}`} aria-hidden="true" />
            {student.current_rank}
          </div>
          <div className="trail-note trail-note-framed">
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Trail progress
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              {nextRankMessage}
            </p>
          </div>
          <BuckStallionNote
            compact
            title="Use this page as the proud student snapshot."
            body="The family creature log, recent activities, and homeschool review export all support this same story instead of competing with it."
          />
          <StudentReadingLevelEditor
            studentId={student.id}
            studentName={student.name}
            currentReadingLevel={student.reading_level}
          />
        </div>
      </section>

      <section className="panel stack">
        <div className="student-section-nav">
          <a className="student-switcher-pill" href="#student-achievements">
            Achievements
          </a>
          <a className="student-switcher-pill" href="#student-adventures">
            Adventure Logs
          </a>
          <a className="student-switcher-pill" href="#student-creature-log">
            Creature Log
          </a>
          <a className="student-switcher-pill" href="#student-classes">
            Classes
          </a>
          <a className="student-switcher-pill" href="#student-archive">
            Archive
          </a>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat metric-card">
          <span>Completed adventures</span>
          <strong>{student.completed_adventures_count}</strong>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            Real completions move rank forward.
          </p>
        </article>
        <article className="stat metric-card">
          <span>Current rank</span>
          <strong>{student.current_rank}</strong>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {nextRankMessage}
          </p>
        </article>
        <article className="stat metric-card">
          <span>Nature discoveries</span>
          <strong>{discoveryCount}</strong>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {discoveryCount ? "Saved finds now count as learning progress." : "Saved discoveries will show up here."}
          </p>
        </article>
        <article className="stat metric-card">
          <span>Badges earned</span>
          <strong>{badges.length}</strong>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {recentBadge ? `Latest: ${recentBadge.name}` : "First badge is still ahead."}
          </p>
        </article>
        <article className="stat metric-card">
          <span>Recent unlock</span>
          <strong>{recentBadge?.name ?? recentAchievement?.name ?? "None yet"}</strong>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            {recentAchievement?.description ?? recentBadge?.description ?? "Complete the next activity to trigger progress checks."}
          </p>
        </article>
      </section>

      <section className="panel stack" id="student-adventures">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <TrailIcon />
            </span>
            <div>
              <p className="eyebrow">Today&apos;s mission</p>
              <h3>Choose the next expedition step</h3>
            </div>
          </div>
        </div>
        <div className="cta-row">
          <Link className="button button-ghost" href={`/animal-of-the-day?studentId=${student.id}`}>
            Open animal study
          </Link>
          <Link className="button button-ghost" href="/planner">
            Plan a week
          </Link>
          <Link className="button button-ghost" href={`/portfolio/${student.id}`}>
            Open homeschool review
          </Link>
        </div>
        {linkedGenerations[0] ? (
          <div className="field-empty-state">
            <div className="copy">
              <h4>Most recent linked activity</h4>
              <p className="muted">
                {linkedGenerations[0].title} | {new Date(linkedGenerations[0].created_at).toLocaleDateString()}
              </p>
              <div className="cta-row" style={{ marginTop: 14 }}>
                <Link className="button button-ghost" href={`/generations/${linkedGenerations[0].id}`}>
                  Open activity
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No student-linked missions yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Start with today&apos;s adventure to begin the trail and give this dashboard a first field entry.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack" id="student-creature-log">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <JournalIcon />
            </span>
            <div>
              <p className="eyebrow">Creature log</p>
              <h3>Shared family discoveries</h3>
            </div>
          </div>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          Household discoveries feed the family creature log first, and that same running field notebook supports each child's profile and review record.
        </p>
        <div className="cta-row">
          <Link className="button button-primary" href="/discover/catalog">
            Open household creature log
          </Link>
          <Link className="button button-ghost" href="/discover">
            Add a discovery
          </Link>
        </div>
        {recentDiscoveries.length ? (
          <div className="content-grid">
            {recentDiscoveries.map((discovery) => (
              <article className="specimen-card" key={discovery.id}>
                <img
                  src={discovery.image_url}
                  alt={discovery.image_alt ?? discovery.common_name}
                  className="field-guide-image"
                />
                <div className="field-guide-copy stack">
                  <div className="field-guide-meta-row">
                    <span className="badge">{getDiscoveryCategoryLabel(discovery.category)}</span>
                    <span className="muted">{new Date(discovery.observed_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ margin: 0 }}>{discovery.common_name}</h4>
                  {discovery.scientific_name ? (
                    <p className="muted" style={{ margin: 0 }}>
                      {discovery.scientific_name}
                    </p>
                  ) : null}
                  <div className="chip-list discovery-card-meta">
                    <li>{discovery.student_id ? "Saved for this student" : "Household discovery"}</li>
                    <li>{discovery.confidence_level}</li>
                  </div>
                  <div className="cta-row">
                    <Link className="button button-ghost" href={`/discover/catalog/${discovery.id}`}>
                      Open
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No discoveries saved here yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Household saves and discoveries linked to this student will appear here once the family starts logging finds.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack" id="student-classes">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <TrailIcon />
            </span>
            <div>
              <p className="eyebrow">Upcoming classes</p>
              <h3>Booked field experiences</h3>
            </div>
          </div>
        </div>
        {upcomingBookings.length ? (
          <div className="content-grid">
            {upcomingBookings.map((item) => (
              <article className="note-card student-class-card badge-specimen" key={item.id}>
                <div className="copy">
                  <h4>{item.classes?.title ?? "Booked class"}</h4>
                  <p className="muted" style={{ margin: "8px 0 0" }}>
                    {item.classes?.date ? new Date(item.classes.date).toLocaleDateString() : new Date(item.booked_at).toLocaleDateString()}
                    {item.classes?.location ? ` | ${item.classes.location}` : ""}
                  </p>
                  <div className="cta-row" style={{ marginTop: 14 }}>
                    {item.classes ? (
                      <Link className="button button-ghost" href={`/classes/${item.classes.id}`}>
                        View class
                      </Link>
                    ) : null}
                    <MarkCompleteCard studentId={student.id} classBookingId={item.id} compact initialCompleted={completedBookingIds.has(item.id)} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No upcoming classes yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                When this student has a booked in-person class, it will appear here with quick access for the family.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack" id="student-achievements">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <JournalIcon />
            </span>
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>Recent fieldwork</h3>
            </div>
          </div>
        </div>
        {linkedGenerations.length ? (
          <div className="content-grid">
            {linkedGenerations.slice(0, 4).map((item) => (
              <article className="panel stack specimen-card student-activity-card" key={item.id}>
                <div className="header-row">
                  <span className="pill">{generationKindLabel(item.tool_type)}</span>
                  <span className="muted">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h4 style={{ margin: 0 }}>{item.title}</h4>
                <div className="cta-row">
                  <Link className="button button-ghost" href={`/generations/${item.id}`}>
                    View
                  </Link>
                </div>
                <MarkCompleteCard
                  studentId={student.id}
                  generationId={item.id}
                  compact
                  initialCompleted={completedGenerationIds.has(item.id)}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No recent linked activity</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Generated adventures, animal studies, and plans linked to this student will appear here.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack" id="student-archive">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <BadgeIcon />
            </span>
            <div>
              <p className="eyebrow">Recent unlocks</p>
              <h3>Badges and milestones</h3>
            </div>
          </div>
          <span className="pill">{badges.length + achievements.length} total</span>
        </div>
        {badges.length || achievements.length ? (
          <div className="content-grid">
            {badges.slice(0, 3).map((item) =>
              item.badges ? <BadgeCard key={item.id} badge={item.badges} earnedAt={item.earned_at} /> : null
            )}
            {achievements.slice(0, 2).map((item) =>
              item.achievements ? <AchievementCard key={item.id} achievement={item.achievements} earnedAt={item.earned_at} /> : null
            )}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No unlocks yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Mark the first activity complete and this page will start to come alive with badges and milestones.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <BadgeIcon />
            </span>
            <div>
              <p className="eyebrow">Earned badges</p>
              <h3>Badge collection</h3>
            </div>
          </div>
          <span className="pill">{badges.length} earned</span>
        </div>
        {badges.length ? (
          <div className="content-grid">
            {badges.map((item) =>
              item.badges ? <BadgeCard key={item.id} badge={item.badges} earnedAt={item.earned_at} /> : null
            )}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No badges collected yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Complete adventures to begin earning field-guide badges.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack">
        <div className="header-row field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <JournalIcon />
            </span>
            <div>
              <p className="eyebrow">Completed activities</p>
              <h3>Logged fieldwork</h3>
            </div>
          </div>
          <span className="pill">{recentCompletions.length} logged</span>
        </div>
        {recentCompletions.length ? (
          <div className="content-grid">
            {recentCompletions.slice(0, 6).map((completion) => (
              <article className="note-card badge-specimen" key={completion.id}>
                <div className="copy">
                  <div className="header-row">
                    <span className="pill">{getCompletionBadge(completion)}</span>
                    <span className="muted">{new Date(completion.completed_at).toLocaleDateString()}</span>
                  </div>
                  <h4>{completion.title}</h4>
                  {completion.notes ? (
                    <p className="panel-copy" style={{ margin: "8px 0 0" }}>
                      {completion.notes}
                    </p>
                  ) : null}
                  <p className="muted" style={{ margin: "10px 0 0" }}>
                    {completion.parent_rating ? `Parent rating: ${completion.parent_rating}/5` : "No parent rating"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No completions logged yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Completed activities will show here after a parent marks them done.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel stack">
        <div className="field-section-header">
          <div className="field-section-heading">
            <span className="field-guide-icon-disc">
              <JournalIcon />
            </span>
            <div>
              <p className="eyebrow">Adventure trail</p>
              <h3>Explorer archive</h3>
            </div>
          </div>
        </div>
        <HistoryList
          items={completedAdventures}
          emptyMessage="Completed student-linked generations will show up here after a parent marks one complete."
        />
      </section>
    </div>
  );
}
