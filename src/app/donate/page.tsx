import { DonationSupportPanel } from "@/components/donation-support-panel";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";

export default async function DonatePage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; canceled?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { user } = await requireUser();

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Support"
      title="Support Wild Stallion Academy"
      description="If your family is using the app and wants to help a little, this page keeps donations simple and secure."
    >
      <DonationSupportPanel
        success={resolvedSearchParams.success === "1"}
        canceled={resolvedSearchParams.canceled === "1"}
      />
    </PageShell>
  );
}
