import { AdminClassForm } from "@/components/admin-class-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminNewClassPage() {
  const { user } = await requireAdmin();

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="New class"
      description="Create a new in-person class with the parent-facing details and the internal operational notes in one place."
    >
      <AdminClassForm mode="create" />
    </AdminShell>
  );
}
