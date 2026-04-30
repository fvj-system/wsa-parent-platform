import { NextResponse } from "next/server";
import { generateWorksheet, worksheetRequestSchema } from "@/lib/ai/worksheetGenerator";
import { logGeneration } from "@/lib/ai/logGeneration";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { ensurePremiumContext, listSubjectAreas } from "@/lib/premium/data";
import { normalizeSubjectName } from "@/lib/compliance/marylandSubjects";
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

    const parsed = worksheetRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid worksheet request." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, family_id")
      .eq("id", parsed.data.student_id)
      .eq("family_id", context.familyId)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const normalizedSubject = normalizeSubjectName(parsed.data.subject);
    const priorWorksheetQuery = await supabase
      .from("worksheets")
      .select("id", { count: "exact", head: true })
      .eq("family_id", context.familyId)
      .eq("student_id", parsed.data.student_id);

    const priorWorksheetCount = normalizedSubject
      ? await supabase
          .from("worksheets")
          .select("id", { count: "exact", head: true })
          .eq("family_id", context.familyId)
          .eq("student_id", parsed.data.student_id)
          .eq("subject", normalizedSubject)
      : priorWorksheetQuery;

    if (priorWorksheetCount.error) {
      return NextResponse.json({ error: priorWorksheetCount.error.message }, { status: 500 });
    }

    const result = await generateWorksheet({
      ...parsed.data,
      existing_worksheet_count: priorWorksheetCount.count ?? 0,
    });
    const subjectAreas = await listSubjectAreas(supabase);
    const subjectArea = subjectAreas.find((item) => item.name === normalizedSubject);

    const { data: worksheetRow, error: worksheetError } = await supabase
      .from("worksheets")
      .insert({
        family_id: context.familyId,
        student_id: parsed.data.student_id,
        created_by: user.id,
        subject_area_id: subjectArea?.id ?? null,
        subject: result.worksheet.subject,
        topic: result.worksheet.lesson_title ?? result.worksheet.title,
        difficulty: parsed.data.difficulty,
        number_of_questions: parsed.data.number_of_questions,
        include_answer_key: parsed.data.include_answer_key,
        worksheet_json: result.worksheet,
        answer_key_json: {
          answers: result.worksheet.questions.map((question) => ({
            number: question.number,
            answer: question.answer ?? "",
          })),
        },
        source_model: result.model,
      })
      .select("id")
      .single();

    if (worksheetError) {
      return NextResponse.json({ error: worksheetError.message }, { status: 500 });
    }

    await Promise.all([
      logGeneration({
        supabase,
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        userId: user.id,
        feature: "worksheet_generator",
        promptSummary: `${parsed.data.subject}:${result.worksheet.lesson_title ?? result.worksheet.title}:${parsed.data.difficulty}`,
        modelUsed: result.model,
        outputSummary: `${result.worksheet.title} with ${result.worksheet.questions.length} questions`,
      }),
      logAction({
        supabase,
        actorId: user.id,
        actorType: mapRoleToActorType(context.role),
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        action: "worksheet_generated",
        targetTable: "worksheets",
        targetId: worksheetRow.id,
        metadata: {
          subject: parsed.data.subject,
          lesson_title: result.worksheet.lesson_title ?? result.worksheet.title,
          track_id: result.worksheet.track_id ?? null,
          used_fallback: result.usedFallback,
        },
      }),
    ]);

    return NextResponse.json({
      worksheet_id: worksheetRow.id,
      worksheet: result.worksheet,
      warning: result.usedFallback ? "OpenAI was unavailable, so a high-quality fallback worksheet was used." : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
