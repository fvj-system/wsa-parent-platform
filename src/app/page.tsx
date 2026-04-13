import { redirect } from "next/navigation";
import { AuthLoginPoster } from "@/components/auth-login-poster";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthLoginPoster />;
}
