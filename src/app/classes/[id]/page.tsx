import { redirect } from "next/navigation";

export default async function ClassDetailRedirectPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { id } = await params;
  const { canceled } = await searchParams;
  const query = new URLSearchParams({ class: id });

  if (canceled) {
    query.set("canceled", canceled);
  }

  redirect(`/classes?${query.toString()}`);
}
