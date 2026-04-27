import { PageShell } from "@/components/page-shell";
import { DailyLessonPlan } from "@/components/premium/DailyLessonPlan";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { requireUser } from "@/lib/auth";
import {
  buildCoverageSnapshot,
  ensurePremiumContext,
  getDefaultReviewWindow,
  listLessonsForStudent,
  listPremiumStudents,
  resolveActiveStudent,
} from "@/lib/premium/data";

export default async function PremiumLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const [{ student }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const students = await listPremiumStudents(supabase, context.familyId);
  const activeStudent = resolveActiveStudent(students, student);
  const reviewWindow = getDefaultReviewWindow();
  const coverageBundle = activeStudent
    ? await buildCoverageSnapshot({
        supabase,
        familyId: context.familyId,
        studentId: activeStudent.id,
        startDate: reviewWindow.startDate,
        endDate: reviewWindow.endDate,
      })
    : { coverage: [], evidenceMap: {} };
  const recentPlans = activeStudent ? await listLessonsForStudent(supabase, context.familyId, activeStudent.id) : [];

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title="Lessons"
      description="Generate daily homeschool plans with student levels, time constraints, outdoor options, and Maryland subject awareness."
    >
      <PremiumPortalTabs />
      <DailyLessonPlan
        students={students}
        activeStudentId={activeStudent?.id ?? null}
        coverage={coverageBundle.coverage}
        recentPlans={recentPlans}
      />
    </PageShell>
  );
}
