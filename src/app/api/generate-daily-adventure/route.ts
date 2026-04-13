import { NextResponse } from "next/server";
import { getEnvironmentalContext } from "@/lib/context/engine";
import { getDailyAdventurePreset } from "@/lib/daily-adventure-presets";
import { getFishingRecommendation } from "@/lib/context/fishing";
import { findRecommendedSpots, resolveLocationContext } from "@/lib/context/nearby-spots";
import { deriveWeatherContext } from "@/lib/context/weather";
import { saveGeneration } from "@/lib/generation-store";
import {
  EMPTY_DAILY_ADVENTURE,
  type DailyAdventureOutput,
  dailyAdventureInputSchema,
  dailyAdventureOutputJsonSchema,
  parseDailyAdventure
} from "@/lib/generations";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import {
  buildSmithsonianRecommendedStops,
  getSelectedSmithsonianMuseums,
  SMITHSONIAN_SPECIAL_EXHIBIT_NOTE,
  type SmithsonianMuseum
} from "@/lib/smithsonian-museums";
import { createClient } from "@/lib/supabase/server";

type ResolvedAdventureTemplate =
  | "animal"
  | "bird"
  | "plant"
  | "fish"
  | "general"
  | "smithsonian";

type AdventureImageFieldSet = Pick<
  DailyAdventureOutput,
  | "fishOfTheDayImageUrl"
  | "fishOfTheDayImageAlt"
  | "liveBaitImageUrl"
  | "liveBaitImageAlt"
  | "artificialBaitImageUrl"
  | "artificialBaitImageAlt"
>;

async function fetchAdventureImage(query: string | null | undefined, fallbackLabel: string) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) return null;

  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedQuery.replace(/\s+/g, "_"))}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.WSA_ENV_DATA_USER_AGENT ?? "WildStallionAcademyAI/1.0"
      },
      next: {
        revalidate: 60 * 60 * 24 * 30
      }
    }
  ).catch(() => null);

  if (!response?.ok) return null;

  const payload = (await response.json()) as {
    title?: string;
    description?: string;
    originalimage?: { source?: string };
    thumbnail?: { source?: string };
  };

  const url = payload.originalimage?.source ?? payload.thumbnail?.source;
  if (!url) return null;

  const title = payload.title?.trim() || fallbackLabel;
  const description = payload.description?.trim();

  return {
    url,
    alt: description ? `${title} ${description}` : `${title} reference image`
  };
}

async function resolveFishingMissionImages(
  fishingRecommendation: Awaited<ReturnType<typeof getFishingRecommendation>> | null
): Promise<AdventureImageFieldSet> {
  if (!fishingRecommendation) {
    return {
      fishOfTheDayImageUrl: null,
      fishOfTheDayImageAlt: null,
      liveBaitImageUrl: null,
      liveBaitImageAlt: null,
      artificialBaitImageUrl: null,
      artificialBaitImageAlt: null
    };
  }

  const [fishImage, liveBaitImage, artificialBaitImage] = await Promise.all([
    fetchAdventureImage(fishingRecommendation.primarySpecies, fishingRecommendation.primarySpecies),
    fetchAdventureImage(fishingRecommendation.liveBait, fishingRecommendation.liveBait),
    fetchAdventureImage(fishingRecommendation.artificialBait, fishingRecommendation.artificialBait)
  ]);

  return {
    fishOfTheDayImageUrl: fishImage?.url ?? null,
    fishOfTheDayImageAlt: fishImage?.alt ?? null,
    liveBaitImageUrl: liveBaitImage?.url ?? null,
    liveBaitImageAlt: liveBaitImage?.alt ?? null,
    artificialBaitImageUrl: artificialBaitImage?.url ?? null,
    artificialBaitImageAlt: artificialBaitImage?.alt ?? null
  };
}

