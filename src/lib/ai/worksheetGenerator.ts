import { z } from "zod";
import { buildCurriculumWorksheet } from "@/lib/premium/worksheet-curriculum";

export const worksheetRequestSchema = z.object({
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  subject: z.string().min(1),
  grade_level: z.string().min(1),
  reading_level: z.string().min(1),
  math_level: z.string().min(1),
  difficulty: z.string().min(1),
  number_of_questions: z.number().int().min(5).max(10),
  include_answer_key: z.boolean().default(false),
  existing_worksheet_count: z.number().int().min(0).default(0),
});

export function buildFallbackWorksheet(input: z.infer<typeof worksheetRequestSchema>) {
  return buildCurriculumWorksheet({
    studentName: input.student_name,
    subject: input.subject,
    gradeLevel: input.grade_level,
    readingLevel: input.reading_level,
    mathLevel: input.math_level,
    questionCount: input.number_of_questions,
    supportLevel: input.difficulty as "supported" | "on_level" | "stretch",
    existingWorksheetCount: input.existing_worksheet_count,
  });
}

export async function generateWorksheet(input: z.infer<typeof worksheetRequestSchema>) {
  const worksheet = buildCurriculumWorksheet({
    studentName: input.student_name,
    subject: input.subject,
    gradeLevel: input.grade_level,
    readingLevel: input.reading_level,
    mathLevel: input.math_level,
    questionCount: input.number_of_questions,
    supportLevel: input.difficulty as "supported" | "on_level" | "stretch",
    existingWorksheetCount: input.existing_worksheet_count,
  });

  return {
    worksheet,
    model: "curriculum-local-v1",
    usedFallback: false,
  };
}
