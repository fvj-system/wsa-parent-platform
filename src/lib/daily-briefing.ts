import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAnimalBriefing } from "@/lib/animal-of-the-day";
import { generateBirdBriefing } from "@/lib/bird-of-the-day";
import { generateFishBriefing } from "@/lib/fish-of-the-day";
import { generatePlantBriefing } from "@/lib/plant-of-the-day";
import type { AnimalOutput, BirdOutput, FishOutput, GenerationRecord, PlantOutput } from "@/lib/generations";
import type { StudentRecord } from "@/lib/students";

export type HouseholdBriefing = {
  animalGeneration: GenerationRecord;
  animalOutput: AnimalOutput;
  birdGeneration: GenerationRecord;
  birdOutput: BirdOutput;
  plantGeneration: GenerationRecord;
  plantOutput: PlantOutput;
  fishGeneration: GenerationRecord;
  fishOutput: FishOutput;
};

export async function ensureHouseholdBriefing(
  supabase: SupabaseClient,
  userId: string,
  existingGenerations: GenerationRecord[],
  locationLabel = process.env.WSA_DEFAULT_REGION || "Delaware, Maryland, and Virginia"
): Promise<HouseholdBriefing> {
  const today = new Date().toISOString().slice(0, 10);
  const existingAnimal = existingGenerations.find(
    (item) =>
      item.tool_type === "animal_of_the_day" &&
      !item.student_id &&
      ((item.input_json as Record<string, unknown> | null)?.requestDate as string | undefined) === today
  );
  const existingFish = existingGenerations.find(
    (item) =>
      item.tool_type === "fish_of_the_day" &&
      !item.student_id &&
      ((item.input_json as Record<string, unknown> | null)?.requestDate as string | undefined) === today
  );
  const existingBird = existingGenerations.find(
    (item) =>
      item.tool_type === "bird_of_the_day" &&
      !item.student_id &&
      ((item.input_json as Record<string, unknown> | null)?.requestDate as string | undefined) === today
  );
  const existingPlant = existingGenerations.find(
    (item) =>
      item.tool_type === "plant_of_the_day" &&
      !item.student_id &&
      ((item.input_json as Record<string, unknown> | null)?.requestDate as string | undefined) === today
  );

  const animalResult = existingAnimal
    ? {
        generation: existingAnimal,
        output: existingAnimal.output_json as AnimalOutput
      }
    : await generateAnimalBriefing({
        supabase,
        userId,
        input: {
          animalName: "surprise me",
          requestDate: today,
          locationLabel,
          radiusMiles: 10,
          weatherCondition: "clear",
          householdMode: true
        }
      });

  const fishResult = existingFish
    ? {
        generation: existingFish,
        output: existingFish.output_json as FishOutput
      }
    : await generateFishBriefing({
        supabase,
        userId,
        input: {
          requestDate: today,
          locationLabel,
          radiusMiles: 10,
          weatherCondition: "clear",
          householdMode: true
        }
      });
  const birdResult = existingBird
    ? {
        generation: existingBird,
        output: existingBird.output_json as BirdOutput
      }
    : await generateBirdBriefing({
        supabase,
        userId,
        input: {
          requestDate: today,
          locationLabel,
          radiusMiles: 10,
          weatherCondition: "clear",
          householdMode: true
        }
      });
  const plantResult = existingPlant
    ? {
        generation: existingPlant,
        output: existingPlant.output_json as PlantOutput
      }
    : await generatePlantBriefing({
        supabase,
        userId,
        input: {
          requestDate: today,
          locationLabel,
          radiusMiles: 10,
          weatherCondition: "clear",
          householdMode: true
        }
      });

  if (!animalResult.generation || !birdResult.generation || !plantResult.generation || !fishResult.generation) {
    throw new Error("Daily household briefing could not be created.");
  }

  return {
    animalGeneration: animalResult.generation,
    animalOutput: animalResult.output,
    birdGeneration: birdResult.generation,
    birdOutput: birdResult.output,
    plantGeneration: plantResult.generation,
    plantOutput: plantResult.output,
    fishGeneration: fishResult.generation,
    fishOutput: fishResult.output
  };
}

export type TailoredStudentBriefing = {
  headline: string;
  explanation: string;
  challenge: string;
  journalPrompt: string;
  gearNote: string;
};

