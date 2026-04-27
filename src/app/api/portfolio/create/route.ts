import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { normalizeSubjectName } from "@/lib/compliance/marylandSubjects";
import { ensurePremiumContext, listSubjectAreas } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

const createPortfolioItemSchema = z.object({
  student_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(""),
  activity_date: z.string().min(1),
  evidence_type: z.string().trim().min(1).max(60),
  file_url: z.string().trim().url().optional(),
  storage_path: z.string().trim().optional(),
  parent_notes: z.string().trim().max(4000).optional(),
  ai_summary: z.string().trim().max(4000).optional(),
  tags: z.array(
    z.object({
      subject: z.string(),
      confidence_score: z.number().min(0).max(1).optional(),
      rationale: z.string().optional(),
      tagged_by: z.enum(["ai", "parent", "reviewer"]).default("parent"),
      reviewer_confirmed: z.boolean().optional(),
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

    const parsed = createPortfolioItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid portfolio item payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", parsed.data.student_id)
      .eq("family_id", context.familyId)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const { data: item, error: itemError } = await supabase
      .from("portfolio_items")
      .insert({
        family_id: context.familyId,
        student_id: parsed.data.student_id,
        title: parsed.data.title,
        description: parsed.data.description,
        activity_date: parsed.data.activity_date,
        evidence_type: parsed.data.evidence_type,
        file_url: parsed.data.file_url ?? null,
        storage_path: parsed.data.storage_path ?? null,
        parent_notes: parsed.data.parent_notes ?? null,
        ai_summary: parsed.data.ai_summary ?? null,
        created_by: user.id,
      })
      .select("id, family_id, student_id, title, description, activity_date, evidence_type, file_url, storage_path, parent_notes, ai_summary, created_by, created_at, updated_at")
      .single();

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    let tagsInserted = 0;
    if (parsed.data.tags.length) {
      const subjectAreas = await listSubjectAreas(supabase);
      const subjectMap = new Map(subjectAreas.map((subject) => [subject.name, subject.id]));
      const tagRows = parsed.data.tags
        .map((tag) => {
          const normalized = normalizeSubjectName(tag.subject);
          if (!normalized) return null;

          return {
            family_id: context.familyId,
            portfolio_item_id: item.id,
            subject_area_id: subjectMap.get(normalized) ?? null,
            confidence_score: tag.confidence_score ?? 1,
            rationale: tag.rationale ?? null,
            tagged_by: tag.tagged_by,
            reviewer_confirmed: tag.reviewer_confirmed ?? false,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .filter((value) => Boolean(value.subject_area_id));

      if (tagRows.length) {
        const { error: tagError } = await supabase
          .from("portfolio_subject_tags")
          .upsert(tagRows, { onConflict: "portfolio_item_id,subject_area_id" });

        if (tagError) {
          return NextResponse.json({ error: tagError.message }, { status: 500 });
        }

        tagsInserted = tagRows.length;
      }
    }

    await Promise.all([
      logAction({
        supabase,
        actorId: user.id,
        actorType: mapRoleToActorType(context.role),
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        action: "portfolio_item_created",
        targetTable: "portfolio_items",
        targetId: item.id,
        metadata: {
          evidence_type: parsed.data.evidence_type,
          has_file: Boolean(parsed.data.file_url),
        },
      }),
      tagsInserted
        ? logAction({
            supabase,
            actorId: user.id,
            actorType: mapRoleToActorType(context.role),
            familyId: context.familyId,
            studentId: parsed.data.student_id,
            action: "portfolio_item_tagged",
            targetTable: "portfolio_subject_tags",
            targetId: item.id,
            metadata: { tag_count: tagsInserted },
          })
        : Promise.resolve(true),
    ]);

    return NextResponse.json({ item, tag_count: tagsInserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
