import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction, mapRoleToActorType } from "@/lib/audit/logAction";
import { ensurePremiumContext } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

const reviewerAdminSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("profile"),
    user_id: z.string().uuid(),
    display_name: z.string().trim().min(1).max(120),
    bio: z.string().trim().max(4000).optional(),
    max_family_load: z.number().int().min(1).max(500).default(20),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("assignment"),
    reviewer_user_id: z.string().uuid(),
    family_id: z.string().uuid(),
    student_id: z.string().uuid().optional(),
    notes: z.string().trim().max(4000).optional(),
    active: z.boolean().default(true),
  }),
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = reviewerAdminSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reviewer admin payload." }, { status: 400 });
    }

    const context = await ensurePremiumContext(supabase, user.id);
    if (!context.isStaff) {
      return NextResponse.json({ error: "Admin role required." }, { status: 403 });
    }

    if (parsed.data.action === "profile") {
      const { data, error } = await supabase
        .from("reviewer_profiles")
        .upsert({
          user_id: parsed.data.user_id,
          display_name: parsed.data.display_name,
          bio: parsed.data.bio ?? null,
          active: parsed.data.active,
          max_family_load: parsed.data.max_family_load,
          created_by: user.id,
        }, { onConflict: "user_id" })
        .select("id, user_id, display_name, active, max_family_load")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await logAction({
        supabase,
        actorId: user.id,
        actorType: mapRoleToActorType(context.role),
        action: "reviewer_profile_saved",
        targetTable: "reviewer_profiles",
        targetId: data.id,
        metadata: {
          reviewer_user_id: data.user_id,
          active: data.active,
        },
      });

      return NextResponse.json({ reviewer_profile: data });
    }

    const { data, error } = await supabase
      .from("reviewer_assignments")
      .upsert({
        reviewer_user_id: parsed.data.reviewer_user_id,
        family_id: parsed.data.family_id,
        student_id: parsed.data.student_id ?? null,
        notes: parsed.data.notes ?? null,
        active: parsed.data.active,
        assigned_by: user.id,
      }, { onConflict: "reviewer_user_id,family_id,student_id" })
      .select("id, reviewer_user_id, family_id, student_id, active")
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
      action: "reviewer_assignment_saved",
      targetTable: "reviewer_assignments",
      targetId: data.id,
      metadata: {
        reviewer_user_id: data.reviewer_user_id,
        active: data.active,
      },
    });

    return NextResponse.json({ reviewer_assignment: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
