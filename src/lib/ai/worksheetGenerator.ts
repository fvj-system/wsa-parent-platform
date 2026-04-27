import { z } from "zod";
import { normalizeSubjectName, type MarylandSubject } from "@/lib/compliance/marylandSubjects";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import type { WorksheetPayload, WorksheetQuestion } from "@/lib/premium/types";

export const worksheetRequestSchema = z.object({
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  grade_level: z.string().min(1),
  reading_level: z.string().min(1),
  difficulty: z.string().min(1),
  number_of_questions: z.number().int().min(3).max(20),
  include_answer_key: z.boolean().default(false),
});

function buildFallbackQuestions(subject: MarylandSubject, topic: string, count: number): WorksheetQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    if (subject === "Mathematics") {
      return {
        number: index + 1,
        prompt: `${topic}: solve the practice problem #${index + 1}. Show your work.`,
        type: "math",
        answer: `Sample answer for ${topic} problem ${index + 1}`,
      };
    }

    if (subject === "Art") {
      return {
        number: index + 1,
        prompt: `Create or sketch one response for ${topic} prompt #${index + 1}.`,
        type: "draw",
        answer: "Creative response varies",
      };
    }

    return {
      number: index + 1,
      prompt: `${topic}: answer prompt #${index + 1} in your own words.`,
      type: index % 3 === 0 ? "short_answer" : "copywork",
      answer: `Reference response for ${topic} item ${index + 1}`,
    };
  });
}

export function buildFallbackWorksheet(input: z.infer<typeof worksheetRequestSchema>): WorksheetPayload {
  const subject = normalizeSubjectName(input.subject) ?? "English";
  return {
    title: `${subject} Worksheet - ${input.topic}`,
    student_name: input.student_name,
    subject,
    date: new Date().toISOString().slice(0, 10),
    instructions: `Complete each ${subject.toLowerCase()} question carefully. Show your thinking and save the finished sheet for your records.`,
    questions: buildFallbackQuestions(subject, input.topic, input.number_of_questions),
    parent_notes: `Generated for ${input.grade_level} with ${input.difficulty} difficulty.`,
  };
}

export async function generateWorksheet(input: z.infer<typeof worksheetRequestSchema>) {
  const fallback = buildFallbackWorksheet(input);

  if (!process.env.OPENAI_API_KEY) {
    return {
      worksheet: fallback,
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
                "You are generating a printable worksheet for WSA Premium Homeschool.",
                "Return only valid JSON.",
                `Student name: ${input.student_name}`,
                `Subject: ${input.subject}`,
                `Topic: ${input.topic}`,
                `Grade level: ${input.grade_level}`,
                `Reading level: ${input.reading_level}`,
                `Difficulty: ${input.difficulty}`,
                `Number of questions: ${input.number_of_questions}`,
                `Include answer key: ${input.include_answer_key ? "true" : "false"}`
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "worksheet",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              student_name: { type: "string" },
              subject: { type: "string" },
              date: { type: "string" },
              instructions: { type: "string" },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    number: { type: "number" },
                    prompt: { type: "string" },
                    type: { type: "string" },
                    choices: {
                      type: "array",
                      items: { type: "string" },
                    },
                    answer: { type: "string" },
                  },
                  required: ["number", "prompt", "type"],
                },
              },
              parent_notes: { type: "string" },
            },
            required: ["title", "student_name", "subject", "date", "instructions", "questions", "parent_notes"],
          },
        },
      },
    });

    const worksheet = JSON.parse(response.output_text) as WorksheetPayload;
    return {
      worksheet,
      model: getOpenAIModel(),
      usedFallback: false,
    };
  } catch {
    return {
      worksheet: fallback,
      model: "fallback-after-error",
      usedFallback: true,
    };
  }
}
