import { PageShell } from "@/components/page-shell";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { WorksheetGenerator } from "@/components/premium/WorksheetGenerator";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listPremiumStudents, listWorksheetsForStudent, resolveActiveStudent } from "@/lib/premium/data";

export default async function PremiumWorksheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const [{ student }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const students = await listPremiumStudents(supabase, context.familyId);
  const activeStudent = resolveActiveStudent(students, student);
  const recentWorksheets = activeStudent ? await listWorksheetsForStudent(supabase, context.familyId, activeStudent.id) : [];

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title="Worksheets"
      description="Generate print-friendly homeschool worksheets with saved records for later portfolio evidence and review packets."
    >
      <PremiumPortalTabs />
      <WorksheetGenerator
        students={students}
        activeStudentId={activeStudent?.id ?? null}
        recentWorksheets={recentWorksheets}
      />
    </PageShell>
  );
}
