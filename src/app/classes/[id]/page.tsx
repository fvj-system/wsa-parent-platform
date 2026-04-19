import { notFound } from "next/navigation";
import { ClassDetailView } from "@/components/class-detail-view";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { ClassRecord } from "@/lib/classes";

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function findClassRecord(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], idOrSlug: string) {
  const bySlug = await supabase
    .from("classes")
    .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
    .eq("slug", idOrSlug)
    .maybeSingle();

  if (bySlug.data) {
    return bySlug.data as ClassRecord;
  }

  if (!isUuidLike(idOrSlug)) {
    return null;
  }

  const byId = await supabase
    .from("classes")
    .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
    .eq("id", idOrSlug)
    .maybeSingle();

  return (byId.data as ClassRecord | null) ?? null;
}

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const classItem = await findClassRecord(supabase, id);

  if (!classItem || classItem.status === "archived") {
    notFound();
  }

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Classes"
      title={classItem.title}
      description="Review the full class details, then use the live Jotform buttons to register as a child or as a family."
    >
      <ClassDetailView classItem={classItem} />
    </PageShell>
  );
}
