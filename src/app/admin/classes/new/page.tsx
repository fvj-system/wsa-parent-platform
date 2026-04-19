import { AdminClassForm } from "@/components/admin-class-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminNewClassPage() {
  const { user } = await requireAdmin();

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="New class"
      description="Create a parent-facing class card in WSA and connect the live Jotform registration links for child and family checkout."
    >
      <AdminClassForm mode="create" />
    </AdminShell>
  );
}
