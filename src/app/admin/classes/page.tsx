import Link from "next/link";
import { AdminClassStatusActions } from "@/components/admin-class-status-actions";
import { AdminClassImportCard } from "@/components/admin-class-import-card";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getClassCapacity, getClassDateValue, getClassSpotsLeft, type ClassRecord } from "@/lib/classes";

export default async function AdminClassesPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const { supabase, user } = await requireAdmin();
  const today = new Date().toISOString().slice(0, 10);

  let classQuery = supabase
    .from("classes")
    .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
    .order("is_featured", { ascending: false })
    .order("class_date", { ascending: true });

  if (filter === "featured") classQuery = classQuery.eq("is_featured", true);
  if (filter === "scheduled") classQuery = classQuery.eq("status", "scheduled");
  if (filter === "full") classQuery = classQuery.eq("status", "full");
  if (filter === "draft") classQuery = classQuery.eq("status", "draft");
  if (filter === "archived") classQuery = classQuery.eq("status", "archived");
  if (filter === "completed") classQuery = classQuery.eq("status", "completed");
  if (filter === "upcoming") classQuery = classQuery.gte("class_date", today).in("status", ["scheduled", "published", "full"]);

  const [{ data: classes }, { data: bookingRows }] = await Promise.all([
    classQuery,
    supabase
      .from("class_bookings")
      .select("class_id, booking_status")
      .neq("booking_status", "cancelled")
  ]);

  const bookingCountByClassId = new Map<string, number>();
  for (const row of bookingRows ?? []) {
    bookingCountByClassId.set(row.class_id, (bookingCountByClassId.get(row.class_id) ?? 0) + 1);
  }

  const classRows = ((classes ?? []) as ClassRecord[]).map((item) => ({
    ...item,
    enrolled_count: bookingCountByClassId.get(item.id) ?? 0
  }));

  const metrics = {
    upcoming: classRows.filter((item) => {
      const classDate = getClassDateValue(item);
      return Boolean(classDate && classDate >= today && (item.status === "scheduled" || item.status === "published" || item.status === "full"));
    }).length,
    featured: classRows.filter((item) => item.is_featured).length,
    drafts: classRows.filter((item) => item.status === "draft").length,
    archived: classRows.filter((item) => item.status === "archived").length
  };

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title="Classes"
      description="Manage the parent-facing class catalog here, while Jotform stays the live registration and Stripe checkout layer."
    >
      <section className="stats-grid">
        <article className="stat"><span>Upcoming</span><strong>{metrics.upcoming}</strong></article>
        <article className="stat"><span>Featured</span><strong>{metrics.featured}</strong></article>
        <article className="stat"><span>Drafts</span><strong>{metrics.drafts}</strong></article>
        <article className="stat"><span>Archived</span><strong>{metrics.archived}</strong></article>
      </section>

      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Class catalog operations</h3>
          </div>
          <Link className="button button-primary" href="/admin/classes/new">
            Create class
          </Link>
        </div>
        <div className="cta-row">
          <Link className="button button-ghost" href="/admin/classes?filter=upcoming">Upcoming</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=featured">Featured</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=scheduled">Scheduled</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=draft">Drafts</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=full">Full</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=completed">Completed</Link>
          <Link className="button button-ghost" href="/admin/classes?filter=archived">Archived</Link>
        </div>
      </section>

      <AdminClassImportCard />

      <section className="stack">
        {classRows.length ? (
          classRows.map((item) => (
            <article className="panel stack" key={item.id}>
              <div className="header-row">
                <div>
                  <p className="eyebrow">{item.is_featured ? "Featured class" : "Class"}</p>
                  <h3>{item.title}</h3>
                </div>
                <span className="pill">{item.status}</span>
              </div>
              <p className="panel-copy" style={{ margin: 0 }}>
                {item.short_description || item.description || "No short description added yet."}
              </p>
              <ul className="chip-list">
                <li>{getClassDateValue(item) ? new Date(`${getClassDateValue(item)}T00:00:00`).toLocaleDateString() : "Date TBD"}</li>
                <li>{item.location || "Location TBD"}</li>
                <li>Child ${item.price_child?.toFixed(2) ?? "TBD"}</li>
                <li>Family ${item.price_family?.toFixed(2) ?? "TBD"}</li>
                {getClassSpotsLeft(item) !== null || getClassCapacity(item) !== null ? (
                  <li>{getClassSpotsLeft(item) ?? getClassCapacity(item)} spots left</li>
                ) : null}
                <li>{item.enrolled_count ?? 0} bridge records</li>
              </ul>
              <div className="cta-row">
                <Link className="button button-primary" href={`/admin/classes/${item.id}`}>View</Link>
                <Link className="button button-ghost" href={`/admin/classes/${item.id}/edit`}>Edit</Link>
              </div>
              <AdminClassStatusActions classId={item.id} />
            </article>
          ))
        ) : (
          <section className="panel stack">
            <h3>No classes match this filter</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Create a new class or switch filters to see more catalog entries.
            </p>
          </section>
        )}
      </section>
    </AdminShell>
  );
}
