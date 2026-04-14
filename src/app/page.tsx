import { redirect } from "next/navigation";
import { AuthLoginPoster } from "@/components/auth-login-poster";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;
  const invite = typeof params.invite === "string" ? params.invite : "";

  if (user) {
    redirect(invite ? `/household?invite=${encodeURIComponent(invite)}` : "/dashboard");
  }

  return <AuthLoginPoster />;
}
