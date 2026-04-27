import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext } from "@/lib/premium/data";

export default async function PremiumWorksheetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print_answer_key?: string }>;
}) {
  const [{ id }, resolvedSearchParams, { supabase, user }] = await Promise.all([params, searchParams, requireUser()]);
  const context = await ensurePremiumContext(supabase, user.id);
  const showAnswerKey = resolvedSearchParams.print_answer_key === "true";

  const { data: worksheet, error } = await supabase
    .from("worksheets")
    .select("id, subject, topic, difficulty, include_answer_key, worksheet_json, answer_key_json, created_at")
    .eq("id", id)
    .eq("family_id", context.familyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const payload = (worksheet?.worksheet_json as {
    title?: string;
    student_name?: string;
    date?: string;
    instructions?: string;
    questions?: Array<{ number: number; prompt: string; choices?: string[] }>;
    parent_notes?: string;
  } | null) ?? null;
  const answers = ((worksheet?.answer_key_json as { answers?: Array<{ number: number; answer: string }> } | null)?.answers ?? []);

  return (
    <AppShell userLabel={user.email ?? "WSA family"}>
      <section className="panel stack premium-print-packet">
        <div className="header-row">
          <div>
            <p className="eyebrow">Printable worksheet</p>
            <h1 className="page-title">{payload?.title ?? "Worksheet"}</h1>
          </div>
          <PrintButton />
        </div>

        <section>
          <p>Name: _____________________________</p>
          <p>Date: _____________________________</p>
          <p>Student: {payload?.student_name ?? "Student"}</p>
          <p>Instructions: {payload?.instructions ?? "Complete the worksheet."}</p>
        </section>

        <section className="stack">
          {(payload?.questions ?? []).map((question) => (
            <article key={question.number} className="premium-inline-card">
              <strong>{question.number}. {question.prompt}</strong>
              {question.choices?.length ? <span>{question.choices.join(" | ")}</span> : null}
            </article>
          ))}
        </section>

        <section>
          <h3>Parent notes</h3>
          <p>{payload?.parent_notes ?? "Use this worksheet as one saved sample for the portfolio."}</p>
        </section>

        {showAnswerKey || worksheet?.include_answer_key ? (
          <section>
            <h3>Answer key</h3>
            <div className="stack">
              {answers.map((answer) => (
                <article key={answer.number} className="premium-inline-card">
                  <strong>{answer.number}</strong>
                  <span>{answer.answer}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
