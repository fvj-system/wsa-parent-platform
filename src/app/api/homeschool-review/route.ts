import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildFallbackHomeschoolReview,
  marylandSubjectLabels,
  type MarylandSubjectLabel,
} from "@/lib/homeschool-review";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

const reviewEvidenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  categoryLabel: z.string(),
  occurredAt: z.string(),
  summary: z.string(),
  notes: z.string(),
  scopeLabel: z.string(),
  subjects: z.array(z.enum(marylandSubjectLabels)),
});

const homeschoolReviewRequestSchema = z.object({
  studentName: z.string().min(1),
  rangeLabel: z.string().min(1),
  customParentSummary: z.string().max(4000).optional(),
  parentNotes: z.array(z.string().max(2000)).default([]),
  evidenceItems: z.array(reviewEvidenceSchema).default([]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = homeschoolReviewRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid homeschool review request." }, { status: 400 });
    }

    const fallback = buildFallbackHomeschoolReview({
      studentName: parsed.data.studentName,
      rangeLabel: parsed.data.rangeLabel,
      evidenceItems: parsed.data.evidenceItems,
      parentNotes: parsed.data.parentNotes,
      customParentSummary: parsed.data.customParentSummary,
    });

    if (!process.env.OPENAI_API_KEY || parsed.data.evidenceItems.length === 0) {
      return NextResponse.json({ review: fallback });
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
                  "You are writing a professional homeschool review summary for a Maryland family.",
                  "Write concise, plain-English educational summaries grouped into the 8 Maryland core subjects.",
                  "Use only the evidence provided. Do not invent activities that are not in the evidence list.",
                  "Keep the tone supportive, clear, and suitable for a homeschool review board packet.",
                  `Student: ${parsed.data.studentName}`,
                  `Date range: ${parsed.data.rangeLabel}`,
                  parsed.data.customParentSummary?.trim()
                    ? `Parent outside-learning summary: ${parsed.data.customParentSummary.trim()}`
                    : "Parent outside-learning summary: none provided",
                  parsed.data.parentNotes.length
                    ? `Parent notes: ${parsed.data.parentNotes.join(" | ")}`
                    : "Parent notes: none provided",
                  `Evidence items: ${parsed.data.evidenceItems
                    .map(
                      (item) =>
                        `${item.occurredAt}: ${item.title} [${item.categoryLabel}] subjects=${item.subjects.join(
                          ", ",
                        )}; summary=${item.summary}; notes=${item.notes}; scope=${item.scopeLabel}`,
                    )
                    .join(" || ")}`,
                ].join("\n"),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "homeschool_review",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                overallSummary: { type: "string" },
                english: { type: "string" },
                mathematics: { type: "string" },
                science: { type: "string" },
                socialStudies: { type: "string" },
                art: { type: "string" },
                music: { type: "string" },
                health: { type: "string" },
                physicalEducation: { type: "string" },
              },
              required: [
                "overallSummary",
                "english",
                "mathematics",
                "science",
                "socialStudies",
                "art",
                "music",
                "health",
                "physicalEducation",
              ],
            },
          },
        },
      });

      const output = JSON.parse(response.output_text) as {
        overallSummary: string;
        english: string;
        mathematics: string;
        science: string;
        socialStudies: string;
        art: string;
        music: string;
        health: string;
        physicalEducation: string;
      };

      const review = {
        mode: "ai" as const,
        overallSummary: output.overallSummary,
        subjects: {
          "English (Reading/Language Arts)": output.english,
          Mathematics: output.mathematics,
          Science: output.science,
          "Social Studies": output.socialStudies,
          Art: output.art,
          Music: output.music,
          Health: output.health,
          "Physical Education": output.physicalEducation,
        } satisfies Record<MarylandSubjectLabel, string>,
      };

      return NextResponse.json({ review });
    } catch {
      return NextResponse.json({ review: fallback });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
