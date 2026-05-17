import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl, getStripeClient } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const donationCheckoutSchema = z.object({
  amountDollars: z.number().min(1).max(500),
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

    const parsed = donationCheckoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Choose a valid donation amount." },
        { status: 400 },
      );
    }

    const amountCents = Math.round(parsed.data.amountDollars * 100);
    const stripe = getStripeClient();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: "Wild Stallion Academy family donation",
              description: "A small family donation to support WSA tools and adventures.",
            },
            unit_amount: amountCents,
          },
        },
      ],
      metadata: {
        kind: "wsa_family_donation",
        user_id: user.id,
      },
      success_url: `${appUrl}/donate?success=1`,
      cancel_url: `${appUrl}/donate?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe checkout URL was unavailable." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open Stripe checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