export function tailorAnimalBriefingForStudent(student: StudentRecord, output: AnimalOutput): TailoredStudentBriefing {
  const band = getAgeBand(student.age);
  return {
    headline: `${student.name}'s animal mission`,
    explanation:
      band === "young"
        ? `Look for simple clues about how a ${output.animalName} moves, hides, or finds food.`
        : band === "middle"
          ? `Today ${student.name} can study how ${output.animalName} uses its habitat and what signs show it belongs there.`
          : `Challenge ${student.name} to connect ${output.animalName}'s behavior, habitat, and survival clues into one field observation.`,
    challenge:
      band === "young"
        ? `Spot one clear sign of ${output.animalName} life and tell the family what you noticed first.`
        : band === "middle"
          ? `Record two field marks or behavior clues that helped ${student.name} understand this animal better.`
          : `Compare today's animal with one look-alike or neighbor species and note what makes this one distinct.`,
    journalPrompt:
      band === "young"
        ? `Draw ${output.animalName} in the place where you think it feels safest today.`
        : band === "middle"
          ? `Write 2-3 sentences about why today's nearby place is a good match for ${output.animalName}.`
          : `Write a short field note explaining why ${output.animalName} fits today's weather, habitat, and time window.`,
    gearNote:
      band === "young"
        ? "Keep the gear light: water, a notebook, and one observation tool is plenty."
        : "Bring the basic field kit and let the mission go a little deeper if attention stays strong."
  };
}

export function tailorFishBriefingForStudent(student: StudentRecord, output: FishOutput): TailoredStudentBriefing {
  const band = getAgeBand(student.age);
  return {
    headline: `${student.name}'s fish mission`,
    explanation:
      band === "young"
        ? `Focus on what this fish needs: water, cover, and a safe place to feed.`
        : band === "middle"
          ? `Help ${student.name} notice how today's water, bait choice, and access point all fit ${output.fishName}.`
          : `Push the mission toward real fishing judgment by asking ${student.name} why this fish fits today's conditions better than other likely species.`,
    challenge:
      band === "young"
        ? "Point out one place where a fish might hide or feed today."
        : band === "middle"
          ? `Explain why ${output.bestBeginnerBait.toLowerCase()} is a practical beginner bait here.`
          : `Compare the beginner bait and optional lure, then decide which one makes more sense for today's outing.`,
    journalPrompt:
      band === "young"
        ? `Draw the water spot you would try first and circle where the fish might be.`
        : band === "middle"
          ? `Write a short note about the best window today and what signs would tell you to stay or move.`
          : `Write a field note on how today's outlook, bait, and access combine into a smart family fishing plan.`,
    gearNote:
      band === "young"
        ? "Keep the setup simple and focus on safe observation if attention gets tired."
        : "A basic rod, simple tackle, and a notebook are enough for a useful family mission."
  };
}

export function tailorBirdBriefingForStudent(student: StudentRecord, output: BirdOutput): TailoredStudentBriefing {
  const band = getAgeBand(student.age);
  return {
    headline: `${student.name}'s bird note`,
    explanation:
      band === "young"
        ? `Listen first, then look for the clearest shape, color patch, or movement clue.`
        : band === "middle"
          ? `Help ${student.name} connect field marks, habitat, and bird sounds into one useful observation.`
          : `Push the observation deeper by comparing field marks, behavior, and habitat instead of relying on one clue alone.`,
    challenge: output.familyChallenge,
    journalPrompt: output.journalPrompt,
    gearNote: "Binoculars, a notebook, and a quiet pace are enough for a useful bird mission."
  };
}

export function tailorPlantBriefingForStudent(student: StudentRecord, output: PlantOutput): TailoredStudentBriefing {
  const band = getAgeBand(student.age);
  return {
    headline: `${student.name}'s plant note`,
    explanation:
      band === "young"
        ? `Start with shape, color, and where the plant is growing.`
        : band === "middle"
          ? `Help ${student.name} notice leaf shape, bark, flowers, or seeds before guessing the plant.`
          : `Push the field note toward plant clues, habitat, and seasonality instead of a fast guess.`,
    challenge: output.familyChallenge,
    journalPrompt: output.journalPrompt,
    gearNote: "A notebook and a slow close look are usually more useful than carrying too much gear."
  };
}

function getAgeBand(age: number) {
  if (age <= 6) return "young";
  if (age <= 10) return "middle";
  return "older";
}
