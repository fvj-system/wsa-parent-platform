import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { ensurePremiumContext } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

const enrollmentSchema = z.object({
  family_id: z.string().uuid(),
  student_id: z.string().uuid(),
  enrollment_status: z.enum(["draft", "active", "paused", "withdrawn", "graduated"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  supervising_entity_status: z.enum(["portfolio_support_only", "partner_umbrella", "wsa_registered_umbrella"]),
  notes: z.string().trim().max(4000).optional(),
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

    const parsed = enrollmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid enrollment payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    if (!context.isStaff) {
      return NextResponse.json({ error: "Admin role required." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("umbrella_enrollments")
      .upsert({
        family_id: parsed.data.family_id,
        student_id: parsed.data.student_id,
        enrollment_status: parsed.data.enrollment_status,
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null,
        supervising_entity_status: parsed.data.supervising_entity_status,
        notes: parsed.data.notes || null,
        created_by: user.id,
      }, { onConflict: "student_id" })
      .select("id, family_id, student_id, enrollment_status, supervising_entity_status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAction({
      supabase,
      actorId: user.id,
      actorType: mapRoleToActorType(context.role),
      familyId: data.family_id,
      studentId: data.student_id,
      action: "umbrella_enrollment_saved",
      targetTable: "umbrella_enrollments",
      targetId: data.id,
      metadata: {
        enrollment_status: data.enrollment_status,
        supervising_entity_status: data.supervising_entity_status,
      },
    });

    return NextResponse.json({ enrollment: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
