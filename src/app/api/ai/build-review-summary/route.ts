import { NextResponse } from "next/server";
import { buildReviewSummary } from "@/lib/ai/reviewSummarizer";
import { logGeneration } from "@/lib/ai/logGeneration";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import {
  buildCoverageSnapshot,
  buildPacketSummaryFromCoverage,
  ensurePremiumContext,
  formatGradeLevel,
  formatLevelLabel,
  formatPremiumStudentName,
  homeschoolDisclaimer,
  listPortfolioItemsForStudent,
} from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const buildReviewPacketSchema = z.object({
  student_id: z.string().uuid(),
  review_period_start: z.string().min(1),
  review_period_end: z.string().min(1),
  parent_notes: z.string().trim().max(4000).optional(),
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

    const parsed = buildReviewPacketSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review packet request." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, family_id, first_name, last_name, name, grade_level, reading_level, math_level, created_at")
      .eq("id", parsed.data.student_id)
      .eq("family_id", context.familyId)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const evidenceItems = await listPortfolioItemsForStudent(supabase, context.familyId, parsed.data.student_id);
    const inWindowEvidence = evidenceItems.filter((item) => {
      const date = (item as { activity_date?: string }).activity_date ?? "";
      return date >= parsed.data.review_period_start && date <= parsed.data.review_period_end;
    });
    const coverageBundle = await buildCoverageSnapshot({
      supabase,
      familyId: context.familyId,
      studentId: parsed.data.student_id,
      startDate: parsed.data.review_period_start,
      endDate: parsed.data.review_period_end,
    });

    const summaryResult = await buildReviewSummary({
      student_name: formatPremiumStudentName(student),
      grade_level: formatGradeLevel(student.grade_level),
      reading_level: formatLevelLabel(student.reading_level),
      math_level: formatLevelLabel(student.math_level),
      review_period_start: parsed.data.review_period_start,
      review_period_end: parsed.data.review_period_end,
      coverage: coverageBundle.coverage,
      evidence_titles: inWindowEvidence.map((item) => (item as { title?: string }).title ?? "Evidence"),
    });

    const packetJson = buildPacketSummaryFromCoverage({
      student,
      coverage: coverageBundle.coverage,
      evidenceMap: coverageBundle.evidenceMap,
      evidenceItems: inWindowEvidence as Array<{
        id: string;
        title: string;
        activity_date: string;
        evidence_type: string;
        parent_notes?: string | null;
        tags?: Array<{
          subject_areas?: { name?: string | null } | null;
        }>;
      }>,
      startDate: parsed.data.review_period_start,
      endDate: parsed.data.review_period_end,
      familyName: context.familyName,
      parentName: context.displayName,
      aiSummary: `${summaryResult.summary}\n\n${homeschoolDisclaimer}`,
      parentNotes: parsed.data.parent_notes,
    });

    const { data: packetRow, error: packetError } = await supabase
      .from("review_packets")
      .insert({
        family_id: context.familyId,
        student_id: parsed.data.student_id,
        created_by: user.id,
        review_period_start: parsed.data.review_period_start,
        review_period_end: parsed.data.review_period_end,
        current_status: "draft",
        coverage_snapshot: coverageBundle.coverage,
        packet_json: packetJson,
        ai_summary: summaryResult.summary,
        parent_notes: parsed.data.parent_notes ?? null,
      })
      .select("id, family_id, student_id, review_period_start, review_period_end, current_status, packet_json, coverage_snapshot, ai_summary, parent_notes, created_at, updated_at, submitted_for_review_at")
      .single();

    if (packetError) {
      return NextResponse.json({ error: packetError.message }, { status: 500 });
    }

    await Promise.all([
      logGeneration({
        supabase,
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        userId: user.id,
        feature: "review_summarizer",
        promptSummary: `${parsed.data.review_period_start}:${parsed.data.review_period_end}:${formatPremiumStudentName(student)}`,
        modelUsed: summaryResult.model,
        outputSummary: `Review packet with ${coverageBundle.coverage.length} subject summaries`,
      }),
      logAction({
        supabase,
        actorId: user.id,
        actorType: mapRoleToActorType(context.role),
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        action: "review_packet_generated",
        targetTable: "review_packets",
        targetId: packetRow.id,
        metadata: {
          review_period_start: parsed.data.review_period_start,
          review_period_end: parsed.data.review_period_end,
          used_fallback: summaryResult.usedFallback,
        },
      }),
    ]);

    return NextResponse.json({
      packet: packetRow,
      printable_packet: packetJson,
      warning: summaryResult.usedFallback ? "OpenAI was unavailable, so a fallback organizational summary was used." : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
