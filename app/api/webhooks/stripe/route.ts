import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { updateBillingByCustomerId, upsertFromStripe } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode !== "subscription") {
        return NextResponse.json({ received: true });
      }
      const subscriptionId = session.subscription;
      const customerId = session.customer;
      if (!subscriptionId || !customerId) {
        return NextResponse.json({ received: true });
      }
      const sub = await stripe.subscriptions.retrieve(
        typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id,
      );
      const customerStr = typeof customerId === "string" ? customerId : customerId.id;
      const meta = session.metadata ?? {};
      const rawTg = meta.telegram_chat_id;
      const parsed =
        rawTg !== undefined && rawTg !== null && String(rawTg).trim() !== ""
          ? Number.parseInt(String(rawTg), 10)
          : NaN;
      const telegramChatId = Number.isFinite(parsed) ? parsed : null;

      await upsertFromStripe({
        stripeCustomerId: customerStr,
        stripeSubscriptionId: sub.id,
        status: sub.status,
        telegramChatId,
      });
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object;
      const customerId = sub.customer;
      if (!customerId) {
        return NextResponse.json({ received: true });
      }
      const customerStr = typeof customerId === "string" ? customerId : customerId.id;
      await updateBillingByCustomerId({
        stripeCustomerId: customerStr,
        stripeSubscriptionId: sub.id,
        status: sub.status,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook handler error";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
