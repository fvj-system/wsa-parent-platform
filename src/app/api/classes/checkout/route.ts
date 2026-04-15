import { NextResponse } from "next/server";
import { z } from "zod";
import { createClassCheckoutSession } from "@/lib/class-bookings";
import { createClient } from "@/lib/supabase/server";

const waiverSchema = z.object({
  emergencyContact: z.string().trim().min(1, "Emergency contact is required."),
  medicalNotes: z.string().trim().max(1200).optional().or(z.literal("")),
  signatureName: z.string().trim().min(1, "Signature name is required."),
  saveOnFile: z.boolean().optional().default(false),
  accepted: z.boolean()
});

const createCheckoutSchema = z.object({
  classId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1),
  useSavedWaiverOnFile: z.boolean().optional(),
  waiver: waiverSchema.optional()
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createCheckoutSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });
    }

    const result = await createClassCheckoutSession({
      supabase,
      userId: user.id,
      userEmail: user.email,
      classId: parsed.data.classId,
      studentIds: parsed.data.studentIds,
      useSavedWaiverOnFile: parsed.data.useSavedWaiverOnFile,
      waiver: parsed.data.waiver
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    const status =
      message.includes("already")
      || message.includes("full")
      || message.includes("age range")
      || message.includes("Choose at least one student")
      || message.includes("waiver")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
