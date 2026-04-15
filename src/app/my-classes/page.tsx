import { redirect } from "next/navigation";

export default async function MyClassesPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; booking_id?: string; group_id?: string; class?: string; canceled?: string }>;
}) {
  const { session_id: sessionId, group_id: groupId, class: selectedClassId, canceled } = await searchParams;
  const params = new URLSearchParams();

  if (sessionId) params.set("session_id", sessionId);
  if (groupId) params.set("group_id", groupId);
  if (selectedClassId) params.set("class", selectedClassId);
  if (canceled) params.set("canceled", canceled);

  redirect(params.toString() ? `/classes?${params.toString()}` : "/classes");
}
