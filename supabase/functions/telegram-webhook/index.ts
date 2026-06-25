// Production entry point for the telegram-webhook Edge Function.
//
// Wires the real dependencies (Supabase repo, real Telegram sender, AI composer,
// PostHog) into the handler and serves it. Optional integrations are resolved
// lazily and degrade gracefully when their env vars are absent.

import { optionalEnv, requireEnv } from '../_shared/env.ts';
import { createAiComposer } from '../_shared/ai.ts';
import { track, withErrorReporting } from '../_shared/analytics.ts';
import { createCheckoutLink } from '../_shared/billing.ts';
import { SupabaseUserRepository } from '../_shared/supabase-repository.ts';
import { createHandler } from './app.ts';
import { createTelegramSender } from './telegram.ts';

const botUsername = optionalEnv('TELEGRAM_BOT_USERNAME');
const trialDays = Number.parseInt(optionalEnv('TRIAL_DAYS') ?? '14', 10) || 14;

const handler = createHandler({
  repo: new SupabaseUserRepository(),
  sender: createTelegramSender(requireEnv('TELEGRAM_BOT_TOKEN')),
  ai: createAiComposer(),
  track,
  checkout: (userId: string) => createCheckoutLink({ userId, botUsername }),
  trialDays,
  webhookSecret: requireEnv('TELEGRAM_WEBHOOK_SECRET'),
});

Deno.serve(withErrorReporting('telegram-webhook', handler));
