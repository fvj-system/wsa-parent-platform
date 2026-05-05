import { ClassesCatalog } from "@/components/classes-catalog";
import { ClassesHub } from "@/components/classes-hub";
import { PublicSiteShell } from "@/components/public-site-shell";
import { confirmClassBookingFromSession, getLatestReusableWaiver } from "@/lib/class-bookings";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import type { StudentRecord } from "@/lib/students";

const classSelectFields = "id, title, slug, description, short_description, class_date, start_time, end_time, location, price_child, price_family, capacity, status, image_url, what_to_bring, age_range, registration_link_child, registration_link_family, is_featured, created_at, updated_at, class_type, date, age_min, age_max, price_cents, max_capacity, spots_remaining, waiver_required";

type ClassesPageProps = {
  searchParams?: Promise<{ session_id?: string; group_id?: string; class?: string; canceled?: string }>;
};

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

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);
  let successMessage = "";
  let errorMessage = resolvedSearchParams.canceled ? "Checkout was canceled. Your class registration is still pending until payment is completed." : "";

  if (user && resolvedSearchParams.session_id && resolvedSearchParams.group_id) {
    try {
      await confirmClassBookingFromSession({
        supabase,
        userId: user.id,
        sessionId: resolvedSearchParams.session_id,
        bookingGroupId: resolvedSearchParams.group_id
      });
      successMessage = "Class registration confirmed. Your family booking is now saved.";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Could not confirm the class registration yet.";
    }
  }

  const [{ data: upcomingClasses }, { data: pastClasses }] = await Promise.all([
    supabase
      .from("classes")
      .select(classSelectFields)
      .in("status", ["scheduled", "published", "full"])
      .gte("class_date", today)
      .order("is_featured", { ascending: false })
      .order("class_date", { ascending: true })
      .limit(24),
    supabase
      .from("classes")
      .select(classSelectFields)
      .in("status", ["completed", "cancelled"])
      .order("class_date", { ascending: false })
      .limit(8)
  ]);

  if (user) {
    const household = await getHouseholdContext(supabase, user.id);
    const [{ data: students }, { data: bookings }, reusableWaiver] = await Promise.all([
      supabase
        .from("students")
        .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
        .eq("household_id", household.householdId)
        .order("created_at", { ascending: false }),
      supabase
        .from("class_bookings")
        .select("id, class_id, user_id, household_id, student_id, registration_group_id, group_lead, attendee_count, pricing_mode, waiver_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
        .eq("household_id", household.householdId)
        .neq("booking_status", "cancelled")
        .order("created_at", { ascending: false }),
      getLatestReusableWaiver(supabase, household.householdId)
    ]);

    return (
      <PublicSiteShell userEmail={user.email ?? null}>
        <ClassesHub
          classes={sortClasses((upcomingClasses ?? []) as ClassRecord[])}
          students={(students ?? []) as StudentRecord[]}
          bookings={(bookings ?? []) as ClassBookingRecord[]}
          initialSelectedClassId={resolvedSearchParams.class ?? null}
          reusableWaiver={reusableWaiver}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      </PublicSiteShell>
    );
  }

  const enrolledByClassId = new Map<string, number>();

  const hydrateClasses = (items: ClassRecord[] = []) =>
    items.map((item) => ({
      ...item,
      enrolled_count: enrolledByClassId.get(item.id) ?? null
    }));

  return (
    <PublicSiteShell userEmail={null}>
      <section className="page-header panel">
        <div className="page-header-copy">
          <p className="eyebrow">Classes</p>
          <h1 className="page-title">Outdoor classes for curious Maryland families.</h1>
          <p className="lede">
            Browse upcoming Wild Stallion Academy classes, review what fits your family, and choose the registration path when you are ready.
          </p>
        </div>
      </section>
      <ClassesCatalog
        upcomingClasses={sortClasses(hydrateClasses((upcomingClasses ?? []) as ClassRecord[]))}
        pastClasses={hydrateClasses((pastClasses ?? []) as ClassRecord[])}
        isPublicView={!user}
      />
    </PublicSiteShell>
  );
}
