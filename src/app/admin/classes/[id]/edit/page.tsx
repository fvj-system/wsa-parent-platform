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
    .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
    .eq("id", id)
    .maybeSingle();

  if (!classItem) {
    notFound();
  }

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={`Edit ${(classItem as ClassRecord).title}`}
      description="Update the parent-facing class card, dates, pricing, and Jotform registration links."
    >
      <AdminClassForm mode="edit" initialValues={classItem as ClassRecord} />
    </AdminShell>
  );
}
