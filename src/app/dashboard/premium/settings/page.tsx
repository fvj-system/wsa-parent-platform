import { PageShell } from "@/components/page-shell";
import { PremiumPortalTabs } from "@/components/premium/premium-portal-tabs";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext, homeschoolDisclaimer } from "@/lib/premium/data";

export default async function PremiumSettingsPage() {
  const { supabase, user } = await requireUser();
  await ensurePremiumContext(supabase, user.id);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="WSA Premium Homeschool"
      title="Settings"
      description="Review how the premium homeschool workspace is framed, what the platform supports, and what remains a parent or human reviewer responsibility."
    >
      <PremiumPortalTabs />
      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Compliance framing</p>
            <h3>Safe language for homeschool planning and review support</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>{homeschoolDisclaimer}</p>
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Future hooks</p>
            <h3>Prepared for later integrations</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            Stripe, Jotform, reviewer assignment workflows, export records, and official umbrella partnership steps can be layered onto this premium foundation without changing the family-facing planning flow.
          </p>
        </section>
      </section>
    </PageShell>
  );
}
