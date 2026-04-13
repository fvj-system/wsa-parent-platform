import { ClassesList } from "@/components/classes-list";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { ClassRecord } from "@/lib/classes";
import { WSA_FACEBOOK_URL } from "@/lib/social";

export default async function ClassesPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("classes")
    .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, waiver_required, status, created_at, updated_at")
    .in("status", ["published", "full"])
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .limit(24);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Classes"
      title="In-person classes"
      description="Browse upcoming field-based classes, review the details, and book a student through a calm Stripe checkout flow."
    >
      <section className="panel stack">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Class updates</p>
            <h3>Follow WSA on Facebook</h3>
          </div>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          Follow WSA on Facebook for the freshest announcements. For beta, the booking list below stays reliable because admins can turn Facebook event copy into draft classes before publishing them here.
        </p>
        <div className="cta-row">
          <a className="button button-ghost" href={WSA_FACEBOOK_URL} target="_blank" rel="noreferrer">
            Open Facebook Page
          </a>
        </div>
      </section>

      <ClassesList classes={(data ?? []) as ClassRecord[]} />
    </PageShell>
  );
}
