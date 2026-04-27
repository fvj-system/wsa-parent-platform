import { z } from "zod";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { marylandSubjects, type MarylandSubject } from "@/lib/compliance/marylandSubjects";
import type { PortfolioTagSuggestion } from "@/lib/premium/types";

export const portfolioTaggerRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  evidence_type: z.string().min(1),
  parent_notes: z.string().default(""),
});

function maybeAddTag(tags: PortfolioTagSuggestion[], subject: MarylandSubject, reason: string, confidence = 0.7) {
  if (tags.find((tag) => tag.subject === subject)) return;
  tags.push({ subject, reason, confidence_score: confidence });
}

export function buildFallbackTagSuggestions(input: z.infer<typeof portfolioTaggerRequestSchema>) {
  const haystack = `${input.title} ${input.description} ${input.parent_notes}`.toLowerCase();
  const suggestions: PortfolioTagSuggestion[] = [];

  if (/read|write|fact|journal|story|book|copy/.test(haystack)) {
    maybeAddTag(suggestions, "English", "Includes reading, writing, narration, or language work.");
  }
  if (/count|measure|math|graph|sort|fraction|number/.test(haystack)) {
    maybeAddTag(suggestions, "Mathematics", "Includes counting, measuring, or mathematical reasoning.");
  }
  if (/observe|animal|plant|habitat|science|experiment|weather/.test(haystack)) {
    maybeAddTag(suggestions, "Science", "Includes observation, experimentation, or scientific content.");
  }
  if (/map|history|community|government|culture|geography/.test(haystack)) {
    maybeAddTag(suggestions, "Social Studies", "Includes history, geography, or community learning.");
  }
  if (/draw|paint|craft|sketch|art/.test(haystack)) {
    maybeAddTag(suggestions, "Art", "Includes visual art, design, or creative production.");
  }
  if (/song|music|rhythm|instrument|composer/.test(haystack)) {
    maybeAddTag(suggestions, "Music", "Includes music listening, rhythm, or instrument practice.");
  }
  if (/health|nutrition|safety|wellness|hygiene/.test(haystack)) {
    maybeAddTag(suggestions, "Health", "Includes wellness, safety, or health learning.");
  }
  if (/run|hike|movement|exercise|outdoor|pe|physical/.test(haystack)) {
    maybeAddTag(suggestions, "Physical Education", "Includes movement, exercise, or physical skill practice.");
  }

  if (suggestions.length === 0) {
    maybeAddTag(suggestions, "English", "A parent note can still support English through narration or reflection.", 0.45);
  }

  return suggestions;
}

export async function suggestPortfolioTags(input: z.infer<typeof portfolioTaggerRequestSchema>) {
  const fallback = buildFallbackTagSuggestions(input);

  if (!process.env.OPENAI_API_KEY) {
    return {
      suggestions: fallback,
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
                "You are tagging homeschool portfolio evidence for Maryland subject coverage.",
                "Suggest subject tags only from this list:",
                marylandSubjects.join(", "),
                "Return a concise JSON array with subject, reason, and confidence_score.",
                `Title: ${input.title}`,
                `Description: ${input.description}`,
                `Evidence type: ${input.evidence_type}`,
                `Parent notes: ${input.parent_notes}`,
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "portfolio_tag_suggestions",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    subject: { type: "string" },
                    reason: { type: "string" },
                    confidence_score: { type: "number" },
                  },
                  required: ["subject", "reason", "confidence_score"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as { suggestions: PortfolioTagSuggestion[] };
    return {
      suggestions: parsed.suggestions,
      model: getOpenAIModel(),
      usedFallback: false,
    };
  } catch {
    return {
      suggestions: fallback,
      model: "fallback-after-error",
      usedFallback: true,
    };
  }
}
