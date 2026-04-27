import { z } from "zod";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import type { CoverageCard } from "@/lib/compliance/coverageRules";

export const reviewSummaryRequestSchema = z.object({
  student_name: z.string().min(1),
  grade_level: z.string().min(1),
  reading_level: z.string().min(1),
  math_level: z.string().min(1),
  review_period_start: z.string().min(1),
  review_period_end: z.string().min(1),
  coverage: z.array(
    z.object({
      subject: z.string(),
      status: z.string(),
      evidenceCount: z.number(),
      lastEvidenceDate: z.string().nullable(),
      suggestedNextAction: z.string(),
    }),
  ),
  evidence_titles: z.array(z.string()).default([]),
});

export function buildFallbackReviewSummary(input: z.infer<typeof reviewSummaryRequestSchema>) {
  const covered = input.coverage.filter((item) => item.status === "covered").map((item) => item.subject);
  const weak = input.coverage.filter((item) => item.status === "weak").map((item) => item.subject);
  const missing = input.coverage.filter((item) => item.status === "missing").map((item) => item.subject);

  return [
    `${input.student_name} has a review packet prepared for ${input.review_period_start} through ${input.review_period_end}.`,
    `Grade level context: ${input.grade_level}. Reading level: ${input.reading_level}. Math level: ${input.math_level}.`,
    covered.length ? `Covered subjects currently include ${covered.join(", ")}.` : "No subjects are fully covered yet.",
    weak.length ? `Subjects needing stronger support: ${weak.join(", ")}.` : "No weak subjects are currently flagged.",
    missing.length ? `Missing documentation is currently flagged in ${missing.join(", ")}.` : "No missing subjects are currently flagged.",
    input.evidence_titles.length
      ? `Representative evidence includes ${input.evidence_titles.slice(0, 5).join(", ")}.`
      : "The packet is ready for the family to add more representative evidence samples."
  ].join(" ");
}

export async function buildReviewSummary(input: {
  student_name: string;
  grade_level: string;
  reading_level: string;
  math_level: string;
  review_period_start: string;
  review_period_end: string;
  coverage: CoverageCard[];
  evidence_titles: string[];
}) {
  const parsedInput = reviewSummaryRequestSchema.parse({
    ...input,
    coverage: input.coverage,
  });
  const fallback = buildFallbackReviewSummary(parsedInput);

  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: fallback,
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
                "Write an organizational summary for a homeschool review packet.",
                "Do not claim official approval or guaranteed compliance.",
                `Student: ${parsedInput.student_name}`,
                `Grade level: ${parsedInput.grade_level}`,
                `Reading level: ${parsedInput.reading_level}`,
                `Math level: ${parsedInput.math_level}`,
                `Review period: ${parsedInput.review_period_start} to ${parsedInput.review_period_end}`,
                `Coverage data: ${JSON.stringify(parsedInput.coverage)}`,
                `Evidence titles: ${parsedInput.evidence_titles.join(" | ")}`,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    return {
      summary: response.output_text || fallback,
      model: getOpenAIModel(),
      usedFallback: false,
    };
  } catch {
    return {
      summary: fallback,
      model: "fallback-after-error",
      usedFallback: true,
    };
  }
}
