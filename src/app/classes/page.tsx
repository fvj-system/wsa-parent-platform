import { ClassesCatalog } from "@/components/classes-catalog";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { ClassRecord } from "@/lib/classes";

function sortClasses(items: ClassRecord[]) {
  return [...items].sort((left, right) => {
    if (left.is_featured !== right.is_featured) {
      return left.is_featured ? -1 : 1;
    }

    const leftDate = left.class_date ?? left.date ?? "";
    const rightDate = right.class_date ?? right.date ?? "";
    return leftDate.localeCompare(rightDate);
  });
}

export default async function ClassesPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: upcomingClasses }, { data: pastClasses }, { data: bookingRows }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
      .in("status", ["scheduled", "published", "full"])
      .gte("class_date", today)
      .order("is_featured", { ascending: false })
      .order("class_date", { ascending: true })
      .limit(24),
    supabase
      .from("classes")
      .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
      .in("status", ["completed", "cancelled"])
      .order("class_date", { ascending: false })
      .limit(8),
    supabase
      .from("class_bookings")
      .select("class_id, booking_status")
      .neq("booking_status", "cancelled")
  ]);

  const enrolledByClassId = new Map<string, number>();
  for (const row of bookingRows ?? []) {
    enrolledByClassId.set(row.class_id, (enrolledByClassId.get(row.class_id) ?? 0) + 1);
  }

  const hydrateClasses = (items: ClassRecord[] = []) =>
    items.map((item) => ({
      ...item,
      enrolled_count: enrolledByClassId.get(item.id) ?? null
    }));

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Classes"
      title="Classes"
      description="Browse upcoming Wild Stallion Academy classes, open the details that fit your family, and continue to the live Jotform registration when you are ready."
    >
      <ClassesCatalog
        upcomingClasses={sortClasses(hydrateClasses((upcomingClasses ?? []) as ClassRecord[]))}
        pastClasses={hydrateClasses((pastClasses ?? []) as ClassRecord[])}
      />
    </PageShell>
  );
}
