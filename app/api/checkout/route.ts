import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";

/**
 * Creates a Stripe Checkout Session (subscription mode).
 * Optional `telegramChatId` is stored in session metadata and linked on `checkout.session.completed`.
 */
export async function POST(request: NextRequest) {
  let body: { telegramChatId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawChatId = body.telegramChatId?.trim();
  let telegramChatIdMeta: string | undefined;
  if (rawChatId) {
    if (!/^-?\d+$/.test(rawChatId)) {
      return NextResponse.json(
        { error: "telegramChatId must be a numeric Telegram chat id" },
        { status: 400 },
      );
    }
    telegramChatIdMeta = rawChatId;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: env.stripePriceId, quantity: 1 }],
      success_url: `${env.appUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appUrl}/`,
      allow_promotion_codes: true,
      metadata: telegramChatIdMeta
        ? { telegram_chat_id: telegramChatIdMeta }
        : {},
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
