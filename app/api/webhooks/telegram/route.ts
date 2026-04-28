import { NextRequest, NextResponse } from "next/server";
import {
  verifyTelegramWebhookSecret,
  sendTelegramMessage,
  type TelegramUpdate,
} from "@/lib/telegram";
import { getSubscriptionByTelegramChatId } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyTelegramWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const msg = update.message;
  if (!msg?.text || !msg.chat) {
    return NextResponse.json({ ok: true });
  }

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const lower = text.toLowerCase();

  try {
    if (lower === "/start" || lower.startsWith("/start ")) {
      await sendTelegramMessage(
        chatId,
        [
          "Welcome to the <b>Messenger-Native SaaS</b> demo bot.",
          "",
          "Your <b>chat id</b> (paste on the landing page before checkout):",
          `<code>${chatId}</code>`,
          "",
          "After subscribing, use <code>/status</code> to see your subscription state in the database.",
        ].join("\n"),
      );
      return NextResponse.json({ ok: true });
    }

    if (lower === "/status" || lower.startsWith("/status ")) {
      const row = await getSubscriptionByTelegramChatId(chatId);
      if (!row) {
        await sendTelegramMessage(
          chatId,
          "No subscription row found for this chat. Complete checkout with your chat id in the form, then try again.",
        );
        return NextResponse.json({ ok: true });
      }
      await sendTelegramMessage(
        chatId,
        [
          "<b>Subscription (demo)</b>",
          `Status: <code>${row.status ?? "unknown"}</code>`,
          `Stripe customer: <code>${row.stripe_customer_id ?? "—"}</code>`,
          `Stripe subscription: <code>${row.stripe_subscription_id ?? "—"}</code>`,
        ].join("\n"),
      );
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(
      chatId,
      "Try <code>/start</code> or <code>/status</code>.",
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bot error";
    console.error("[telegram webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
