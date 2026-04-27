"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const premiumTabs = [
  { href: "/dashboard/premium", label: "Premium Home" },
  { href: "/dashboard/premium/students", label: "Students" },
  { href: "/dashboard/premium/lessons", label: "Lessons" },
  { href: "/dashboard/premium/worksheets", label: "Worksheets" },
  { href: "/dashboard/premium/portfolio", label: "Portfolio" },
  { href: "/dashboard/premium/review-packet", label: "Review Packet" },
  { href: "/dashboard/premium/settings", label: "Settings" },
];

export function PremiumPortalTabs() {
  const pathname = usePathname();

  return (
    <section className="panel stack admin-tabs-panel">
      <div className="header-row">
        <div>
          <p className="eyebrow">WSA Premium Homeschool</p>
          <h3>Planning, portfolio, and documentation workspace</h3>
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          Premium homeschool dashboard tools for daily planning, subject tracking, and review-ready record keeping.
        </p>
      </div>
      <div className="cta-row admin-tab-row">
        {premiumTabs.map((tab) => {
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
