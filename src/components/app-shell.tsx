"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddToHomeScreenPrompt } from "@/components/add-to-home-screen-prompt";
import { ClientSafeBoundary } from "@/components/client-safe-boundary";
import { QuickDiscoverCamera } from "@/components/quick-discover-camera";
import { createClient } from "@/lib/supabase/client";
import { WSA_FACEBOOK_URL } from "@/lib/social";

const primaryNavItems = [
  { href: "/dashboard", label: "Today", className: "nav-pill-primary-link" },
  { href: "/dashboard/premium", label: "Premium", className: "nav-pill-planner-link" }
];

const familyUtilityNavItems = [
  { href: "/dashboard/premium", label: "Premium Home" },
  { href: "/dashboard/premium/students", label: "Students" },
  { href: "/dashboard/premium/lessons", label: "Lessons" },
  { href: "/dashboard/premium/worksheets", label: "Worksheets" },
  { href: "/dashboard/premium/portfolio", label: "Portfolio" },
  { href: "/dashboard/premium/review-packet", label: "Review Packet" },
  { href: "/dashboard/premium/settings", label: "Settings" },
  { href: "/planner", label: "Weekly Planner" },
  { href: "/students", label: "Student Profiles" },
  { href: "/household", label: "Household Sharing" },
  { href: "/nearby-opportunities", label: "Nearby Opportunities" },
  { href: "/geocache", label: "Geocache Trail" },
  { href: "/discover/catalog", label: "Creature Log" },
  { href: "/portfolio", label: "Homeschool Review" },
  { href: "/donate", label: "Donate" },
  { href: "/history", label: "History" },
  { href: "/classes", label: "Classes" },
  { href: "/animal-of-the-day", label: "Animal of the Day" },
  { href: WSA_FACEBOOK_URL, label: "WSA Facebook", external: true }
] as const;

const umbrellaUtilityNavItems = [
  { href: "/dashboard/umbrella", label: "Umbrella Home" },
  { href: "/dashboard/umbrella/families", label: "Families" },
  { href: "/dashboard/umbrella/enrollments", label: "Enrollments" },
  { href: "/dashboard/umbrella/reviews", label: "Reviews" },
  { href: "/dashboard/umbrella/reviewers", label: "Reviewers" },
  { href: "/dashboard/umbrella/compliance", label: "Compliance" }
] as const;

type ShellStudent = {
  id: string;
  name: string;
};

type AppShellProps = {
  userLabel: string;
  children: React.ReactNode;
};

