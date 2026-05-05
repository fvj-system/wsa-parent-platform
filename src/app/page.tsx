import { PublicHomePage } from "@/components/public-home-page";
import { createClient } from "@/lib/supabase/server";
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

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const { data: featuredClasses } = await supabase
    .from("classes")
    .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
    .in("status", ["scheduled", "published", "full"])
    .gte("class_date", today)
    .order("is_featured", { ascending: false })
    .order("class_date", { ascending: true })
    .limit(6);

  return (
    <PublicHomePage
      userEmail={user?.email ?? null}
      featuredClasses={sortClasses((featuredClasses ?? []) as ClassRecord[])}
    />
  );
}
