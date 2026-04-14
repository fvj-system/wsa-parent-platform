import type { SupabaseClient } from "@supabase/supabase-js";

export type HouseholdContext = {
  householdId: string;
  householdName: string;
  profileName: string;
};

export type HouseholdMemberRecord = {
  user_id: string;
  role: "owner" | "coparent";
  profiles?: {
    id: string;
    full_name: string;
  } | Array<{
    id: string;
    full_name: string;
  }> | null;
};

export type HouseholdInviteRecord = {
  id: string;
  household_id?: string;
  invite_email: string;
  invite_token: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  created_at: string;
  accepted_at: string | null;
};

export async function getHouseholdContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<HouseholdContext> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("household_id, household_name, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile?.household_id) {
    throw new Error("Household not found for this account.");
  }

  return {
    householdId: profile.household_id,
    householdName:
      profile.household_name?.trim() || profile.full_name?.trim() || "WSA Household",
    profileName: profile.full_name?.trim() || "WSA Parent",
  };
}

export async function getHouseholdMembers(
  supabase: SupabaseClient,
  householdId: string,
) {
  const { data, error } = await supabase
    .from("household_memberships")
    .select("user_id, role, profiles:profiles!inner(id, full_name)")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as HouseholdMemberRecord[]).map((item) => ({
    userId: item.user_id,
    role: item.role,
    fullName: Array.isArray(item.profiles)
      ? item.profiles[0]?.full_name ?? "Parent"
      : item.profiles?.full_name ?? "Parent",
  }));
}

export async function getHouseholdInvites(
  supabase: SupabaseClient,
  householdId: string,
) {
  const { data, error } = await supabase
    .from("household_invites")
    .select("id, household_id, invite_email, invite_token, status, created_at, accepted_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as HouseholdInviteRecord[];
}

export async function getHouseholdInviteByToken(
  supabase: SupabaseClient,
  inviteToken: string,
) {
  const { data, error } = await supabase
    .from("household_invites")
    .select("id, household_id, invite_email, invite_token, status, created_at, accepted_at")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as HouseholdInviteRecord | null) ?? null;
}
