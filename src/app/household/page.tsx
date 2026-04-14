import { PageShell } from "@/components/page-shell";
import { HouseholdSharingPanel } from "@/components/household-sharing-panel";
import { requireUser } from "@/lib/auth";
import {
  getHouseholdContext,
  getHouseholdInviteByToken,
  getHouseholdInvites,
  getHouseholdMembers,
} from "@/lib/households";

export default async function HouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const [members, invites, incomingInvite] = await Promise.all([
    getHouseholdMembers(supabase, household.householdId),
    getHouseholdInvites(supabase, household.householdId),
    invite ? getHouseholdInviteByToken(supabase, invite) : Promise.resolve(null),
  ]);

  const actionableIncomingInvite =
    incomingInvite && incomingInvite.household_id !== household.householdId
      ? incomingInvite
      : null;

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Household"
      title="Household sharing"
      description="Invite the other parent, link both logins to one family household, and keep students, discoveries, planner history, and class activity together."
    >
      <HouseholdSharingPanel
        householdName={household.householdName}
        members={members}
        invites={invites}
        incomingInvite={actionableIncomingInvite}
      />
    </PageShell>
  );
}
