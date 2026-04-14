import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  return <SignUpForm inviteToken={typeof params.invite === "string" ? params.invite : ""} />;
}
