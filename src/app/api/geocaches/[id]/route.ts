import { NextResponse } from "next/server";
import { z } from "zod";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";

const updateGeocacheSchema = z.object({
  status: z.enum(["active", "found", "archived"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateGeocacheSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid status update." },
        { status: 400 },
      );
    }

    const household = await getHouseholdContext(supabase, user.id);
    const { error } = await supabase
      .from("geocaches")
      .update({
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("household_id", household.householdId);

    if (error) {
      if (/relation .*geocaches.* does not exist/i.test(error.message)) {
        return NextResponse.json(
          { error: "The community clue trail is not live in the database yet. Apply migrations 0031 and 0032 first." },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
