import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveGeneration } from "@/lib/generation-store";
import {
  weekPlannerInputSchema,
  weekPlannerOutputJsonSchema,
  weekPlannerOutputSchema
} from "@/lib/generations";
import { buildPlannerThemeContext, buildWeeklyPlannerBookRecommendations } from "@/lib/library-recommendations";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { buildWeeklyPlannerEnhancements } from "@/lib/planner/weekly-planner-enrichment";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedInput = weekPlannerInputSchema.safeParse(await request.json());

    if (!parsedInput.success) {
      return NextResponse.json({ error: "Invalid week planner request." }, { status: 400 });
    }

    const prompt = [
      "You are creating a homeschool week plan for a family.",
      "Use plain language, be practical for parents, age-appropriate, outdoors-friendly when it fits, and specific enough to print and use.",
      `Planning mode: ${parsedInput.data.planningMode === "family" ? "Family Week" : "Student Week"}`,
      parsedInput.data.planningMode === "family"
        ? `Students included: ${parsedInput.data.selectedStudentNames.join(", ") || "whole family"}`
        : `Student: ${parsedInput.data.selectedStudentNames[0] ?? "selected student"}`,
      parsedInput.data.selectedStudentAges.length
        ? `Age span: ${Math.min(...parsedInput.data.selectedStudentAges)}-${Math.max(...parsedInput.data.selectedStudentAges)}`
        : parsedInput.data.childAge
          ? `Child age: ${parsedInput.data.childAge}`
          : "No age was provided.",
      `Focus area: ${parsedInput.data.focusArea}`,
      `Days per week: ${parsedInput.data.daysPerWeek}`,
      `Preferred lesson length: ${parsedInput.data.preferredLessonLength}`,
      `Interests: ${parsedInput.data.interests}`,
      `Setting preference: ${parsedInput.data.settingPreference}`,
      `Location: ${parsedInput.data.locationLabel}`,
      "Return a robust week, not a vague outline.",
      "Include a weeklyOverview, essentialQuestion, familyChallenge, 3-5 topicHighlights, and 3-6 vocabularyWords.",
      parsedInput.data.planningMode === "family"
        ? "Build a broad family-friendly week that can work across mixed ages, with at least one shared outing or shared observation each day."
        : "Tailor the plan to the selected student while keeping it practical for a real household.",
      `Create exactly ${parsedInput.data.daysPerWeek} daily plan items.`,
      "Daily plan activities should be specific, realistic, and short enough for a parent to follow.",
      "For each day include: focus, miniLesson, coolFact, familyPrompt, indoorBackup, and 2-4 concrete activities.",
      "Keep coolFact surprising or memorable for kids, but still accurate and age-appropriate."
    ].join("\n");

    const openai = createOpenAIClient();
    const response = await openai.responses.create({
      model: getOpenAIModel(),
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "week_plan",
          schema: weekPlannerOutputJsonSchema
        }
      }
    });

    const baseOutput = weekPlannerOutputSchema.parse(JSON.parse(response.output_text));
    const plannerEnhancements = await buildWeeklyPlannerEnhancements({
      focusArea: parsedInput.data.focusArea,
      interests: parsedInput.data.interests,
      locationLabel: parsedInput.data.locationLabel,
      homeZipcode: parsedInput.data.homeZipcode,
      latitude: parsedInput.data.locationLatitude,
      longitude: parsedInput.data.locationLongitude,
      radiusMiles: parsedInput.data.searchRadiusMiles,
      daysPerWeek: parsedInput.data.daysPerWeek,
      settingPreference: parsedInput.data.settingPreference,
      baseOutput
    });
    const weeklyBookFocus = parsedInput.data.focusArea;
    const weeklyBookSignals = [
      parsedInput.data.focusArea,
      baseOutput.weeklyOverview,
      baseOutput.essentialQuestion,
      ...baseOutput.topicHighlights,
      ...baseOutput.vocabularyWords,
      ...baseOutput.dailyPlan.flatMap((item) => [item.focus, item.miniLesson, item.coolFact, ...item.activities])
    ];
    const weeklyBookTopicText = weeklyBookSignals.filter(Boolean).join(". ");
    const themeContext = buildPlannerThemeContext(weeklyBookFocus, [weeklyBookFocus]);

    const output = weekPlannerOutputSchema.parse({
      ...baseOutput,
      startDate: plannerEnhancements.startDate,
      weatherSummary: plannerEnhancements.weatherSummary,
      weeklyForecast: plannerEnhancements.weeklyForecast,
      dailyPlan: plannerEnhancements.dailyPlan,
      suggestedFieldTrips: plannerEnhancements.suggestedFieldTrips,
      regionalEventSources: plannerEnhancements.regionalEventSources,
      locationSummary: plannerEnhancements.locationSummary,
      themeContext,
      bookRecommendations: await buildWeeklyPlannerBookRecommendations({
        locationLabel: parsedInput.data.locationLabel,
        homeZipcode: parsedInput.data.homeZipcode,
        topicText: weeklyBookFocus,
        topicSignals: weeklyBookSignals,
        themeContext,
        learners: parsedInput.data.selectedStudentNames.map((name, index) => ({
          name,
          age: parsedInput.data.selectedStudentAges[index] ?? parsedInput.data.childAge ?? 8,
          readingLevel: parsedInput.data.selectedStudentReadingLevels[index]
        }))
      })
    });
    const generation = await saveGeneration({
      supabase,
      userId: user.id,
      toolType: "week_plan",
      title: `${parsedInput.data.planningMode === "family" ? "Family" : parsedInput.data.selectedStudentNames[0] ?? "Student"} ${parsedInput.data.focusArea} week plan`,
      inputJson: parsedInput.data,
      outputJson: output
    });

    return NextResponse.json({
      generation,
      output
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
