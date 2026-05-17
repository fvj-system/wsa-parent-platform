import Link from "next/link";

type PublicSiteShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  inviteToken?: string;
};

export function PublicSiteShell({
  children,
  userEmail,
  inviteToken = "",
}: PublicSiteShellProps) {
  const signInHref = inviteToken
    ? `/auth/sign-in?invite=${encodeURIComponent(inviteToken)}`
    : "/auth/sign-in";
  const signUpHref = inviteToken
    ? `/auth/sign-up?invite=${encodeURIComponent(inviteToken)}`
    : "/auth/sign-up";

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
              <Link className="button nav-pill nav-pill-secondary nav-pill-idle" href={signInHref}>
                Family login
              </Link>
              <Link className="button nav-pill nav-pill-primary-link" href={signUpHref}>
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
