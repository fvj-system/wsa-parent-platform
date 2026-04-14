"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type HouseholdSharingPanelProps = {
  householdName: string;
  members: Array<{
    userId: string;
    fullName: string;
    role: "owner" | "coparent";
  }>;
  invites: Array<{
    id: string;
    household_id?: string;
    invite_email: string;
    invite_token: string;
    status: string;
    created_at: string;
    accepted_at: string | null;
  }>;
  incomingInvite?: {
    id: string;
    household_id?: string;
    invite_email: string;
    invite_token: string;
    status: string;
    created_at: string;
    accepted_at: string | null;
  } | null;
};

export function HouseholdSharingPanel({
  householdName,
  members,
  invites,
  incomingInvite,
}: HouseholdSharingPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isPending, startTransition] = useTransition();

  const pendingInvite = useMemo(() => incomingInvite ?? null, [incomingInvite]);

  return (
    <section className="content-grid">
      <article className="panel stack">
        <div>
          <p className="eyebrow">Household sharing</p>
          <h3>{householdName}</h3>
          <p className="panel-copy">
            Invite the other parent with their own login so both of you can work
            inside the same family household.
          </p>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setSuccess("");
            setInviteLink("");
            const formData = new FormData(event.currentTarget);
            const inviteEmail = String(formData.get("inviteEmail") || "").trim();

            startTransition(async () => {
              const response = await fetch("/api/household/invite", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ inviteEmail }),
              });

              const payload = (await response.json()) as
                | { inviteLink: string; email: string }
                | { error: string };

              if (!response.ok || "error" in payload) {
                setError("error" in payload ? payload.error : "Could not create invite.");
                return;
              }

              setSuccess(`Invite ready for ${payload.email}. Share the link below with the other parent.`);
              setInviteLink(payload.inviteLink);
              event.currentTarget.reset();
              router.refresh();
            });
          }}
        >
          <label>
            Invite co-parent by email
            <input
              name="inviteEmail"
              type="email"
              placeholder="otherparent@example.com"
              required
            />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Creating invite..." : "Create co-parent invite"}
          </button>
          {success ? <p className="success">{success}</p> : null}
          {error ? <p className="error">{error}</p> : null}
          {inviteLink ? (
            <label>
              Share this invite link
              <input value={inviteLink} readOnly />
            </label>
          ) : null}
        </form>
      </article>

      <article className="panel stack">
        <div>
          <p className="eyebrow">Linked parents</p>
          <h3>{members.length > 1 ? "Co-parent access is active" : "Only one parent linked so far"}</h3>
          <p className="panel-copy">
            These accounts can use the same household, students, planner history,
            and discovery log.
          </p>
        </div>

        <div className="dashboard-opportunity-list">
          {members.map((member) => (
            <article className="dashboard-opportunity-row" key={member.userId}>
              <div className="dashboard-opportunity-row-top">
                <div className="field-guide-meta-row">
                  <span className="badge">
                    {member.role === "owner" ? "Owner" : "Co-parent"}
                  </span>
                </div>
              </div>
              <h4 className="dashboard-opportunity-title">{member.fullName}</h4>
            </article>
          ))}
        </div>
      </article>

      <article className="panel stack" style={{ gridColumn: "1 / -1" }}>
        <div>
          <p className="eyebrow">Pending invites</p>
          <h3>{invites.length ? "Share one of these links with the other parent" : "No invites yet"}</h3>
          <p className="panel-copy">
            Beta-safe version: the app creates the invite and checks the invited
            email, and you share the link manually.
          </p>
        </div>

        {pendingInvite && pendingInvite.status === "pending" ? (
          <div className="trail-note trail-note-framed stack">
            <div>
              <p className="eyebrow">Invite ready to accept</p>
              <h4 style={{ marginTop: 4 }}>{pendingInvite.invite_email}</h4>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setError("");
                setSuccess("");

                startTransition(async () => {
                  const response = await fetch("/api/household/accept", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token: pendingInvite.invite_token }),
                  });

                  const payload = (await response.json()) as
                    | { success: true }
                    | { error: string };

                  if (!response.ok || "error" in payload) {
                    setError("error" in payload ? payload.error : "Could not accept invite.");
                    return;
                  }

                  setSuccess("Household invite accepted. This account now shares the same family household.");
                  router.replace("/household");
                  router.refresh();
                });
              }}
            >
              {isPending ? "Accepting..." : "Accept household invite"}
            </button>
          </div>
        ) : null}

        {invites.length ? (
          <div className="dashboard-opportunity-list">
            {invites.map((invite) => (
              <article className="dashboard-opportunity-row" key={invite.id}>
                <div className="dashboard-opportunity-row-top">
                  <div className="field-guide-meta-row">
                    <span className="badge">{invite.status}</span>
                    <span className="muted">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <h4 className="dashboard-opportunity-title">{invite.invite_email}</h4>
                <p className="dashboard-opportunity-description">
                  {invite.status === "accepted"
                    ? `Accepted${invite.accepted_at ? ` on ${new Date(invite.accepted_at).toLocaleDateString()}` : ""}.`
                    : "Waiting for that parent to sign in and open the invite link."}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
