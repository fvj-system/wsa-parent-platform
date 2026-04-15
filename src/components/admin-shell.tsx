import { AdminPortalTabs } from "@/components/admin-portal-tabs";
import { PageShell } from "@/components/page-shell";

type AdminShellProps = {
  userLabel: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({
  userLabel,
  title,
  description,
  children,
}: AdminShellProps) {
  return (
    <PageShell
      userLabel={userLabel}
      eyebrow="Admin"
      title={title}
      description={description}
    >
      <AdminPortalTabs />
      {children}
    </PageShell>
  );
}
