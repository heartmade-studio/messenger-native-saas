// HTTP handler factory for the telegram-webhook function.
//
// Kept separate from index.ts (the production entry point) so tests and the
// smoke script can build a handler with in-memory dependencies — no Supabase,
// no real Telegram token, no network beyond the local request.

import { timingSafeEqual } from '../_shared/security.ts';
import { type DispatchDeps, dispatchUpdate } from './dispatcher.ts';
import type { TelegramUpdate } from './telegram.ts';

export interface HandlerDeps extends DispatchDeps {
  /** Expected X-Telegram-Bot-Api-Secret-Token. When set, requests must match it. */
  webhookSecret?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function createHandler(deps: HandlerDeps): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    if (deps.webhookSecret) {
      const received = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
      if (!timingSafeEqual(received, deps.webhookSecret)) {
        return json(401, { error: 'unauthorized' });
      }
    }

    let update: TelegramUpdate;
    try {
      update = await req.json() as TelegramUpdate;
    } catch {
      return json(400, { error: 'invalid_json' });
    }

    await dispatchUpdate(update, deps);
    // Telegram only needs a 2xx to mark the update delivered.
    return json(200, { ok: true });
  };
}
