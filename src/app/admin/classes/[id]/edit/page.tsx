import { notFound } from "next/navigation";
import { AdminClassForm } from "@/components/admin-class-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import type { ClassRecord } from "@/lib/classes";

export default async function AdminEditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();

  const { data: classItem } = await supabase
    .from("classes")
    .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, internal_notes, waiver_required, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!classItem) {
    notFound();
  }

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={`Edit ${(classItem as ClassRecord).title}`}
      description="Update the published class details, availability, and internal notes."
    >
      <AdminClassForm mode="edit" initialValues={classItem as ClassRecord} />
    </AdminShell>
  );
}
