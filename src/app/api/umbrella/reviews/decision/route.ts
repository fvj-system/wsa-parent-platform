import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { ensurePremiumContext } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

const reviewDecisionSchema = z.object({
  review_id: z.string().uuid(),
  decision: z.enum(["in_review", "approved", "needs_correction", "rejected"]),
  reviewer_summary: z.string().trim().max(4000).optional(),
  correction_notes: z.string().trim().max(4000).optional(),
  due_date: z.string().optional(),
  findings: z.array(
    z.object({
      subject: z.string(),
      reviewer_status: z.enum(["sufficient", "weak", "missing"]),
      reviewer_note: z.string().trim().optional(),
      parent_action_needed: z.string().trim().optional(),
      ai_summary: z.string().trim().optional(),
    }),
  ).default([]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = reviewDecisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review decision payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    if (!context.isReviewer && !context.isStaff) {
      return NextResponse.json({ error: "Reviewer or admin role required." }, { status: 403 });
    }

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, family_id, student_id, review_packet_id")
      .eq("id", parsed.data.review_id)
      .maybeSingle();

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        reviewer_user_id: user.id,
        decision: parsed.data.decision,
        reviewer_summary: parsed.data.reviewer_summary ?? null,
        correction_notes: parsed.data.correction_notes ?? null,
        due_date: parsed.data.decision === "needs_correction" ? parsed.data.due_date ?? null : null,
        reviewed_at: new Date().toISOString(),
        approved_at: parsed.data.decision === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", parsed.data.review_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (parsed.data.findings.length) {
      const { data: subjectAreas, error: subjectError } = await supabase
        .from("subject_areas")
        .select("id, name");

      if (subjectError) {
        return NextResponse.json({ error: subjectError.message }, { status: 500 });
      }

      const subjectMap = new Map((subjectAreas ?? []).map((subject) => [subject.name, subject.id]));
      const findingRows = parsed.data.findings
        .map((finding) => {
          const subjectAreaId = subjectMap.get(finding.subject);
          if (!subjectAreaId) return null;

          return {
            family_id: review.family_id,
            student_id: review.student_id,
            review_id: review.id,
            subject_area_id: subjectAreaId,
            ai_summary: finding.ai_summary ?? null,
            reviewer_status: finding.reviewer_status,
            reviewer_note: finding.reviewer_note ?? null,
            parent_action_needed: finding.parent_action_needed ?? null,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      if (findingRows.length) {
        const { error: findingError } = await supabase
          .from("review_findings")
          .upsert(findingRows, { onConflict: "review_id,subject_area_id" });

        if (findingError) {
          return NextResponse.json({ error: findingError.message }, { status: 500 });
        }
      }
    }

    const { error: packetError } = await supabase
      .from("review_packets")
      .update({
        current_status:
          parsed.data.decision === "approved"
            ? "approved"
            : parsed.data.decision === "needs_correction"
              ? "needs_correction"
              : parsed.data.decision === "rejected"
                ? "rejected"
                : "under_review",
      })
      .eq("id", review.review_packet_id);

    if (packetError) {
      return NextResponse.json({ error: packetError.message }, { status: 500 });
    }

    await logAction({
      supabase,
      actorId: user.id,
      actorType: mapRoleToActorType(context.role),
      familyId: review.family_id,
      studentId: review.student_id,
      action: "review_decision_saved",
      targetTable: "reviews",
      targetId: review.id,
      metadata: {
        decision: parsed.data.decision,
        findings_count: parsed.data.findings.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
