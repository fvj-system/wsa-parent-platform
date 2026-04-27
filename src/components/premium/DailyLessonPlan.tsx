"use client";

import { useMemo, useState, useTransition } from "react";
import type { LessonPlanPayload, PremiumStudent } from "@/lib/premium/types";
import { formatPremiumStudentName } from "@/lib/premium/data";
import type { CoverageCard } from "@/lib/compliance/coverageRules";

type DailyLessonPlanProps = {
  students: PremiumStudent[];
  activeStudentId?: string | null;
  coverage: CoverageCard[];
  recentPlans: Array<Record<string, unknown>>;
  initialPlan?: LessonPlanPayload | null;
};

export function DailyLessonPlan({
  students,
  activeStudentId,
  coverage,
  recentPlans,
  initialPlan = null,
}: DailyLessonPlanProps) {
  const [studentId, setStudentId] = useState(activeStudentId ?? students[0]?.id ?? "");
  const [planType, setPlanType] = useState<"full_day" | "light_day" | "outdoor_heavy">("full_day");
  const [theme, setTheme] = useState("Maryland outdoor learning");
  const [availableTime, setAvailableTime] = useState("180");
  const [learningStyle, setLearningStyle] = useState("balanced");
  const [outdoorOption, setOutdoorOption] = useState(true);
  const [plan, setPlan] = useState<LessonPlanPayload | null>(initialPlan);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? students[0],
    [studentId, students],
  );

  async function generatePlan() {
    if (!selectedStudent) return;

    setError("");
    setWarning("");
    const weakSubjects = coverage
      .filter((item) => item.status !== "covered")
      .map((item) => item.subject);

    const response = await fetch("/api/ai/generate-lesson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: selectedStudent.id,
        student_name: formatPremiumStudentName(selectedStudent),
        reading_level: selectedStudent.reading_level ?? "early_reader",
        math_level: selectedStudent.math_level ?? "addition_subtraction",
        grade_level: selectedStudent.grade_level ?? "3",
        theme,
        parent_available_time: Number(availableTime),
        preferred_learning_style: learningStyle,
        outdoor_option: outdoorOption,
        weak_or_missing_subjects: weakSubjects,
        plan_type: planType,
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      warning?: string | null;
      plan?: LessonPlanPayload;
    };

    if (!response.ok || !result.plan) {
      setError(result.error ?? "Unable to generate a lesson plan.");
      return;
    }

    setPlan(result.plan);
    setWarning(result.warning ?? "");
  }

  return (
    <section className="content-grid">
      <section className="panel stack">
        <div>
          <p className="eyebrow">Today&apos;s Homeschool Plan</p>
          <h3>Generate a structured day plan</h3>
          <p className="panel-copy" style={{ margin: 0 }}>
            Use full-day, light-day, or outdoor-heavy planning with weak subject awareness built in.
          </p>
        </div>

        <div className="premium-form-grid">
          <label>
            Student
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {formatPremiumStudentName(student)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Plan type
            <select value={planType} onChange={(event) => setPlanType(event.target.value as typeof planType)}>
              <option value="full_day">Full Day Plan</option>
              <option value="light_day">Light Day Plan</option>
              <option value="outdoor_heavy">Outdoor Heavy Plan</option>
            </select>
          </label>
          <label>
            Theme
            <input value={theme} onChange={(event) => setTheme(event.target.value)} />
          </label>
          <label>
            Parent available minutes
            <input value={availableTime} onChange={(event) => setAvailableTime(event.target.value)} />
          </label>
          <label>
            Preferred learning style
            <input value={learningStyle} onChange={(event) => setLearningStyle(event.target.value)} />
          </label>
          <label className="classes-waiver-toggle">
            <input type="checkbox" checked={outdoorOption} onChange={(event) => setOutdoorOption(event.target.checked)} />
            <span>Outdoor option</span>
          </label>
        </div>

        <div className="cta-row">
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                void generatePlan();
              });
            }}
            disabled={isPending || !selectedStudent}
          >
            {isPending ? "Generating..." : "Generate Today’s Plan"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {warning ? <p className="success">{warning}</p> : null}
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Recent plans</p>
          <h3>Saved lesson plans</h3>
        </div>
        <div className="stack">
          {recentPlans.length ? (
            recentPlans.map((item) => (
              <article key={String(item.id)} className="premium-inline-card">
                <strong>{String(item.title ?? "Lesson plan")}</strong>
                <span>{String(item.plan_date ?? item.created_at ?? "")}</span>
              </article>
            ))
          ) : (
            <p className="panel-copy" style={{ margin: 0 }}>
              No saved lesson plans yet.
            </p>
          )}
        </div>
      </section>

      <section className="panel stack premium-wide-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="header-row">
          <div>
            <p className="eyebrow">Plan preview</p>
            <h3>{plan?.title ?? "Generated plan will appear here"}</h3>
          </div>
          {plan ? <span className="badge">{plan.estimated_total_minutes} min</span> : null}
        </div>

        {plan ? (
          <div className="stack">
            {plan.assignments.map((assignment) => (
              <article key={`${assignment.subject}-${assignment.activity_title}`} className="premium-inline-card premium-plan-card">
                <div className="header-row">
                  <strong>{assignment.subject}</strong>
                  <span>{assignment.estimated_minutes} min</span>
                </div>
                <h4>{assignment.activity_title}</h4>
                <p className="panel-copy" style={{ margin: 0 }}>{assignment.instructions}</p>
                <p className="muted" style={{ margin: 0 }}>Evidence to save: {assignment.evidence_to_save}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="panel-copy" style={{ margin: 0 }}>
            Choose a student and generate a lesson plan to see the subject-by-subject assignments, estimated time, and evidence prompts.
          </p>
        )}
      </section>
    </section>
  );
}
