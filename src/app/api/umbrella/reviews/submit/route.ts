import { NextResponse } from "next/server";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { ensurePremiumContext } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const submitReviewSchema = z.object({
  review_packet_id: z.string().uuid(),
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

    const parsed = submitReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review submission payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const { data: packet, error: packetError } = await supabase
      .from("review_packets")
      .select("id, family_id, student_id, coverage_snapshot")
      .eq("id", parsed.data.review_packet_id)
      .eq("family_id", context.familyId)
      .maybeSingle();

    if (packetError) {
      return NextResponse.json({ error: packetError.message }, { status: 500 });
    }

    if (!packet) {
      return NextResponse.json({ error: "Review packet not found." }, { status: 404 });
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("review_packet_id", packet.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json({ review_id: existingReview.id, already_exists: true });
    }

    const { data: assignment } = await supabase
      .from("reviewer_assignments")
      .select("reviewer_user_id")
      .eq("family_id", packet.family_id)
      .or(`student_id.eq.${packet.student_id},student_id.is.null`)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        family_id: packet.family_id,
        student_id: packet.student_id,
        review_packet_id: packet.id,
        created_by: user.id,
        reviewer_user_id: assignment?.reviewer_user_id ?? null,
        decision: "awaiting_review",
      })
      .select("id, family_id, student_id, review_packet_id, decision, reviewer_user_id, created_at")
      .single();

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    const coverageSnapshot = ((packet as { coverage_snapshot?: Array<Record<string, unknown>> }).coverage_snapshot ?? []) as Array<{
      subject?: string;
      status?: string;
      suggestedNextAction?: string;
    }>;

    if (coverageSnapshot.length) {
      const { data: subjectAreas } = await supabase.from("subject_areas").select("id, name");
      const subjectMap = new Map((subjectAreas ?? []).map((subject) => [subject.name, subject.id]));
      const findingRows = coverageSnapshot
        .map((subject) => {
          const subjectAreaId = subjectMap.get(String(subject.subject ?? ""));
          if (!subjectAreaId) return null;

          return {
            family_id: packet.family_id,
            student_id: packet.student_id,
            review_id: review.id,
            subject_area_id: subjectAreaId,
            ai_summary: `Coverage status entered as ${subject.status ?? "weak"} during packet submission.`,
            reviewer_status: subject.status === "covered" ? "sufficient" : subject.status === "missing" ? "missing" : "weak",
            parent_action_needed: subject.suggestedNextAction ?? null,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      if (findingRows.length) {
        const { error: findingsError } = await supabase.from("review_findings").insert(findingRows);
        if (findingsError) {
          return NextResponse.json({ error: findingsError.message }, { status: 500 });
        }
      }
    }

    const { error: packetUpdateError } = await supabase
      .from("review_packets")
      .update({
        current_status: "submitted",
        submitted_for_review_at: new Date().toISOString(),
      })
      .eq("id", packet.id);

    if (packetUpdateError) {
      return NextResponse.json({ error: packetUpdateError.message }, { status: 500 });
    }

    await logAction({
      supabase,
      actorId: user.id,
      actorType: mapRoleToActorType(context.role),
      familyId: context.familyId,
      studentId: packet.student_id,
      action: "review_submitted_for_human_review",
      targetTable: "reviews",
      targetId: review.id,
      metadata: {
        review_packet_id: packet.id,
        reviewer_assigned: assignment?.reviewer_user_id ?? null,
      },
    });

    return NextResponse.json({ review_id: review.id, already_exists: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
