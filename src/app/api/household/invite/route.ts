import { NextResponse } from "next/server";
import { z } from "zod";
import { getHouseholdContext } from "@/lib/households";
import { createClient } from "@/lib/supabase/server";

const createHouseholdInviteSchema = z.object({
  inviteEmail: z.string().trim().email().max(200),
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

    const parsed = createHouseholdInviteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a real email address." }, { status: 400 });
    }

    const inviteEmail = parsed.data.inviteEmail.trim().toLowerCase();
    if (user.email?.toLowerCase() === inviteEmail) {
      return NextResponse.json(
        { error: "Use the other parent's email address for the invite." },
        { status: 400 },
      );
    }

    const household = await getHouseholdContext(supabase, user.id);
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from("household_invites")
      .select("id, invite_email, invite_token, status, created_at, accepted_at")
      .eq("household_id", household.householdId)
      .eq("invite_email", inviteEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInviteError) {
      throw new Error(existingInviteError.message);
    }

    let inviteRow = existingInvite;

    if (!inviteRow) {
      const { data: insertedInvite, error: insertError } = await supabase
        .from("household_invites")
        .insert({
          household_id: household.householdId,
          invited_by_user_id: user.id,
          invite_email: inviteEmail,
        })
        .select("id, invite_email, invite_token, status, created_at, accepted_at")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      inviteRow = insertedInvite;
    }

    if (!inviteRow) {
      throw new Error("Could not create the household invite.");
    }

    const origin = new URL(request.url).origin;
    const inviteLink = `${origin}/?invite=${encodeURIComponent(inviteRow.invite_token)}`;

    return NextResponse.json({
      email: inviteEmail,
      inviteLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
