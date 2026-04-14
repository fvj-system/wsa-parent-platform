import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const acceptHouseholdInviteSchema = z.object({
  token: z.string().trim().min(1),
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

    const parsed = acceptHouseholdInviteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing household invite token." }, { status: 400 });
    }

    const { error } = await supabase.rpc("accept_household_invite", {
      invite_token_input: parsed.data.token,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/dashboard");
    revalidatePath("/students");
    revalidatePath("/planner");
    revalidatePath("/history");
    revalidatePath("/discover");
    revalidatePath("/discover/catalog");
    revalidatePath("/my-classes");
    revalidatePath("/household");

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
