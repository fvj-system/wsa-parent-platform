import { NextResponse } from "next/server";
import { z } from "zod";
import { mapRoleToActorType, logAction } from "@/lib/audit/logAction";
import { ensurePremiumContext } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

const createPremiumStudentSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().max(80).optional(),
  birthdate: z.string().optional(),
  grade_level: z.string().trim().min(1).max(40),
  reading_level: z.string().trim().min(1).max(40),
  math_level: z.string().trim().min(1).max(40),
  science_level: z.string().trim().max(40).optional(),
  writing_level: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(4000).optional(),
  active: z.boolean().optional(),
});

function deriveAge(birthdate?: string, gradeLevel?: string) {
  if (birthdate) {
    const date = new Date(`${birthdate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const birthdayPassed =
        today.getMonth() > date.getMonth() ||
        (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
      if (!birthdayPassed) age -= 1;
      return Math.max(3, Math.min(18, age));
    }
  }

  const gradeNumber = Number.parseInt(gradeLevel ?? "", 10);
  if (!Number.isNaN(gradeNumber)) {
    return Math.max(5, Math.min(18, gradeNumber + 5));
  }

  return 8;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createPremiumStudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid premium student payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    const fullName = [parsed.data.first_name, parsed.data.last_name].filter(Boolean).join(" ");
    const age = deriveAge(parsed.data.birthdate, parsed.data.grade_level);

    if (parsed.data.active) {
      await supabase
        .from("students")
        .update({ active: false })
        .eq("family_id", context.familyId);
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        user_id: user.id,
        household_id: context.householdId,
        family_id: context.familyId,
        name: fullName,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name ?? null,
        birthdate: parsed.data.birthdate || null,
        age,
        grade_level: parsed.data.grade_level,
        reading_level: parsed.data.reading_level,
        math_level: parsed.data.math_level,
        science_level: parsed.data.science_level || null,
        writing_level: parsed.data.writing_level || null,
        active: parsed.data.active ?? false,
        notes: parsed.data.notes || null,
        interests: [],
      })
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
      action: "premium_student_created",
      targetTable: "students",
      targetId: data.id,
      metadata: {
        grade_level: data.grade_level,
        active: data.active,
      },
    });

    return NextResponse.json({ student: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
