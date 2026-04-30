import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth";
import { ensurePremiumContext } from "@/lib/premium/data";
import type { WorksheetPayload, WorksheetQuestion, WorksheetSection } from "@/lib/premium/types";

function renderWorkspaceLines(count: number | undefined) {
  const lineCount = Math.max(0, Math.min(count ?? 0, 6));
  if (!lineCount) return null;

  return (
    <div className="premium-answer-lines" aria-hidden="true">
      {Array.from({ length: lineCount }, (_, index) => (
        <div key={index} className="premium-answer-line" />
      ))}
    </div>
  );
}

function renderQuestion(question: WorksheetQuestion) {
  return (
    <article key={question.number} className="premium-inline-card">
      <strong>
        {question.number}. {question.prompt}
      </strong>
      {question.choices?.length ? (
        <div className="stack" style={{ gap: 6 }}>
          {question.choices.map((choice) => (
            <span key={choice}>{choice}</span>
          ))}
        </div>
      ) : null}
      {question.hint ? <span className="muted">Hint: {question.hint}</span> : null}
      {renderWorkspaceLines(question.workspace_lines)}
    </article>
  );
}

function renderSection(section: WorksheetSection) {
  return (
    <article key={`${section.kind}-${section.title}`} className="premium-inline-card">
      <strong>{section.title}</strong>
      <p className="panel-copy" style={{ margin: 0 }}>{section.body}</p>
      {section.bullets?.length ? (
        <ul className="premium-list">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

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

  const payload = (worksheet?.worksheet_json as WorksheetPayload | null) ?? null;
  const answers = ((worksheet?.answer_key_json as { answers?: Array<{ number: number; answer: string }> } | null)?.answers ?? []);

  return (
    <AppShell userLabel={user.email ?? "WSA family"}>
      <section className="panel stack premium-print-packet">
        <div className="header-row">
          <div>
            <p className="eyebrow">Printable worksheet</p>
            <h1 className="page-title">{payload?.title ?? "Worksheet"}</h1>
            {payload?.track_title ? <p className="panel-copy" style={{ margin: "8px 0 0" }}>{payload.track_title}</p> : null}
          </div>
          <PrintButton />
        </div>

        <section>
          <p>Name: _____________________________</p>
          <p>Date: _____________________________</p>
          <p>Student: {payload?.student_name ?? "Student"}</p>
          <p>Subject: {payload?.subject ?? worksheet?.subject ?? "Worksheet"}</p>
          {payload?.lesson_number && payload?.total_lessons ? (
            <p>
              Lesson: {payload.lesson_number} of {payload.total_lessons}
            </p>
          ) : null}
          <p>Instructions: {payload?.instructions ?? "Complete the worksheet."}</p>
        </section>

        {payload?.learning_objective || payload?.essential_question || payload?.materials?.length ? (
          <section className="stack">
            {payload.learning_objective ? <p><strong>Objective:</strong> {payload.learning_objective}</p> : null}
            {payload.essential_question ? <p><strong>Essential question:</strong> {payload.essential_question}</p> : null}
            {payload.materials?.length ? <p><strong>Materials:</strong> {payload.materials.join(", ")}</p> : null}
          </section>
        ) : null}

        {payload?.sections?.length ? (
          <section className="premium-subject-grid">
            {payload.sections.map((section) => renderSection(section))}
          </section>
        ) : null}

        <section className="stack">
          {(payload?.questions ?? []).map((question) => renderQuestion(question))}
        </section>

        <section>
          <h3>Parent notes</h3>
          <p>{payload?.parent_notes ?? "Use this worksheet as one saved sample for the portfolio."}</p>
          {payload?.extension_activity ? <p><strong>Extension:</strong> {payload.extension_activity}</p> : null}
        </section>

        {showAnswerKey || worksheet?.include_answer_key ? (
          <section>
            <h3>Answer key</h3>
            <div className="stack">
              {answers.map((answer) => (
                <article key={answer.number} className="premium-inline-card">
                  <strong>{answer.number}</strong>
                  <span>{answer.answer || "Teacher judgment or varied response."}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
