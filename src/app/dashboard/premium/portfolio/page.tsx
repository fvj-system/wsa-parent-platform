import { PageShell } from "@/components/page-shell";
import { PortfolioEvidenceList } from "@/components/premium/PortfolioEvidenceList";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { PortfolioUploader } from "@/components/premium/PortfolioUploader";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listPortfolioItemsForStudent, listPremiumStudents, resolveActiveStudent } from "@/lib/premium/data";
import type { PortfolioItemRecord } from "@/lib/premium/types";

export default async function PremiumPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const [{ student }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const students = await listPremiumStudents(supabase, context.familyId);
  const activeStudent = resolveActiveStudent(students, student);
  const items = await listPortfolioItemsForStudent(supabase, context.familyId, activeStudent?.id ?? null);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title="Portfolio"
      description="Upload evidence, confirm subject tags, and organize saved records for documentation support and review-ready packets."
    >
      <PremiumPortalTabs />
      <section className="content-grid">
        <PortfolioUploader
          familyId={context.familyId}
          students={students}
          activeStudentId={activeStudent?.id ?? null}
          onCreated={() => {}}
        />
        <PortfolioEvidenceList items={items as PortfolioItemRecord[]} />
      </section>
    </PageShell>
  );
}
