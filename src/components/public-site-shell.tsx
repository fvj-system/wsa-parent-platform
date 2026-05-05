import Link from "next/link";

type PublicSiteShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function PublicSiteShell({ children, userEmail }: PublicSiteShellProps) {
  return (
    <main className="shell layout-grid">
      <section className="top-nav top-nav-shell">
        <div className="brand-lockup">
          <Link className="brand-mark" href="/" aria-label="Wild Stallion Academy home">
            <img src="/wsa/logo.png" alt="Wild Stallion Academy logo" width={88} height={88} />
            <div className="brand-copy">
              <p className="brand-subtitle">Wild Stallion Academy</p>
              <strong>Outdoor Learning</strong>
            </div>
          </Link>
        </div>

        <div className="nav-actions nav-actions-shell">
          <Link className="button nav-pill nav-pill-secondary nav-pill-idle" href="/classes">
            Classes
          </Link>
          <Link className="button nav-pill nav-pill-secondary nav-pill-idle" href="/parents">
            Parent FAQ
          </Link>
          {userEmail ? (
            <Link className="button nav-pill nav-pill-primary-link" href="/dashboard">
              Dashboard
            </Link>
          ) : (
            <>
              <Link className="button nav-pill nav-pill-secondary nav-pill-idle" href="/auth/sign-in">
                Family login
              </Link>
              <Link className="button nav-pill nav-pill-primary-link" href="/auth/sign-up">
                Create account
              </Link>
            </>
          )}
        </div>
      </section>

      {children}
    </main>
  );
}
