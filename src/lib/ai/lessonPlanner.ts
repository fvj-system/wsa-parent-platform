import { z } from "zod";
import { marylandSubjects, type MarylandSubject } from "@/lib/compliance/marylandSubjects";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import type { LessonAssignment, LessonPlanPayload, LessonPlanType } from "@/lib/premium/types";

export const lessonPlanRequestSchema = z.object({
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  reading_level: z.string().min(1),
  math_level: z.string().min(1),
  grade_level: z.string().min(1),
  theme: z.string().trim().max(120).optional(),
  parent_available_time: z.number().int().min(20).max(480).optional(),
  preferred_learning_style: z.string().trim().max(120).optional(),
  outdoor_option: z.boolean().default(false),
  weak_or_missing_subjects: z.array(z.enum(marylandSubjects)).default([]),
  plan_type: z.enum(["full_day", "light_day", "outdoor_heavy"]).default("full_day"),
});

function buildAssignments(subjects: MarylandSubject[], theme: string, planType: LessonPlanType): LessonAssignment[] {
  return subjects.map((subject, index) => {
    const outdoorExtra = planType === "outdoor_heavy" && ["Science", "Social Studies", "Art", "Physical Education"].includes(subject);
    return {
      subject,
      activity_title: `${subject} - ${theme}`,
      instructions: outdoorExtra
        ? `Take this lesson outside. Use the ${theme.toLowerCase()} theme to anchor the activity, then capture one concrete observation or product.`
        : `Complete a focused ${subject.toLowerCase()} lesson tied to ${theme.toLowerCase()}, then discuss what was learned.`,
      evidence_to_save:
        subject === "English"
          ? "Save a narration, copywork sample, or short written response."
          : subject === "Mathematics"
            ? "Save the solved problems or a photo of hands-on math work."
            : subject === "Science"
              ? "Save an observation note, sketch, or experiment result."
              : `Save one representative note, photo, or reflection for ${subject.toLowerCase()}.`,
      estimated_minutes: planType === "light_day" ? 18 + index * 3 : 22 + index * 4,
      materials: outdoorExtra ? ["Notebook", "Pencil", "Outdoor observation space"] : ["Notebook", "Pencil"],
      parent_notes: "Keep the pace steady and save one clear sample.",
    };
  });
}

export function buildFallbackLessonPlan(input: z.infer<typeof lessonPlanRequestSchema>): LessonPlanPayload {
  const subjectPool =
    input.plan_type === "full_day"
      ? [...marylandSubjects]
      : input.plan_type === "light_day"
        ? [
            "English",
            "Mathematics",
            ...(input.weak_or_missing_subjects[0] ? [input.weak_or_missing_subjects[0]] : []),
            ...(input.weak_or_missing_subjects[1] ? [input.weak_or_missing_subjects[1]] : ["Science"]),
          ].filter((value, index, items) => items.indexOf(value) === index)
        : ["Science", "Social Studies", "Art", "Physical Education", "English"];

  const theme = input.theme?.trim() || "Maryland wetlands";
  const assignments = buildAssignments(subjectPool as MarylandSubject[], theme, input.plan_type);

  return {
    title: `${input.student_name}'s ${input.plan_type === "light_day" ? "Light Day" : input.plan_type === "outdoor_heavy" ? "Outdoor Heavy" : "Full Day"} Plan`,
    date: new Date().toISOString().slice(0, 10),
    student_id: input.student_id,
    theme,
    estimated_total_minutes: assignments.reduce((sum, item) => sum + item.estimated_minutes, 0),
    assignments,
  };
}

export async function generateLessonPlan(input: z.infer<typeof lessonPlanRequestSchema>) {
  const fallback = buildFallbackLessonPlan(input);

  if (!process.env.OPENAI_API_KEY) {
    return {
      plan: fallback,
      model: "fallback-no-openai",
      usedFallback: true,
    };
  }

  try {
    const openai = createOpenAIClient();
    const response = await openai.responses.create({
      model: getOpenAIModel(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You are building a homeschool day plan for WSA Premium Homeschool.",
                "Support Maryland documentation without claiming official approval.",
                "Return structured JSON only.",
                `Student name: ${input.student_name}`,
                `Reading level: ${input.reading_level}`,
                `Math level: ${input.math_level}`,
                `Grade level: ${input.grade_level}`,
                `Theme: ${input.theme ?? "Maryland outdoor learning"}`,
                `Parent available minutes: ${input.parent_available_time ?? 180}`,
                `Preferred learning style: ${input.preferred_learning_style ?? "balanced"}`,
                `Outdoor option: ${input.outdoor_option ? "true" : "false"}`,
                `Plan type: ${input.plan_type}`,
                `Weak or missing subjects: ${input.weak_or_missing_subjects.join(", ") || "none"}`,
                "Use all 8 Maryland subjects for full_day, 3-4 subjects for light_day, and emphasize outdoor science/PE/art/social studies for outdoor_heavy."
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "lesson_plan",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              date: { type: "string" },
              student_id: { type: "string" },
              theme: { type: "string" },
              estimated_total_minutes: { type: "number" },
              assignments: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    subject: { type: "string" },
                    activity_title: { type: "string" },
                    instructions: { type: "string" },
                    evidence_to_save: { type: "string" },
                    estimated_minutes: { type: "number" },
                    materials: {
                      type: "array",
                      items: { type: "string" },
                    },
                    parent_notes: { type: "string" },
                  },
                  required: [
                    "subject",
                    "activity_title",
                    "instructions",
                    "evidence_to_save",
                    "estimated_minutes",
                    "materials",
                    "parent_notes",
                  ],
                },
              },
            },
            required: ["title", "date", "student_id", "theme", "estimated_total_minutes", "assignments"],
          },
        },
      },
    });

    const plan = JSON.parse(response.output_text) as LessonPlanPayload;
    return {
      plan,
      model: getOpenAIModel(),
      usedFallback: false,
    };
  } catch {
    return {
      plan: fallback,
      model: "fallback-after-error",
      usedFallback: true,
    };
  }
}
