import { NextResponse } from "next/server";
import { logGeneration } from "@/lib/ai/logGeneration";
import { portfolioTaggerRequestSchema, suggestPortfolioTags } from "@/lib/ai/portfolioTagger";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { normalizeSubjectName } from "@/lib/compliance/marylandSubjects";
import { ensurePremiumContext, listSubjectAreas } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = portfolioTaggerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid portfolio tagging request." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const result = await suggestPortfolioTags(parsed.data);

    if (typeof body.portfolio_item_id === "string" && body.portfolio_item_id) {
      const { data: item, error: itemError } = await supabase
        .from("portfolio_items")
        .select("id, family_id, student_id")
        .eq("id", body.portfolio_item_id)
        .eq("family_id", context.familyId)
        .maybeSingle();

      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 });
      }

      if (item) {
        const subjectAreas = await listSubjectAreas(supabase);
        const subjectMap = new Map(subjectAreas.map((subject) => [subject.name, subject.id]));
        const tagRows = result.suggestions
          .map((tag) => {
            const subject = normalizeSubjectName(tag.subject);
            if (!subject) return null;

            return {
              family_id: context.familyId,
              portfolio_item_id: item.id,
              subject_area_id: subjectMap.get(subject) ?? null,
              confidence_score: tag.confidence_score,
              rationale: tag.reason,
              tagged_by: "ai" as const,
              reviewer_confirmed: false,
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

          await logAction({
            supabase,
            actorId: user.id,
            actorType: mapRoleToActorType(context.role),
            familyId: context.familyId,
            studentId: item.student_id,
            action: "portfolio_item_tagged",
            targetTable: "portfolio_subject_tags",
            targetId: item.id,
            metadata: {
              source: "ai",
              suggestions: result.suggestions.length,
            },
          });
        }
      }
    }

    await logGeneration({
      supabase,
      familyId: context.familyId,
      userId: user.id,
      feature: "portfolio_tagger",
      promptSummary: `${parsed.data.evidence_type}:${parsed.data.title.slice(0, 80)}`,
      modelUsed: result.model,
      outputSummary: `${result.suggestions.length} suggested tags`,
    });

    return NextResponse.json({
      suggestions: result.suggestions,
      warning: result.usedFallback ? "OpenAI was unavailable, so fallback subject suggestions were used." : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
