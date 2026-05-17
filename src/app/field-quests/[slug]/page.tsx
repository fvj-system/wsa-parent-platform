import { notFound } from "next/navigation";
import { FieldQuestDetail } from "@/components/field-quest-detail";
import { PublicSiteShell } from "@/components/public-site-shell";
import { getHouseholdContext } from "@/lib/households";
import { getFieldQuestSelect, type FieldQuestRecord } from "@/lib/field-quests";
import { createClient } from "@/lib/supabase/server";

function encodeNextPath(slug: string) {
  return encodeURIComponent(`/field-quests/${slug}`);
}

export default async function FieldQuestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quest, error: questError } = await supabase
    .from("field_quests")
    .select(getFieldQuestSelect())
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (questError) {
    throw new Error(questError.message);
  }

  if (!quest) {
    notFound();
  }
  const questRecord = quest as unknown as FieldQuestRecord;

  let students: Array<{ id: string; name: string }> = [];
  let completionNames: string[] = [];

  if (user) {
    const household = await getHouseholdContext(supabase, user.id);

    const [{ data: studentRows }, { data: completionRows }] = await Promise.all([
      supabase
        .from("students")
        .select("id, name")
        .eq("household_id", household.householdId)
        .order("created_at", { ascending: true }),
      supabase
        .from("field_quest_completions")
        .select("student_id, students:students(name)")
        .eq("household_id", household.householdId)
        .eq("quest_id", questRecord.id),
    ]);

    students = ((studentRows ?? []) as Array<{ id: string; name: string }>).slice(0, 10);
    completionNames = (completionRows ?? [])
      .map((item) => {
        const row = item as { students?: { name?: string } | Array<{ name?: string }> | null };
        const student = Array.isArray(row.students) ? row.students[0] : row.students;
        return student?.name?.trim() ?? "";
      })
      .filter(Boolean);
  }

  const linkedClass = questRecord.linked_class_id
    ? await supabase
        .from("classes")
        .select("id, title")
        .eq("id", questRecord.linked_class_id)
        .maybeSingle()
        .then((result) => (result.error ? null : result.data))
    : null;

  const signInHref = `/auth/sign-in?next=${encodeNextPath(slug)}`;
  const signUpHref = `/auth/sign-up?next=${encodeNextPath(slug)}&quest=${encodeURIComponent(slug)}`;

  return (
    <PublicSiteShell userEmail={user?.email ?? null}>
      <FieldQuestDetail
        quest={questRecord}
        userEmail={user?.email ?? null}
        students={students}
        linkedClass={linkedClass}
        completionNames={completionNames}
        signInHref={signInHref}
        signUpHref={signUpHref}
      />
    </PublicSiteShell>
  );
}
