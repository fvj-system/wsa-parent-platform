import { SignUpForm } from "@/components/auth/sign-up-form";

function getSafeNextPath(value: string | undefined) {
  if (!value) return "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "";
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; next?: string; quest?: string }>;
}) {
  const params = await searchParams;
  return (
    <SignUpForm
      inviteToken={typeof params.invite === "string" ? params.invite : ""}
      nextPath={getSafeNextPath(params.next)}
      questSlug={typeof params.quest === "string" ? params.quest : ""}
    />
  );
}
