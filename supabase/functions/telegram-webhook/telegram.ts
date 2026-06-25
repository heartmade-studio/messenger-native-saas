// Telegram Bot API types (the subset we use) and a minimal sender.
//
// The handler depends on the `TelegramSender` interface, so tests and the smoke
// script can swap in a CapturingSender and assert on outgoing messages without
// hitting the network.

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramSender {
  sendMessage(chatId: number, text: string): Promise<void>;
}

/** Real sender that POSTs to the Telegram Bot API. */
export function createTelegramSender(botToken: string): TelegramSender {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  return {
    async sendMessage(chatId, text) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          console.warn('telegram: sendMessage non-200', { status: res.status });
        }
      } catch (err) {
        console.warn('telegram: sendMessage failed', {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
  };
}

/** Sender that records messages instead of sending them (tests + smoke). */
export class CapturingSender implements TelegramSender {
  readonly sent: Array<{ chatId: number; text: string }> = [];

  sendMessage(chatId: number, text: string): Promise<void> {
    this.sent.push({ chatId, text });
    return Promise.resolve();
  }

  /** Text of the last message sent, or undefined if none. */
  lastText(): string | undefined {
    return this.sent.at(-1)?.text;
  }
}
