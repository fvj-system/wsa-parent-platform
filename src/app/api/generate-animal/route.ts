import { NextResponse } from "next/server";
import { generateAnimalBriefing } from "@/lib/animal-of-the-day";
import { createClient } from "@/lib/supabase/server";
import { animalInputSchema } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedInput = animalInputSchema.safeParse(await request.json());

    if (!parsedInput.success) {
      return NextResponse.json({ error: "Invalid animal request." }, { status: 400 });
    }
    const household = await getHouseholdContext(supabase, user.id);

    if (parsedInput.data.studentId) {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, name")
        .eq("household_id", household.householdId)
        .eq("id", parsedInput.data.studentId)
        .maybeSingle();

      if (studentError) {
        return NextResponse.json({ error: studentError.message }, { status: 500 });
      }

      if (!student) {
        return NextResponse.json({ error: "Selected student not found." }, { status: 404 });
      }
    }

    const { output, generation } = await generateAnimalBriefing({
      supabase,
      userId: user.id,
      input: {
        animalName: parsedInput.data.animalName,
        childAge: parsedInput.data.childAge,
        studentId: parsedInput.data.studentId,
        studentName: parsedInput.data.studentName,
        locationLabel: parsedInput.data.locationLabel,
        latitude: parsedInput.data.latitude,
        longitude: parsedInput.data.longitude,
        radiusMiles: parsedInput.data.radiusMiles,
        weatherCondition: parsedInput.data.weatherCondition
      }
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
