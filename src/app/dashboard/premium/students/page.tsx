import { PageShell } from "@/components/page-shell";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { PremiumStudentsManager } from "@/components/premium/PremiumStudentsManager";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listPremiumStudents } from "@/lib/premium/data";

export default async function PremiumStudentsPage() {
  const { supabase, user } = await requireUser();
  const context = await ensurePremiumContext(supabase, user.id);
  const students = await listPremiumStudents(supabase, context.familyId);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title="Students"
      description="Manage student profiles, learning levels, active student status, and progress-ready homeschool records."
    >
      <PremiumPortalTabs />
      <PremiumStudentsManager initialStudents={students} />
    </PageShell>
  );
}
