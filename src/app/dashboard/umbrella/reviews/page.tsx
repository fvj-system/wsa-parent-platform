import { PageShell } from "@/components/page-shell";
import { UmbrellaPortalTabs } from "@/components/umbrella/umbrella-portal-tabs";
import { EvidenceBySubject } from "@/components/umbrella/EvidenceBySubject";
import { ReviewDecisionPanel } from "@/components/umbrella/ReviewDecisionPanel";
import { ReviewerQueue } from "@/components/umbrella/ReviewerQueue";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, loadReviewDetails, listUmbrellaReviews } from "@/lib/premium/data";

export default async function UmbrellaReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const [{ review }, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const reviews = await listUmbrellaReviews(supabase);
  const selectedReview = review ? await loadReviewDetails(supabase, review) : null;
  const packetSubjects =
    ((selectedReview?.review.review_packets as { packet_json?: { subjects?: Array<Record<string, unknown>> } } | undefined)?.packet_json?.subjects ??
      []) as Array<{
      subject: string;
      status: string;
      evidenceCount: number;
      summaryOfLearning?: string;
      parentActionItems?: string;
    }>;

  return (
    <PageShell
      userLabel={user.email ?? "WSA user"}
      eyebrow="WSA UmbrellaOS"
      title="Reviews"
      description="Open submitted packets, work through the subject checklist, and save qualified human reviewer decisions."
    >
      <UmbrellaPortalTabs />
      <section className="content-grid">
        <ReviewerQueue reviews={reviews as Array<Record<string, unknown>>} />

        {selectedReview ? (
          <section className="stack">
            <EvidenceBySubject subjects={packetSubjects} />
            <ReviewDecisionPanel
              reviewId={selectedReview.review.id}
              initialDecision={selectedReview.review.decision as "awaiting_review" | "in_review" | "approved" | "needs_correction" | "rejected"}
              initialSummary={selectedReview.review.reviewer_summary ?? ""}
              initialCorrectionNotes={selectedReview.review.correction_notes ?? ""}
              initialRows={(selectedReview.findings ?? []).map((finding) => ({
                subject: String((finding.subject_areas as { name?: string | null } | undefined)?.name ?? "Subject"),
                reviewer_status: String(finding.reviewer_status ?? "weak") as "sufficient" | "weak" | "missing",
                reviewer_note: String(finding.reviewer_note ?? ""),
                parent_action_needed: String(finding.parent_action_needed ?? ""),
                ai_summary: String(finding.ai_summary ?? ""),
              }))}
            />
          </section>
        ) : (
          <section className="panel stack">
            <h3>Select a review from the queue</h3>
            <p className="panel-copy" style={{ margin: 0 }}>
              Open a submitted packet to see subject evidence, reviewer findings, and decision controls.
            </p>
          </section>
        )}
      </section>
    </PageShell>
  );
}
