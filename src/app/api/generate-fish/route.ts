import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { generateFishBriefing } from "@/lib/fish-of-the-day";
import { getHouseholdContext } from "@/lib/households";

const generateFishSchema = z.object({
  requestDate: z.string().trim().min(1),
  studentId: z.string().uuid().optional(),
  studentName: z.string().trim().min(1).max(80).optional(),
  childAge: z.coerce.number().int().min(3).max(18).optional(),
  locationLabel: z.string().trim().min(2).max(120).default("Southern Maryland"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMiles: z.coerce.number().int().min(1).max(50).default(10),
  weatherCondition: z.string().trim().max(60).default("clear")
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const parsedInput = generateFishSchema.safeParse(await request.json());

    if (!parsedInput.success) {
      return NextResponse.json({ error: "Invalid fish request." }, { status: 400 });
    }
    const household = await getHouseholdContext(supabase, user.id);

    if (parsedInput.data.studentId) {
      const { data: student, error } = await supabase
        .from("students")
        .select("id")
        .eq("household_id", household.householdId)
        .eq("id", parsedInput.data.studentId)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!student) return NextResponse.json({ error: "Selected student not found." }, { status: 404 });
    }

    const { output, generation } = await generateFishBriefing({
      supabase,
      userId: user.id,
      input: parsedInput.data
    });

    return NextResponse.json({ output, generation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
