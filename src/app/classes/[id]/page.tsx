import { notFound } from "next/navigation";
import { ClassBookingForm } from "@/components/class-booking-form";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function ClassDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { id } = await params;
  const { canceled } = await searchParams;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const [{ data: classItem }, { data: students }, { data: bookings }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, household_id, student_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
      .eq("household_id", household.householdId)
      .eq("class_id", id)
  ]);

  if (!classItem) {
    notFound();
  }

  const studentMap = new Map(((students ?? []) as StudentRecord[]).map((student) => [student.id, student.name]));
  const existingBookings = ((bookings ?? []) as ClassBookingRecord[]).map((item) => ({
    ...item,
    studentName: item.student_id ? studentMap.get(item.student_id) ?? "Student" : "Student"
  }));

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Classes"
      title={(classItem as ClassRecord).title}
      description="Review the full class details, choose the attending student, and complete booking through Stripe Checkout."
    >
      {canceled === "1" ? <p className="error">Checkout was canceled. Your booking was not completed.</p> : null}

      <section className="content-grid">
        <article className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">{(classItem as ClassRecord).class_type}</p>
              <h3>{(classItem as ClassRecord).title}</h3>
            </div>
            <span className="pill">{(classItem as ClassRecord).status}</span>
          </div>

          <p className="panel-copy" style={{ margin: 0 }}>
            {(classItem as ClassRecord).description || "Class details coming soon."}
          </p>

          <div className="chip-list">
            <li>{new Date((classItem as ClassRecord).date).toLocaleDateString()}</li>
            <li>{(classItem as ClassRecord).start_time} - {(classItem as ClassRecord).end_time}</li>
            <li>{(classItem as ClassRecord).location || "Location TBD"}</li>
            <li>${((classItem as ClassRecord).price_cents / 100).toFixed(2)}</li>
          </div>

          <div className="result-sections">
            <section>
              <h4>Age range</h4>
              <p>
                {(classItem as ClassRecord).age_min ?? "?"} - {(classItem as ClassRecord).age_max ?? "?"}
              </p>
            </section>
            <section>
              <h4>Capacity</h4>
              <p>
                {(classItem as ClassRecord).spots_remaining} spots remaining out of {(classItem as ClassRecord).max_capacity}
              </p>
            </section>
            <section>
              <h4>What to bring</h4>
              <p>{(classItem as ClassRecord).what_to_bring || "Bring water, weather-ready layers, and sturdy shoes."}</p>
            </section>
            <section>
              <h4>Weather note</h4>
              <p>{(classItem as ClassRecord).weather_note || "Weather guidance will be shared before class."}</p>
            </section>
            <section>
              <h4>Waiver</h4>
              <p>{(classItem as ClassRecord).waiver_required ? "A waiver is required for attendance." : "No waiver is required for this class."}</p>
            </section>
          </div>
        </article>

        <ClassBookingForm
          classItem={classItem as ClassRecord}
          students={(students ?? []) as StudentRecord[]}
          existingBookings={existingBookings}
        />
      </section>
    </PageShell>
  );
}
