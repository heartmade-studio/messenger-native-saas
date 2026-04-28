import { env } from "./env";

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; is_bot: boolean; first_name?: string; username?: string };
    chat: { id: number; type: string; username?: string; first_name?: string };
    text?: string;
  };
};

export function verifyTelegramWebhookSecret(request: Request): boolean {
  const expected = env.telegramWebhookSecret;
  if (!expected) return true;
  const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  return got === expected;
}

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const token = env.telegramBotToken;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram sendMessage failed: ${res.status} ${err}`);
  }
}
