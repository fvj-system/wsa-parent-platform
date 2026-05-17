import { AdminFieldQuestForm } from "@/components/admin-field-quest-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminNewFieldQuestPage() {
  const { supabase, user } = await requireAdmin();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, title")
    .order("class_date", { ascending: true });

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Create Field Quest"
      description="Publish a public outdoor mission that can earn a badge, feed student records, and point families toward classes."
    >
      <AdminFieldQuestForm
        mode="create"
        classOptions={(classes ?? []) as Array<{ id: string; title: string }>}
      />
    </AdminShell>
  );
}
