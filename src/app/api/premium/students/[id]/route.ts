import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { ensurePremiumContext } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

const updatePremiumStudentSchema = z.object({
  first_name: z.string().trim().min(1).max(80).optional(),
  last_name: z.string().trim().max(80).nullable().optional(),
  birthdate: z.string().nullable().optional(),
  grade_level: z.string().trim().max(40).optional(),
  reading_level: z.string().trim().max(40).optional(),
  math_level: z.string().trim().max(40).optional(),
  science_level: z.string().trim().max(40).nullable().optional(),
  writing_level: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updatePremiumStudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid student update payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const { data: existing, error: existingError } = await supabase
      .from("students")
      .select("id, family_id, first_name, last_name, name")
      .eq("id", resolvedParams.id)
      .eq("family_id", context.familyId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    if (parsed.data.active) {
      await supabase
        .from("students")
        .update({ active: false })
        .eq("family_id", context.familyId);
    }

    const firstName = parsed.data.first_name ?? existing.first_name ?? existing.name;
    const lastName = parsed.data.last_name ?? existing.last_name ?? null;
    const composedName = [firstName, lastName].filter(Boolean).join(" ");

    const updatePayload: Record<string, unknown> = {
      ...parsed.data,
      name: composedName,
      first_name: firstName,
      last_name: lastName,
    };

    const { data, error } = await supabase
      .from("students")
      .update(updatePayload)
      .eq("id", resolvedParams.id)
      .eq("family_id", context.familyId)
      .select("id, family_id, household_id, first_name, last_name, name, birthdate, age, grade_level, reading_level, math_level, science_level, writing_level, active, notes, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAction({
      supabase,
      actorId: user.id,
      actorType: mapRoleToActorType(context.role),
      familyId: context.familyId,
      studentId: data.id,
      action: "premium_student_updated",
      targetTable: "students",
      targetId: data.id,
      metadata: parsed.data,
    });

    return NextResponse.json({ student: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