function getAdventureTemplateInstructions(template: ResolvedAdventureTemplate) {
  switch (template) {
    case "animal":
      return {
        activityTag: "general_nature",
        habitatTags: ["woods", "field", "trail", "park"],
        requireBirding: false,
        templateLabel: "animal field mission",
        outputGuide:
          "Use animal tracking, sign, habitat, movement, or behavior language. Return the featured animal name in animalOfTheDay. Avoid fishing-specific prompts, fish outlook text, or aquatic species lists unless they are truly relevant to observing the animal."
      };
    case "bird":
      return {
        activityTag: "birding",
        habitatTags: ["woods", "marsh", "shoreline", "park"],
        requireBirding: true,
        templateLabel: "bird field mission",
        outputGuide:
          "Use bird-focused observation language. Return the featured bird name in animalOfTheDay. Discussion and journal content should focus on bird behavior, calls, flight, nests, perches, or habitat clues. Never include fishing outlook text, fish species lists, or fishing fallback plans."
      };
    case "plant":
      return {
        activityTag: "general_nature",
        habitatTags: ["park", "trail", "woods", "meadow"],
        requireBirding: false,
        templateLabel: "plant field mission",
        outputGuide:
          "Use plant, tree, flower, bark, seed, leaf, and habitat language. Return the featured plant or tree name in animalOfTheDay. Journal and discussion content should fit plant identification, seasonal change, or habitat observation. Never include fishing outlook text or fish lists."
      };
    case "fish":
      return {
        activityTag: "fishing",
        habitatTags: ["shoreline", "pier", "marsh", "creek"],
        requireBirding: false,
        templateLabel: "fish field mission",
        outputGuide:
          "Use fish, shoreline, bait, current, aquatic habitat, and water-observation language. Return the featured fish name in animalOfTheDay. Fishing outlook, likely species, fallback plan, gear, and safety can be water-specific."
      };
    case "smithsonian":
      return {
        activityTag: "general_nature",
        habitatTags: [],
        requireBirding: false,
        templateLabel: "Smithsonian museum mission",
        outputGuide:
          "Use museum-guide language instead of outdoor trail language. Return a mission title in animalOfTheDay, add 3-8 scavengerHuntTasks, clear missionStops, helpful parentTalkingPoints, and a practical specialExhibitNote fallback. Keep discussionQuestion reflective and age-appropriate."
      };
    default:
      return {
        activityTag: "general_nature",
        habitatTags: ["park", "trail", "shoreline"],
        requireBirding: false,
        templateLabel: "balanced outdoor mission",
        outputGuide:
          "Use a balanced outdoor observation plan with family-friendly field-guide language. Keep it outdoors-first and practical."
      };
  }
}

function getDefaultAdventureCopy(template: ResolvedAdventureTemplate, locationLabel: string) {
  switch (template) {
    case "animal":
      return {
        bestTimeWindow: "Early morning or the last quiet hour before dusk is usually best for spotting movement and sign.",
        suggestedPlaceType: "park edge or quiet woodland margin",
        gearChecklist: ["Field notebook", "Water bottle", "Closed-toe shoes", "Small daypack"],
        safetyNote: "Move slowly, give wildlife space, and keep children close when following tracks or listening near brushy edges.",
        fallbackPlan: "If wildlife stays hidden, search for tracks, scat, feathers, nibbled plants, or other signs of animal activity instead."
      };
    case "bird":
      return {
        bestTimeWindow: "The first calm hour after sunrise usually gives the clearest bird song and movement.",
        suggestedPlaceType: "marsh edge, treeline, or quiet park path",
        gearChecklist: ["Binoculars", "Field notebook", "Water bottle", "Quiet walking shoes"],
        safetyNote: "Keep voices low, stop often to listen, and stay on clear paths while watching overhead and along brush lines.",
        fallbackPlan: "If birds stay hidden, sit still for five minutes and identify the outing by calls, silhouettes, and perch spots instead."
      };
    case "plant":
      return {
        bestTimeWindow: "Late morning or bright afternoon light usually makes plant shapes, bark, and leaf details easier to compare.",
        suggestedPlaceType: "trail edge, garden border, meadow edge, or shaded woodland path",
        gearChecklist: ["Field notebook", "Pencil", "Water bottle", "Magnifying glass"],
        safetyNote: "Look carefully before touching unknown plants, avoid tasting anything wild, and watch for poison ivy or thorny stems.",
        fallbackPlan: "If the first plant is hard to identify, compare leaves, bark, and growth patterns on three common nearby plants instead."
      };
    case "fish":
      return {
        bestTimeWindow: "Early morning and late afternoon are usually the easiest windows for a family shoreline fish mission.",
        suggestedPlaceType: "protected shoreline or easy public water access",
        gearChecklist: ["Water bottle", "Closed-toe shoes", "Small towel", "Simple tackle or observation kit"],
        safetyNote: "Choose a stable bank or pier, keep children an arm's length from the water edge, and avoid slippery rocks or mud.",
        fallbackPlan: "If the fish are quiet, switch to an aquatic habitat mission and watch for baitfish, insects, ripples, and current seams."
      };
    case "smithsonian":
      return {
        bestTimeWindow: "Arrive earlier in the day if you want shorter lines, fresher energy, and time for one thoughtful museum loop.",
        suggestedPlaceType: "Smithsonian museum galleries",
        gearChecklist: ["Water bottle", "Small notebook", "Pencil", "Phone or museum map"],
        safetyNote: "Keep the pace steady, plan short rest breaks, and use one clear meeting point before moving into the next gallery.",
        fallbackPlan:
          "If the museum feels crowded or energy drops, choose one anchor gallery, complete three scavenger tasks, and finish the reflection question before leaving."
      };
    default:
      return {
        bestTimeWindow: "Morning or late afternoon usually gives the family the best rhythm for a calm outdoor mission.",
        suggestedPlaceType: "park or trail edge",
        gearChecklist: ["Field notebook", "Water bottle", "Closed-toe shoes"],
        safetyNote: "Choose a family-friendly access point, watch footing, and keep the mission calm enough that curiosity stays high.",
        fallbackPlan: `If conditions change, turn the mission into a shorter observation walk near ${locationLabel} and finish with the journal prompt at home.`
      };
  }
}

