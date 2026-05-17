import { notFound } from "next/navigation";
import { AdminFieldQuestForm } from "@/components/admin-field-quest-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getFieldQuestSelect, type FieldQuestRecord } from "@/lib/field-quests";

export default async function AdminEditFieldQuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const [{ data: quest }, { data: classes }] = await Promise.all([
    supabase
      .from("field_quests")
      .select(getFieldQuestSelect())
      .eq("id", id)
      .maybeSingle(),
    supabase.from("classes").select("id, title").order("class_date", { ascending: true }),
  ]);

  if (!quest) {
    notFound();
  }
  const questRecord = quest as unknown as FieldQuestRecord;

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={`Edit ${questRecord.title}`}
      description="Update the public mission details, growth hooks, and class linkage."
    >
      <AdminFieldQuestForm
        mode="edit"
        initialValues={questRecord}
        classOptions={(classes ?? []) as Array<{ id: string; title: string }>}
      />
    </AdminShell>
  );
}
