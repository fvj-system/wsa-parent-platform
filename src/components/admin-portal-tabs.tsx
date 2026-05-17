"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminTabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/field-quests", label: "Field Quests" },
  { href: "/admin/families", label: "Families" },
  { href: "/admin/attendees", label: "Attendees" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/engagement", label: "Engagement" },
];

export function AdminPortalTabs() {
  const pathname = usePathname();

  return (
    <section className="panel stack admin-tabs-panel">
      <div className="header-row">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h3>Operations workspace</h3>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          Internal-only tools for classes, families, attendance, outreach, and engagement.
        </p>
      </div>
      <div className="cta-row admin-tab-row">
        {adminTabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/admin" && pathname.startsWith(`${tab.href}/`));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`button ${active ? "button-primary" : "button-ghost"}`}
              aria-current={active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
