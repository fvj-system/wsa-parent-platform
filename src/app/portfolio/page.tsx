import { PageShell } from "@/components/page-shell";
import { PortfolioStudentCard } from "@/components/portfolio-student-card";
import { requireUser } from "@/lib/auth";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import {
  summarizeOverviewCard,
  type PortfolioOverviewCard
} from "@/lib/portfolio";
import { normalizeStudentBadgeRows, type StudentBadgeRecord } from "@/lib/badges";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function PortfolioPage() {
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const [{ data: students }, { data: completions }, { data: badges }] = await Promise.all([
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_completions")
      .select("id, user_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
      .eq("household_id", household.householdId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("student_badges")
      .select("id, student_id, badge_id, earned_at, source_completion_id, created_at, badges:badges(id, name, description, category, icon, criteria_json, created_at)")
      .order("earned_at", { ascending: false })
  ]);

  const studentRows = (students ?? []) as StudentRecord[];
  const completionRows = (completions ?? []) as ActivityCompletionRecord[];
  const badgeRows = normalizeStudentBadgeRows(badges ?? []) as StudentBadgeRecord[];

  const cards: PortfolioOverviewCard[] = studentRows.map((student) =>
    summarizeOverviewCard({
      student,
      completions: completionRows.filter((item) => item.student_id === student.id),
      badges: badgeRows.filter((item) => item.student_id === student.id)
    })
  );

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Homeschool review"
      title="Student review exports"
      description="Choose a child and open a clean homeschool review packet built from discoveries, projects, worksheets, classes, field trips, badges, and parent notes."
    >
      <section className="content-grid">
        {cards.length ? (
          cards.map((item) => <PortfolioStudentCard key={item.student.id} item={item} />)
        ) : (
          <section className="panel stack">
            <h3>No student portfolios yet</h3>
            <p className="panel-copy">
              Add a student and start saving learning evidence. Portfolio pages will automatically build from discoveries, completed activities, classes, badges, and parent documentation.
            </p>
          </section>
        )}
      </section>
    </PageShell>
  );
}
