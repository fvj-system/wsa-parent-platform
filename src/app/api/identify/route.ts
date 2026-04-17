import { NextResponse } from "next/server";
import type { ResponseInputMessageContentList } from "openai/resources/responses/responses";
import { getDiscoveryLocationMeta } from "@/lib/discover/location";
import { applyDiscoveryRangeCheck } from "@/lib/discover/range-check";
import { createOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { getMarylandFishRegulation } from "@/lib/regulations/maryland-fish";
import { lookupSpecies } from "@/lib/species/global-taxonomy";
import {
  discoverCategoryOptions,
  identifyBaseResponseSchema,
  discoverCategorySchema,
  identifyResponseJsonSchema,
  identifyResponseSchema
} from "@/lib/identify";
import { getImageUploadError } from "@/lib/image-upload";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const studentName = formData.get("studentName");
    const notes = formData.get("notes");
    const rawCategory = formData.get("category");
    const rawLatitude = formData.get("latitude");
    const rawLongitude = formData.get("longitude");
    const rawLocationLabel = formData.get("locationLabel");

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "An image is required." }, { status: 400 });
    }

    const uploadError = getImageUploadError(image);
    if (uploadError) {
      return NextResponse.json({ error: uploadError }, { status: 400 });
    }

    const category = discoverCategorySchema.parse(
      typeof rawCategory === "string" && rawCategory ? rawCategory : "animal"
    );
    const latitude = typeof rawLatitude === "string" && rawLatitude ? Number(rawLatitude) : undefined;
    const longitude = typeof rawLongitude === "string" && rawLongitude ? Number(rawLongitude) : undefined;
    const location = getDiscoveryLocationMeta({
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      locationLabel: typeof rawLocationLabel === "string" ? rawLocationLabel : null
    });
    const categoryConfig = discoverCategoryOptions.find((option) => option.value === category) ?? discoverCategoryOptions[0];

    const bytes = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type || "image/jpeg"};base64,${bytes.toString("base64")}`;

    const prompt = [
      "You are a careful Wild Stallion Academy naturalist guide helping a family identify something from a photo.",
      "Do not overstate certainty. Use likely or possible language whenever confidence is not high.",
      "The audience is homeschool parents and children in Southern Maryland.",
      "Return concise, practical field-guide language with useful safety guidance.",
      `Selected discovery mode: ${categoryConfig.label}.`,
      `Observed near: ${location.observedNear}.`,
      `Region focus: ${location.regionLabel}.`,
      `Mode guidance: ${categoryConfig.shortDescription}`,
      ...categoryConfig.promptFocus,
      "Return strict structured output with a possible identification, confidence level, category, key features, look-alikes, safety note, one Wild Stallion Academy observation challenge, and one journal prompt.",
      "Also create one short, ready-to-copy Facebook caption for Wild Stallion Academy that sounds warm, adventurous, educational, and family-friendly.",
      "The caption should briefly describe the discovery and encourage curiosity or observation outdoors.",
      "Make the response materially reflect the selected discovery mode rather than staying generic.",
      "For bird mode, emphasize field marks, behavior, and habitat clues.",
      "For bug mode, emphasize wing pattern, body shape, insect clues, host plants, and habitat.",
      "For tree mode, emphasize bark, buds, leaves, seeds, and seasonality.",
      "For fish mode, emphasize body shape, fin placement, color pattern, and water habitat.",
      "For plant mode, emphasize flowers, leaves, stems, and growth form.",
      "For mushroom mode, emphasize cap, stem, gills or pores, and strong safety language.",
      "For animal mode, stay broader across mammals, reptiles, and amphibians.",
      "Include stronger caution for uncertain plants, mushrooms, insects, tracks, or animals that could be risky to handle.",
      "Always return a scientific_name field. Use an empty string if you are not confident.",
      typeof studentName === "string" && studentName ? `Student name: ${studentName}` : "Household discovery.",
      typeof notes === "string" && notes ? `Parent notes: ${notes}` : "No extra notes."
    ].join("\n");

    const content: ResponseInputMessageContentList = [
      { type: "input_text", text: prompt },
      { type: "input_image", image_url: dataUrl, detail: "auto" }
    ];

    const openai = createOpenAIClient();
    const response = await openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL || getOpenAIModel(),
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "wsa_identify_result",
          schema: identifyResponseJsonSchema
        }
      }
    });

    const baseResult = identifyBaseResponseSchema.parse(JSON.parse(response.output_text));
    const rangeChecked = applyDiscoveryRangeCheck({
      result: baseResult,
      selectedCategory: category,
      requestDate: new Date().toISOString(),
      location
    });
    const speciesLookup = await lookupSpecies({
      commonName: rangeChecked.possible_identification,
      scientificName: rangeChecked.scientific_name,
      category,
      region: location.regionLabel
    });
    const fishRegulation =
      category === "fish"
        ? getMarylandFishRegulation({
            fishName: rangeChecked.possible_identification,
            requestDate: new Date().toISOString().slice(0, 10),
            waterType: speciesLookup?.habitatTags?.[0] ?? undefined,
            locationLabel: location.locationLabel
          })
        : null;
    const result = identifyResponseSchema.parse({
      ...rangeChecked,
      taxonomy_hierarchy: speciesLookup?.taxonomy,
      taxonomy_source: speciesLookup?.source,
      range_summary: speciesLookup?.rangeSummary,
      regionally_prioritized: speciesLookup?.regionallyPrioritized,
      water_type: category === "fish" ? speciesLookup?.habitatTags?.join(", ") : undefined,
      best_bait: speciesLookup?.fishTraits?.bestBait,
      best_lures: speciesLookup?.fishTraits?.bestLures,
      best_cooking_methods: speciesLookup?.fishTraits?.bestCookingMethods,
      flavor_profile: speciesLookup?.fishTraits?.flavorProfile,
      preparation_tips: speciesLookup?.fishTraits?.preparationTips,
      best_season: speciesLookup?.fishTraits?.bestSeason,
      wsa_angler_tip: speciesLookup?.fishTraits?.wsaAnglerTip,
      regulation_status: fishRegulation?.regulation_status,
      season_note: fishRegulation?.season_note,
      bag_limit_note: fishRegulation?.bag_limit_note,
      size_limit_note: fishRegulation?.size_limit_note,
      protected_note: fishRegulation?.protected_note,
      gear_rule_note: fishRegulation?.gear_rule_note,
      regulation_source: fishRegulation?.regulation_source,
      regulation_source_url: fishRegulation?.regulation_source_url,
      regulation_last_checked: fishRegulation?.regulation_last_checked
    });
    return NextResponse.json({ result, selectedCategory: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
