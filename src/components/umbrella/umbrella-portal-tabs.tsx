"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const umbrellaTabs = [
  { href: "/dashboard/umbrella", label: "Umbrella Home" },
  { href: "/dashboard/umbrella/families", label: "Families" },
  { href: "/dashboard/umbrella/enrollments", label: "Enrollments" },
  { href: "/dashboard/umbrella/reviews", label: "Reviews" },
  { href: "/dashboard/umbrella/reviewers", label: "Reviewers" },
  { href: "/dashboard/umbrella/compliance", label: "Compliance" },
];

export function UmbrellaPortalTabs() {
  const pathname = usePathname();

  return (
    <section className="panel stack admin-tabs-panel">
      <div className="header-row">
        <div>
          <p className="eyebrow">WSA UmbrellaOS</p>
          <h3>Umbrella-ready workflow and human review tools</h3>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          Human reviewer decision required. AI summaries do not approve reviews.
        </p>
      </div>
      <div className="cta-row admin-tab-row">
        {umbrellaTabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
