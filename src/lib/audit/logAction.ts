import type { SupabaseClient } from "@supabase/supabase-js";
import type { PremiumRole } from "@/lib/premium/types";

type AuditActorType = "parent" | "reviewer" | "admin" | "ai" | "system";

type LogActionInput = {
  supabase: SupabaseClient;
  actorId?: string | null;
  actorType: AuditActorType;
  action: string;
  targetTable: string;
  targetId?: string | null;
  familyId?: string | null;
  studentId?: string | null;
  metadata?: Record<string, unknown>;
};

export function mapRoleToActorType(role: PremiumRole | null | undefined): AuditActorType {
  switch (role) {
    case "reviewer":
      return "reviewer";
    case "admin":
    case "super_admin":
      return "admin";
    case "parent":
    case "student":
    default:
      return "parent";
  }
}

export async function logAction(input: LogActionInput) {
  const { error } = await input.supabase.from("audit_logs").insert({
    family_id: input.familyId ?? null,
    student_id: input.studentId ?? null,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("audit_log_failed", error.message);
    return false;
  }

  return true;
}
