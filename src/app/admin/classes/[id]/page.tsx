import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminClassStatusActions } from "@/components/admin-class-status-actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getClassCapacity, getClassDateValue, getClassSpotsLeft, type ClassRecord } from "@/lib/classes";

export default async function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();

  const [{ data: classItem }, { data: bookingRows }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("class_bookings")
      .select("class_id, booking_status")
      .eq("class_id", id)
      .neq("booking_status", "cancelled")
  ]);

  if (!classItem) {
    notFound();
  }

  const classRecord = {
    ...(classItem as ClassRecord),
    enrolled_count: (bookingRows ?? []).length
  } satisfies ClassRecord;

  return (
    <AdminShell
      userLabel={user.email ?? "WSA admin"}
      title={classRecord.title}
      description="Review the parent-facing class details, bridge links, and any bridge-side booking records in one place."
    >
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">{classRecord.is_featured ? "Featured class" : "Class"}</p>
            <h3>{classRecord.title}</h3>
          </div>
          <div className="nav-actions">
            <Link className="button button-ghost" href={`/admin/classes/${id}/edit`}>Edit class</Link>
          </div>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          {classRecord.short_description || classRecord.description || "No summary added yet."}
        </p>
        <ul className="chip-list">
          <li>{getClassDateValue(classRecord) ? new Date(`${getClassDateValue(classRecord)}T00:00:00`).toLocaleDateString() : "Date TBD"}</li>
          <li>{classRecord.start_time && classRecord.end_time ? `${classRecord.start_time} - ${classRecord.end_time}` : "Time TBD"}</li>
          <li>{classRecord.location || "Location TBD"}</li>
          <li>Child ${classRecord.price_child?.toFixed(2) ?? "TBD"}</li>
          <li>Family ${classRecord.price_family?.toFixed(2) ?? "TBD"}</li>
          {getClassSpotsLeft(classRecord) !== null || getClassCapacity(classRecord) !== null ? (
            <li>{getClassSpotsLeft(classRecord) ?? getClassCapacity(classRecord)} spots left</li>
          ) : null}
        </ul>
      </section>

      <section className="result-sections class-detail-grid">
        <section>
          <h4>Status</h4>
          <p>{classRecord.status}</p>
        </section>
        <section>
          <h4>Age range</h4>
          <p>{classRecord.age_range || "All family ages welcome"}</p>
        </section>
        <section>
          <h4>Bridge records</h4>
          <p>{classRecord.enrolled_count ?? 0}</p>
        </section>
        <section>
          <h4>Featured</h4>
          <p>{classRecord.is_featured ? "Yes" : "No"}</p>
        </section>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Registration links</p>
          <h3>Live Jotform handoff</h3>
        </div>
        <div className="result-sections class-detail-grid">
          <section>
            <h4>Child registration</h4>
            <p>{classRecord.registration_link_child || "Not connected yet."}</p>
          </section>
          <section>
            <h4>Family registration</h4>
            <p>{classRecord.registration_link_family || "Not connected yet."}</p>
          </section>
        </div>
        <div className="cta-row">
          {classRecord.registration_link_child ? (
            <a className="button button-primary" href={classRecord.registration_link_child} target="_blank" rel="noreferrer">
              Open child form
            </a>
          ) : null}
          {classRecord.registration_link_family ? (
            <a className="button button-ghost" href={classRecord.registration_link_family} target="_blank" rel="noreferrer">
              Open family form
            </a>
          ) : null}
        </div>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Class content</p>
          <h3>Family-facing detail</h3>
        </div>
        <section>
          <h4>Full description</h4>
          <p>{classRecord.description || "No full description added yet."}</p>
        </section>
        <section>
          <h4>What to bring</h4>
          <p>{classRecord.what_to_bring || "No bring-list added yet."}</p>
        </section>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Actions</p>
          <h3>Status controls</h3>
        </div>
        <AdminClassStatusActions classId={classRecord.id} />
      </section>
    </AdminShell>
  );
}