function buildSmithsonianFallbackOutput(museums: SmithsonianMuseum[]): Partial<DailyAdventureOutput> {
  const selectedMuseums = museums.length ? museums : [];
  const firstMuseum = selectedMuseums[0];
  const missionStops = selectedMuseums.length
    ? selectedMuseums.map(
        (museum) =>
          `${museum.shortLabel}: start with ${museum.highlights.slice(0, 2).join(" and ")}.`
      )
    : [
        "Choose one anchor Smithsonian gallery first.",
        "Complete a short scavenger loop before energy drops.",
        "Pause for one reflection question before leaving."
      ];

  const scavengerHuntTasks = firstMuseum
    ? [
        `Find one object in ${firstMuseum.shortLabel} that matches your student's main interest.`,
        "Sketch or describe one detail most visitors would probably miss.",
        "Compare two objects, animals, inventions, or artworks and explain how they are different.",
        "Ask one family member to choose the exhibit that taught them something new."
      ]
    : [
        "Find one object that teaches something about people, nature, or invention.",
        "Look for one clue label that explains why the object mattered.",
        "Finish one quick sketch or note before moving on."
      ];

  const parentTalkingPoints = firstMuseum
    ? [
        `Ask why ${firstMuseum.shortLabel} chose these objects or stories to represent the topic.`,
        "Help kids compare whose perspective is centered and whose perspective needs extra attention.",
        "Pause after one major exhibit and ask what surprised each person most."
      ]
    : [
        "Ask what the exhibit is trying to teach, not just what it shows.",
        "Compare two viewpoints from the same historical or scientific story.",
        "Let each child pick one object to explain back to the family."
      ];

  return {
    animalOfTheDay: firstMuseum
      ? `${firstMuseum.shortLabel} Smithsonian Mission`
      : "Smithsonian Museum Mission",
    morningQuestion:
      "What are your top two things you hope to notice or understand better before you leave the museum today?",
    outdoorObservationActivity: firstMuseum
      ? `Use ${firstMuseum.name} as today's anchor stop and move through the galleries like a family field guide instead of trying to see everything.`
      : "Choose one Smithsonian anchor stop and move through it slowly enough to notice patterns, stories, and surprising details.",
    natureJournalPrompt:
      "Write down the exhibit, object, or story that changed how you were thinking by the end of the visit.",
    discussionQuestion:
      "Which exhibit helped your family see the same topic from more than one perspective today?",
    challengeActivity:
      "Complete a scavenger-style mission by noticing one surprising detail, one big idea, and one question to research later at home.",
    missionStops,
    scavengerHuntTasks,
    parentTalkingPoints,
    specialExhibitNote: SMITHSONIAN_SPECIAL_EXHIBIT_NOTE,
    optionalFieldTripIdea: firstMuseum
      ? `If energy is still high, add a short second stop at ${
          selectedMuseums[1]?.name ?? "the Smithsonian Castle and Gardens"
        }.`
      : "If energy is still high, add a short stop at the Smithsonian Castle and Gardens.",
    facebookCaption:
      "Today's Wild Stallion Academy mission turns a Smithsonian visit into a family field guide with scavenger clues, talking points, and one strong learning thread.",
    bestTimeWindow:
      "Start earlier if possible so your family can complete the first mission loop before lines and decision fatigue build up.",
    suggestedPlaceType: "Smithsonian museum galleries",
    gearChecklist: ["Water bottle", "Small notebook", "Pencil", "Phone or museum map"],
    safetyNote:
      "Keep one meeting point, one rest point, and one 'we can stop now' check-in so the day stays calm.",
    locationSummary: firstMuseum
      ? `Start at ${firstMuseum.name} and keep the route focused instead of trying to do every wing.`
      : "Pick one Smithsonian museum as the anchor stop and protect your family's energy for the best exhibits.",
    whyTheseSpotsWork: selectedMuseums.length
      ? selectedMuseums.map((museum) => museum.familyReason).join(" ")
      : "These Smithsonian stops work best when the family keeps a clear learning focus and a realistic pace.",
    recommendedNearbySpots: buildSmithsonianRecommendedStops(selectedMuseums),
    fallbackPlan:
      "If the museum is crowded or time gets tight, finish one anchor gallery, do three scavenger tasks, and save the rest for another trip."
  };
}

