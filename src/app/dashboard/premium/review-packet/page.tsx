import { PageShell } from "@/components/page-shell";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { ReviewPacketBuilder } from "@/components/premium/ReviewPacketBuilder";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, listPremiumStudents, listReviewPacketsForStudent, resolveActiveStudent } from "@/lib/premium/data";

export default async function PremiumReviewPacketPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const [{ student }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const students = await listPremiumStudents(supabase, context.familyId);
  const activeStudent = resolveActiveStudent(students, student);
  const packets = activeStudent ? await listReviewPacketsForStudent(supabase, context.familyId, activeStudent.id) : [];

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title="Review Packet"
      description="Build printable homeschool packets with subject coverage summaries, evidence lists, and a dedicated human reviewer section."
    >
      <PremiumPortalTabs />
      <ReviewPacketBuilder
        students={students}
        activeStudentId={activeStudent?.id ?? null}
        latestPacket={packets[0] ?? null}
      />
    </PageShell>
  );
}
