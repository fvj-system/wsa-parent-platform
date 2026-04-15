import { redirect } from "next/navigation";
import { createAdminClient, readAdminSession } from "@/lib/admin-session";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return { supabase, user };
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const adminSession = await readAdminSession();

    if (!adminSession) {
      redirect("/");
    }

    return {
      supabase: createAdminClient(),
      user: {
        id: "wsa-admin-session",
        email: adminSession.username,
      },
      profile: null,
      adminSession,
    };
  }

  const adminEmails = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, household_name, phone, is_admin, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const isAdmin = Boolean(profile?.is_admin) || (user.email ? adminEmails.includes(user.email.toLowerCase()) : false);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return { supabase: createAdminClient(), user, profile };
}
