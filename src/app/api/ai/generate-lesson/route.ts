import { NextResponse } from "next/server";
import { logGeneration } from "@/lib/ai/logGeneration";
import { generateLessonPlan, lessonPlanRequestSchema } from "@/lib/ai/lessonPlanner";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
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

    const parsed = lessonPlanRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lesson plan request." }, { status: 400 });
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

    const result = await generateLessonPlan(parsed.data);
    const subjectAreas = await listSubjectAreas(supabase);
    const subjectMap = new Map(subjectAreas.map((subject) => [subject.name, subject.id]));

    const { data: lessonRow, error: lessonError } = await supabase
      .from("lesson_plans")
      .insert({
        family_id: context.familyId,
        student_id: parsed.data.student_id,
        created_by: user.id,
        plan_date: result.plan.date,
        title: result.plan.title,
        theme: result.plan.theme,
        plan_type: parsed.data.plan_type,
        preferred_learning_style: parsed.data.preferred_learning_style ?? null,
        parent_available_time_minutes: parsed.data.parent_available_time ?? null,
        outdoor_option: parsed.data.outdoor_option,
        estimated_total_minutes: result.plan.estimated_total_minutes,
        weak_subjects: parsed.data.weak_or_missing_subjects,
        source_model: result.model,
        raw_output: result.plan,
      })
      .select("id")
      .single();

    if (lessonError) {
      return NextResponse.json({ error: lessonError.message }, { status: 500 });
    }

    const assignmentRows = result.plan.assignments.map((assignment) => ({
      lesson_plan_id: lessonRow.id,
      family_id: context.familyId,
      student_id: parsed.data.student_id,
      subject_area_id: subjectMap.get(assignment.subject) ?? null,
      subject_name: assignment.subject,
      activity_title: assignment.activity_title,
      instructions: assignment.instructions,
      evidence_to_save: assignment.evidence_to_save,
      estimated_minutes: assignment.estimated_minutes,
      materials: assignment.materials,
      parent_notes: assignment.parent_notes,
    }));

    const { error: assignmentError } = await supabase.from("daily_assignments").insert(assignmentRows);
    if (assignmentError) {
      return NextResponse.json({ error: assignmentError.message }, { status: 500 });
    }

    await Promise.all([
      logGeneration({
        supabase,
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        userId: user.id,
        feature: "lesson_planner",
        promptSummary: `${parsed.data.plan_type}:${parsed.data.theme ?? "no-theme"}:${parsed.data.weak_or_missing_subjects.join(",")}`,
        modelUsed: result.model,
        outputSummary: `${result.plan.title} with ${result.plan.assignments.length} assignments`,
      }),
      logAction({
        supabase,
        actorId: user.id,
        actorType: mapRoleToActorType(context.role),
        familyId: context.familyId,
        studentId: parsed.data.student_id,
        action: "lesson_generated",
        targetTable: "lesson_plans",
        targetId: lessonRow.id,
        metadata: {
          plan_type: parsed.data.plan_type,
          used_fallback: result.usedFallback,
        },
      }),
    ]);

    return NextResponse.json({
      lesson_plan_id: lessonRow.id,
      plan: result.plan,
      warning: result.usedFallback ? "OpenAI was unavailable, so a high-quality fallback lesson plan was used." : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
