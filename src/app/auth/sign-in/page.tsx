import { redirect } from "next/navigation";
import { AuthLoginPoster } from "@/components/auth-login-poster";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | string[] | undefined) {
  if (typeof value !== "string") return "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);

  if (user) {
    redirect(nextPath || "/dashboard");
  }

  return <AuthLoginPoster />;
}
