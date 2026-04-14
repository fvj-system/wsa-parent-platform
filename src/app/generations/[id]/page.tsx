import { notFound } from "next/navigation";
import { GenerationDetailView } from "@/components/generation-detail-view";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";
import type { StudentRecord } from "@/lib/students";

export default async function GenerationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const { data: generation } = await supabase
    .from("generations")
    .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
    .eq("household_id", household.householdId)
    .eq("id", id)
    .maybeSingle();

  if (!generation) {
    notFound();
  }

  const input = (generation.input_json ?? {}) as Record<string, unknown>;
  const studentId = generation.student_id ?? (typeof input.studentId === "string" ? input.studentId : null);
  let student: StudentRecord | null = null;

  if (studentId) {
    const { data } = await supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId)
      .eq("id", studentId)
      .maybeSingle();

    student = (data as StudentRecord | null) ?? null;
  }

  const { data: completion } =
    studentId
      ? await supabase
          .from("activity_completions")
          .select("id")
          .eq("household_id", household.householdId)
          .eq("student_id", studentId)
          .eq("generation_id", id)
          .maybeSingle()
      : { data: null };

  return (
    <main className="shell layout-grid">
      <section className="top-nav print-hide">
        <div>
          <span className="crest-mark">Wild Stallion Academy AI</span>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Generation detail
          </p>
        </div>
        <div className="nav-actions">
          <PrintButton autoPrint={print === "1"} />
        </div>
      </section>

      <GenerationDetailView generation={generation as GenerationRecord} student={student} isCompleted={Boolean(completion)} />
    </main>
  );
}