export function AppShell({ userLabel: _userLabel, children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/admin");
  const shouldShowA2hsPrompt = pathname === "/dashboard";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState<ShellStudent[]>([]);
  const [userRole, setUserRole] = useState("parent");

  useEffect(() => {
    if (isAdminPath) {
      setStudents([]);
      return;
    }

    let isMounted = true;

    async function loadNavState() {
      const supabase = createClient();
      const [{ data: studentRows }, authUser] = await Promise.all([
        supabase
          .from("students")
          .select("id, name")
          .order("created_at", { ascending: true }),
        supabase.auth.getUser()
      ]);

      if (authUser.data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.data.user.id)
          .maybeSingle();

        if (isMounted) {
          setUserRole(profile?.role ?? "parent");
        }
      }

      if (!isMounted) return;
      setStudents(((studentRows ?? []) as ShellStudent[]).slice(0, 8));
    }

    void loadNavState();

    return () => {
      isMounted = false;
    };
  }, [isAdminPath]);

  const selectedStudentId = searchParams.get("student") ?? searchParams.get("studentId");
  const selectedAudience = searchParams.get("audience");
  const activeProfileLabel =
    selectedAudience === "household"
      ? "Household"
      : students.find((student) => student.id === selectedStudentId)?.name ?? "Household";
  const visiblePrimaryNavItems = isAdminPath
    ? [{ href: "/admin", label: "Admin", className: "nav-pill-primary-link" }]
    : primaryNavItems;
  const isUmbrellaVisible = ["reviewer", "admin", "super_admin"].includes(userRole);
  const visibleUtilityNavItems = isAdminPath
    ? [
        { href: "/admin", label: "Overview" },
        { href: "/admin/classes", label: "Classes" },
        { href: "/admin/families", label: "Families" },
        { href: "/admin/attendees", label: "Attendees" },
        { href: "/admin/analytics", label: "Analytics" },
        { href: "/admin/engagement", label: "Engagement" },
      ]
    : [...familyUtilityNavItems, ...(isUmbrellaVisible ? umbrellaUtilityNavItems : [])];

  return (
    <main className="shell layout-grid">
      <section className="top-nav top-nav-shell">
        <div className="brand-lockup">
          <Link className="brand-mark" href="/dashboard" aria-label="Wild Stallion Academy dashboard">
            <Image src="/wsa/logo.png" alt="Wild Stallion Academy logo" width={88} height={88} priority />
            <div className="brand-copy">
              <p className="brand-subtitle">Wild Stallion Academy</p>
              <strong>Command Center</strong>
            </div>
          </Link>
        </div>

        <div className="shell-nav-groups">
          <div className="nav-actions nav-actions-shell">
            {visiblePrimaryNavItems.map((item) => (
              <Link
                key={item.href}
                className={`button nav-pill ${item.className ?? ""} ${pathname === item.href ? "nav-pill-active" : "nav-pill-idle"}`}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}

            {!isAdminPath ? (
              <details className="shell-utility-menu shell-profile-menu">
                <summary className="button nav-pill nav-pill-secondary nav-pill-idle">
                  <span className="nav-summary-label">Profile</span>
                  <span className="nav-summary-value">{activeProfileLabel}</span>
                </summary>
                <div className="mobile-nav-more-panel shell-utility-panel shell-profile-panel">
                  <Link
                    className={`button nav-pill nav-pill-secondary ${selectedAudience === "household" ? "nav-pill-active" : "nav-pill-idle"}`}
                    href="/dashboard?audience=household"
                  >
                    Household
                  </Link>
                  {students.map((student) => (
                    <Link
                      key={student.id}
                      className={`button nav-pill nav-pill-secondary ${selectedStudentId === student.id ? "nav-pill-active" : "nav-pill-idle"}`}
                      href={`/dashboard?student=${student.id}`}
                    >
                      {student.name}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <details className="shell-utility-menu">
            <summary className="button nav-pill nav-pill-secondary nav-pill-more nav-pill-idle">More</summary>
            <div className="mobile-nav-more-panel shell-utility-panel">
              {visibleUtilityNavItems.map((item) =>
                "external" in item && item.external ? (
                  <a
                    key={item.href}
                    className="button nav-pill nav-pill-secondary nav-pill-idle"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    className={`button nav-pill nav-pill-secondary ${pathname === item.href ? "nav-pill-active" : "nav-pill-idle"}`}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <button
                type="button"
                className="button nav-pill nav-pill-secondary nav-pill-idle"
                onClick={() => {
                  startTransition(async () => {
                    if (isAdminPath) {
                      await fetch("/api/admin/logout", {
                        method: "POST",
                      });
                    }
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    router.push("/");
                    router.refresh();
                  });
                }}
              >
                {isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </details>
        </div>
      </section>

      {children}

      {!isAdminPath && shouldShowA2hsPrompt ? (
        <ClientSafeBoundary
          fallbackTitle="Install prompt unavailable"
          fallbackMessage="The dashboard can still be used normally while the home screen prompt is skipped."
        >
          <AddToHomeScreenPrompt />
        </ClientSafeBoundary>
      ) : null}

      {!isAdminPath ? (
        <>
          <Link href="/students" className="global-student-fab" aria-label="Open student profiles">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="global-camera-icon">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7.5 2.1-7.5 4.7 0 .4.3.8.8.8h13.4c.5 0 .8-.4.8-.8 0-2.6-3.3-4.7-7.5-4.7Z"
                fill="currentColor"
              />
            </svg>
          </Link>

          <button
            type="button"
            className="global-camera-fab"
            aria-label="Open camera"
            onClick={() => setIsCameraOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="global-camera-icon">
              <path
                d="M8.5 5.5 10 4h4l1.5 1.5H18A2.5 2.5 0 0 1 20.5 8v8A2.5 2.5 0 0 1 18 18.5H6A2.5 2.5 0 0 1 3.5 16V8A2.5 2.5 0 0 1 6 5.5Zm3.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <ClientSafeBoundary
            fallbackTitle="Camera tools unavailable"
            fallbackMessage="Quick Discover can be reopened after a refresh. The rest of the app is still available."
          >
            <QuickDiscoverCamera isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} />
          </ClientSafeBoundary>
        </>
      ) : null}
    </main>
  );
}