function buildDailyAdventureFallback(
  locationLabel: string,
  template: ResolvedAdventureTemplate,
  presetLabel?: string,
  museums: SmithsonianMuseum[] = []
): DailyAdventureOutput {
  const smithsonianFallback =
    template === "smithsonian" ? buildSmithsonianFallbackOutput(museums) : {};
  const presetTitle =
    template === "fish"
      ? "Fishing Mission"
      : template === "bird"
        ? "Bird Mission"
        : template === "plant"
          ? "Plant Mission"
          : template === "animal"
            ? "Animal Mission"
            : presetLabel ?? "Daily Adventure";

  return {
    ...EMPTY_DAILY_ADVENTURE,
    ...smithsonianFallback,
    animalOfTheDay: smithsonianFallback.animalOfTheDay ?? presetTitle,
    morningQuestion:
      smithsonianFallback.morningQuestion ??
      "What clue will your family notice first when you step outside?",
    outdoorObservationActivity:
      smithsonianFallback.outdoorObservationActivity ??
      `Head outside near ${locationLabel} and complete one calm, focused field observation today.`,
    natureJournalPrompt:
      smithsonianFallback.natureJournalPrompt ??
      "Write one sentence about what you noticed first and why it stood out.",
    discussionQuestion:
      smithsonianFallback.discussionQuestion ??
      "What detail helped your family understand the place best today?",
    challengeActivity:
      smithsonianFallback.challengeActivity ??
      "Complete one short observation challenge before heading home.",
    facebookCaption:
      smithsonianFallback.facebookCaption ??
      "Today's Wild Stallion Academy mission is ready for the trail.",
    bestTimeWindow:
      smithsonianFallback.bestTimeWindow ??
      "Morning or late afternoon usually gives the family the best rhythm.",
    suggestedPlaceType:
      smithsonianFallback.suggestedPlaceType ??
      (template === "fish"
        ? "protected shoreline or easy public water access"
        : "park or trail edge"),
    gearChecklist:
      smithsonianFallback.gearChecklist ?? [
        "Field notebook",
        "Water bottle",
        "Closed-toe shoes"
      ],
    safetyNote:
      smithsonianFallback.safetyNote ??
      "Choose a family-friendly access point, watch footing, and keep the outing calm and practical.",
    locationSummary:
      smithsonianFallback.locationSummary ?? `Planning around ${locationLabel}.`,
    whyTheseSpotsWork:
      smithsonianFallback.whyTheseSpotsWork ??
      "These nearby spots fit a short family field mission with simple observation goals.",
    recommendedNearbySpots: smithsonianFallback.recommendedNearbySpots ?? [],
    fishingOutlook: template === "fish" ? "Treat this as a practical scouting-style fishing day and adjust to local conditions." : null,
    likelySpecies: [],
    fishingMainSpecies: template === "fish" ? "Local game fish" : null,
    fishingLiveBait: template === "fish" ? "Nightcrawlers or minnows" : null,
    fishingArtificialBait: template === "fish" ? "Small jig or soft plastic" : null,
    fishingBestPlace: template === "fish" ? "A protected shoreline or public water-access point" : null,
    fishingWhereToCast: template === "fish" ? "Cast near cover, bank edges, or structure changes." : null,
    fishingMainSpeciesDescription:
      template === "fish"
        ? "Focus on cover, calmer water, and spots where food and shade come together."
        : null,
    fishingOtherLikelyFish: [],
    fishOfTheDayImageUrl: null,
    fishOfTheDayImageAlt: null,
    liveBaitImageUrl: null,
    liveBaitImageAlt: null,
    artificialBaitImageUrl: null,
    artificialBaitImageAlt: null,
    outingMode: template === "fish" ? "scouting or water observation" : null,
    fallbackPlan:
      smithsonianFallback.fallbackPlan ??
      "If conditions change, shorten the outing and finish the journal prompt at home."
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedInput = dailyAdventureInputSchema.safeParse(await request.json());

    if (!parsedInput.success) {
      return NextResponse.json({ error: "Invalid daily adventure request." }, { status: 400 });
    }

    const isHouseholdTarget =
      parsedInput.data.targetType === "household" ||
      parsedInput.data.householdMode ||
      !parsedInput.data.studentId;
    const preset = getDailyAdventurePreset(parsedInput.data.preset);
    const resolvedTemplate = preset?.contentTemplate ?? "general";
    const selectedMuseums =
      resolvedTemplate === "smithsonian"
        ? getSelectedSmithsonianMuseums(parsedInput.data.museumKeys)
        : [];

    if (resolvedTemplate === "smithsonian" && selectedMuseums.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one Smithsonian museum." },
        { status: 400 }
      );
    }

    const templateInstructions = getAdventureTemplateInstructions(resolvedTemplate);
    const location = resolveLocationContext(parsedInput.data);
    const environmental = await getEnvironmentalContext(supabase, parsedInput.data);
    const weather = deriveWeatherContext(parsedInput.data);
    const generalNearbySpots =
      resolvedTemplate === "smithsonian"
        ? buildSmithsonianRecommendedStops(selectedMuseums)
        : await findRecommendedSpots({
            supabase,
            location,
            activityTag: templateInstructions.activityTag,
            habitatTags: templateInstructions.habitatTags,
            requireBirding: templateInstructions.requireBirding,
            limit: 4
          });
    const fishingRecommendation =
      resolvedTemplate === "fish"
        ? await getFishingRecommendation(supabase, {
            requestDate: parsedInput.data.requestDate,
            locationLabel: parsedInput.data.locationLabel,
            latitude: parsedInput.data.latitude,
            longitude: parsedInput.data.longitude,
            radiusMiles: parsedInput.data.radiusMiles,
            weatherCondition: parsedInput.data.weatherCondition
          })
        : null;
    const fishingImages = await resolveFishingMissionImages(fishingRecommendation);

    if (process.env.NODE_ENV !== "production") {
      console.log("[daily-adventure] resolved preset:", parsedInput.data.preset ?? "default");
      console.log("[daily-adventure] selected template:", templateInstructions.templateLabel);
    }

    const prompt = [
      resolvedTemplate === "smithsonian"
        ? "You are creating a premium Smithsonian museum field-guide mission for a family visiting Washington, DC."
        : "You are creating a daily homeschool outdoor adventure for a family in Southern Maryland.",
      resolvedTemplate === "smithsonian"
        ? "Behave like a thoughtful homeschool museum guide who can choose the best free Smithsonian stops, pacing, scavenger tasks, observation prompts, and parent talking points."
        : "Behave like a practical family fishing guide and outdoor trip planner who knows shoreline access, simple tackle, kid-friendly outings, weather, and field conditions.",
      resolvedTemplate === "smithsonian"
        ? "Use plain language, be practical for parents, exciting for kids, educational, and specific to the selected museum choices."
        : "Use plain language, be practical for parents, outdoors-friendly, concise, and easy to do today.",
      isHouseholdTarget
        ? "This plan targets the full household, so use family, team, students, and everyone language instead of singular child wording."
        : "This plan targets one student, so you may use singular learner wording when it reads naturally.",
      "Also create one short Facebook-ready caption for Wild Stallion Academy that sounds warm, adventurous, family-friendly, and ready to copy into a post.",
      "The caption should be concise, reflect today's mission, and encourage curiosity and learning. Do not sound robotic or overly promotional.",
      `Date: ${parsedInput.data.requestDate}`,
      parsedInput.data.studentName && !isHouseholdTarget
        ? `Student: ${parsedInput.data.studentName}`
        : "Target: Household family plan",
      parsedInput.data.studentAge
        ? `Student age: ${parsedInput.data.studentAge}`
        : "Student age: mixed or not specified",
      parsedInput.data.studentInterests.length
        ? `Student interests: ${parsedInput.data.studentInterests.join(", ")}`
        : "Student interests: general curiosity",
      parsedInput.data.householdStudents.length
        ? `Household students: ${parsedInput.data.householdStudents
            .map(
              (student) =>
                `${student.name} age ${student.age} (${student.interests.join(", ") || "general interests"})`
            )
            .join("; ")}`
        : "Household students: not specified",
      preset ? `Preset: ${preset.label}` : "Preset: balanced daily adventure",
      `Resolved content template: ${templateInstructions.templateLabel}`,
      `Time available: ${parsedInput.data.timeAvailable ?? "1-2 hours"}`,
      `Budget: ${parsedInput.data.budget ?? "free"}`,
      `Energy level: ${parsedInput.data.energyLevel ?? "medium"}`,
      `Travel distance: ${parsedInput.data.travelDistance ?? "local"}`,
      `Location focus: ${location.displayLabel}`,
      `Weather context: ${environmental.weather?.shortForecast ?? weather.summary}`,
      environmental.weather?.hazards?.length
        ? `Active hazards: ${environmental.weather.hazards.join(", ")}`
        : "No major active hazards were pulled from the live weather feed.",
      resolvedTemplate === "smithsonian"
        ? `Selected Smithsonian museums: ${selectedMuseums
            .map(
              (museum) =>
                `${museum.name} [ideal for ${museum.idealFor.join(", ")}; highlights: ${museum.highlights.join(", ")}]`
            )
            .join("; ")}`
        : resolvedTemplate === "bird"
          ? `Bird migration context: ${environmental.bird.migrationSummary}`
          : "Bird migration context is not the main driver for this preset.",
      fishingRecommendation
        ? `Fishing recommendation context: best window ${fishingRecommendation.bestTimeWindow}; outlook ${fishingRecommendation.fishingOutlook}; likely species ${fishingRecommendation.likelySpecies.join(", ")}; solunar context ${environmental.solunar.summary}; Maryland DNR context ${environmental.marylandDnr.reportSummary}; water context ${environmental.water?.waterTrend ?? "no live water gage available nearby"}.`
        : resolvedTemplate === "smithsonian"
          ? `Museum stop ideas: ${selectedMuseums.map((museum) => museum.name).join(", ")}.`
          : `Nearby place ideas: ${generalNearbySpots.map((spot) => `${spot.name} (${spot.spotType})`).join(", ") || "use a practical nearby nature stop"}.`,
      templateInstructions.outputGuide,
      "Every schema field must be present in the JSON response. Use null for unknown string fields and [] for unknown arrays. Never omit keys.",
      resolvedTemplate === "smithsonian"
        ? [
            "For Smithsonian missions, missionStops should give the best stop sequence or exhibit order.",
            "scavengerHuntTasks should contain 3-8 specific hunt items scaled to the student's age and energy.",
            "parentTalkingPoints should help a parent guide the visit without sounding like a lecture.",
            "Use discussionQuestion as the reflective question for the ride home or final museum pause.",
            "If history or culture is involved, include balanced age-appropriate prompts that compare more than one perspective respectfully.",
            `Set specialExhibitNote to exactly: ${SMITHSONIAN_SPECIAL_EXHIBIT_NOTE}`,
            "Do not pretend you have live special exhibit data."
          ].join(" ")
        : resolvedTemplate === "fish"
          ? [
              "For fishing missions, make the output feel like a real Southern Maryland family fishing brief.",
              "Use highly actionable content for fishingOutlook, likelySpecies, fishingMainSpecies, fishingLiveBait, fishingArtificialBait, fishingBestPlace, fishingWhereToCast, fishingMainSpeciesDescription, and fishingOtherLikelyFish.",
              "Also include fishOfTheDayImageUrl, fishOfTheDayImageAlt, liveBaitImageUrl, liveBaitImageAlt, artificialBaitImageUrl, and artificialBaitImageAlt.",
              "Use a reliable direct image URL when you genuinely know one; otherwise return null for the image field. Never omit the keys.",
              "fishingOutlook should say what the family should do on the water today, not generic trivia.",
              "likelySpecies and fishingOtherLikelyFish should name realistic species for the same water, using short names only.",
              "fishingMainSpecies must clearly name the best target fish for today's mission.",
              "fishingLiveBait and fishingArtificialBait must name 1-2 practical bait options a parent could actually bring today.",
              "fishingBestPlace must describe the best family-friendly water type or access point, such as pond bank, creek mouth, pier, dock line, marsh edge, or protected shoreline.",
              "fishingWhereToCast must point to structure or targets such as brush piles, dock edges, shade lines, riprap, grass edges, fallen trees, points, or current seams.",
              "fishingMainSpeciesDescription must describe how that fish behaves and how to catch it in 1-2 practical sentences.",
              "Keep fishing sections concise, realistic, and field-useful."
            ].join(" ")
          : "If this is not a fishing mission, leave fishing-specific fields null or empty arrays instead of inventing fishing content.",
      "Return one complete daily adventure with a featured mission title, question, observation activity, journal prompt, discussion question, challenge, optional field trip idea, and facebook caption.",
      "If a field trip is not necessary, return an empty string for optionalFieldTripIdea.",
      preset
        ? `Make this meaningfully match the preset. ${preset.promptFocus.join(" ")}`
        : "Make this feel like a balanced, general-purpose outdoor homeschool adventure with moderate time and gear."
    ].join("\n");

    const fallbackOutput = buildDailyAdventureFallback(
      location.displayLabel,
      resolvedTemplate,
      preset?.label,
      selectedMuseums
    );
    let baseOutput: DailyAdventureOutput = fallbackOutput;

    try {
      const openai = createOpenAIClient();
      const response = await openai.responses.create({
        model: getOpenAIModel(),
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "daily_adventure",
            schema: dailyAdventureOutputJsonSchema
          }
        }
      });

      baseOutput = parseDailyAdventure(JSON.parse(response.output_text));
    } catch {
      baseOutput = parseDailyAdventure(fallbackOutput);
    }

    const recommendedNearbySpots =
      resolvedTemplate === "smithsonian"
        ? buildSmithsonianRecommendedStops(selectedMuseums)
        : fishingRecommendation?.recommendedNearbySpots ?? generalNearbySpots;
    const defaultCopy = getDefaultAdventureCopy(resolvedTemplate, location.displayLabel);
    const output = parseDailyAdventure({
      ...baseOutput,
      bestTimeWindow: fishingRecommendation?.bestTimeWindow ?? baseOutput.bestTimeWindow ?? defaultCopy.bestTimeWindow,
      suggestedPlaceType:
        resolvedTemplate === "smithsonian"
          ? baseOutput.suggestedPlaceType ?? defaultCopy.suggestedPlaceType
          : fishingRecommendation
          ? recommendedNearbySpots[0]?.spotType?.replaceAll("_", " ") ?? defaultCopy.suggestedPlaceType
          : recommendedNearbySpots[0]?.spotType?.replaceAll("_", " ") ?? defaultCopy.suggestedPlaceType,
      gearChecklist:
        fishingRecommendation?.gearChecklist ??
        baseOutput.gearChecklist ??
        defaultCopy.gearChecklist,
      safetyNote:
        fishingRecommendation?.safetyNote ??
        baseOutput.safetyNote ??
        defaultCopy.safetyNote,
      locationSummary:
        resolvedTemplate === "smithsonian"
          ? baseOutput.locationSummary ??
            `Selected Smithsonian stop${selectedMuseums.length > 1 ? "s" : ""}: ${selectedMuseums
              .map((museum) => museum.shortLabel)
              .join(", ")}.`
          : `Planning around ${location.displayLabel} within about ${location.radiusMiles} miles.`,
      whyTheseSpotsWork:
        resolvedTemplate === "smithsonian"
          ? baseOutput.whyTheseSpotsWork ??
            selectedMuseums.map((museum) => museum.familyReason).join(" ")
          : fishingRecommendation
            ? `These nearby water-access spots fit the fishing preset because they offer practical shoreline access, likely fish habitat, and better odds for a useful outing. ${environmental.marylandDnr.accessNotes}`
            : `These nearby spots fit today's ${templateInstructions.templateLabel} because they match the habitat, pace, and observation style suggested by the adventure. ${environmental.weather?.shortForecast ?? weather.summary}`,
      recommendedNearbySpots,
      specialExhibitNote:
        resolvedTemplate === "smithsonian"
          ? baseOutput.specialExhibitNote ?? SMITHSONIAN_SPECIAL_EXHIBIT_NOTE
          : baseOutput.specialExhibitNote,
      fishingOutlook: resolvedTemplate === "fish" ? fishingRecommendation?.fishingOutlook : undefined,
      likelySpecies: resolvedTemplate === "fish" ? fishingRecommendation?.likelySpecies : undefined,
      fishingMainSpecies: resolvedTemplate === "fish" ? fishingRecommendation?.primarySpecies ?? baseOutput.animalOfTheDay : undefined,
      fishingLiveBait: resolvedTemplate === "fish" ? fishingRecommendation?.liveBait : undefined,
      fishingArtificialBait: resolvedTemplate === "fish" ? fishingRecommendation?.artificialBait : undefined,
      fishingBestPlace: resolvedTemplate === "fish" ? fishingRecommendation?.bestPlace : undefined,
      fishingWhereToCast: resolvedTemplate === "fish" ? fishingRecommendation?.whereToCast : undefined,
      fishingMainSpeciesDescription: resolvedTemplate === "fish" ? fishingRecommendation?.mainSpeciesDescription : undefined,
      fishingOtherLikelyFish: resolvedTemplate === "fish" ? fishingRecommendation?.likelySpecies.slice(1, 4) : undefined,
      fishOfTheDayImageUrl: resolvedTemplate === "fish" ? baseOutput.fishOfTheDayImageUrl ?? fishingImages.fishOfTheDayImageUrl : null,
      fishOfTheDayImageAlt: resolvedTemplate === "fish" ? baseOutput.fishOfTheDayImageAlt ?? fishingImages.fishOfTheDayImageAlt : null,
      liveBaitImageUrl: resolvedTemplate === "fish" ? baseOutput.liveBaitImageUrl ?? fishingImages.liveBaitImageUrl : null,
      liveBaitImageAlt: resolvedTemplate === "fish" ? baseOutput.liveBaitImageAlt ?? fishingImages.liveBaitImageAlt : null,
      artificialBaitImageUrl:
        resolvedTemplate === "fish" ? baseOutput.artificialBaitImageUrl ?? fishingImages.artificialBaitImageUrl : null,
      artificialBaitImageAlt:
        resolvedTemplate === "fish" ? baseOutput.artificialBaitImageAlt ?? fishingImages.artificialBaitImageAlt : null,
      outingMode: resolvedTemplate === "fish" ? fishingRecommendation?.outingMode : undefined,
      fallbackPlan:
        resolvedTemplate === "fish"
          ? fishingRecommendation?.fallbackPlan ?? baseOutput.fallbackPlan ?? defaultCopy.fallbackPlan
          : baseOutput.fallbackPlan ?? defaultCopy.fallbackPlan
    });
    const generation = await saveGeneration({
      supabase,
      userId: user.id,
      studentId: parsedInput.data.targetType === "student" ? parsedInput.data.studentId : undefined,
      toolType: "daily_adventure",
      title: preset ? `${preset.titlePrefix} - ${parsedInput.data.requestDate}` : `Daily Adventure - ${parsedInput.data.requestDate}`,
      inputJson: {
        ...parsedInput.data,
        targetType: parsedInput.data.targetType ?? (isHouseholdTarget ? "household" : "student"),
        targetId:
          parsedInput.data.targetType === "student"
            ? parsedInput.data.studentId
            : parsedInput.data.targetId ?? user.id,
        householdMode: isHouseholdTarget
      },
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
