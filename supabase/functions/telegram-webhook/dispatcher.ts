// Command + conversation dispatcher.
//
// Routes a Telegram update to the right handler: slash commands (/start, /help,
// /status, /upgrade) or a free-text reply that advances the onboarding state
// machine. All side effects go through injected dependencies, so the dispatcher
// is fully unit-testable with an in-memory repo and a capturing sender.

import type { AiComposer } from '../_shared/ai.ts';
import type { TrackFn } from '../_shared/analytics.ts';
import type { CheckoutLinkResult } from '../_shared/billing.ts';
import type { UserRecord, UserRepository } from '../_shared/repository.ts';
import {
  advanceOnboarding,
  beginOnboarding,
  isOnboardingState,
  type OnboardingAnswers,
  type OnboardingState,
} from './onboarding.ts';
import type { TelegramSender, TelegramUpdate } from './telegram.ts';

export interface DispatchDeps {
  repo: UserRepository;
  sender: TelegramSender;
  ai: AiComposer;
  track: TrackFn;
  /** Optional billing hook; when absent, /upgrade reports "not configured". */
  checkout?: (userId: string) => Promise<CheckoutLinkResult>;
  /** Trial length in days (default 14). */
  trialDays?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

const HELP_TEXT = [
  'I work entirely here in chat. Commands:',
  '/start — (re)start the 4-step setup',
  '/status — see your status and trial',
  '/upgrade — move to a paid plan',
  '/help — show this message',
].join('\n');

const FALLBACK_TEXT = "I didn't catch that. Send /start to set up, or /help for commands.";

/** Read the persisted onboarding state from a user row, if any. */
function readOnboardingState(user: UserRecord): OnboardingState | null {
  const value = user.preferences?.onboarding;
  return isOnboardingState(value) ? value : null;
}

/** Build the deterministic first-nudge message (the AI layer may rewrite it). */
function buildFirstNudge(answers: OnboardingAnswers): string {
  const name = answers.name ?? 'there';
  const goal = answers.goal ?? 'your goal';
  return `Here is your first nudge, ${name}: pick one small action toward "${goal}" today.`;
}

export async function dispatchUpdate(update: TelegramUpdate, deps: DispatchDeps): Promise<void> {
  const message = update.message;
  if (!message || typeof message.text !== 'string') return; // v1 handles text messages only
  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text.startsWith('/')) {
    const command = text.split(/\s+/)[0].toLowerCase();
    switch (command) {
      case '/start':
        return await handleStart(chatId, deps);
      case '/help':
        return await deps.sender.sendMessage(chatId, HELP_TEXT);
      case '/status':
        return await handleStatus(chatId, deps);
      case '/upgrade':
        return await handleUpgrade(chatId, deps);
      default:
        return await deps.sender.sendMessage(chatId, FALLBACK_TEXT);
    }
  }

  return await handleConversation(chatId, text, deps);
}

async function handleStart(chatId: number, deps: DispatchDeps): Promise<void> {
  let user = await deps.repo.findByTelegramId(chatId);
  if (!user) user = await deps.repo.createUser(chatId);

  const begin = beginOnboarding();
  await deps.repo.updateUser(chatId, {
    status: 'onboarding',
    preferences: { onboarding: begin.state },
  });
  await deps.repo.recordEvent(user.id, 'onboarding_started');
  await deps.track('onboarding_started', user.id);
  await deps.sender.sendMessage(chatId, begin.reply);
}

async function handleConversation(
  chatId: number,
  text: string,
  deps: DispatchDeps,
): Promise<void> {
  const user = await deps.repo.findByTelegramId(chatId);
  const state = user ? readOnboardingState(user) : null;
  if (!user || !state || state.step === 'completed') {
    await deps.sender.sendMessage(chatId, FALLBACK_TEXT);
    return;
  }

  const trialDays = deps.trialDays ?? 14;
  const result = advanceOnboarding(state, text, { trialDays });

  if (!result.activated) {
    await deps.repo.updateUser(chatId, { preferences: { onboarding: result.state } });
    await deps.sender.sendMessage(chatId, result.reply);
    return;
  }

  // Final step: activate the trial.
  const now = deps.now ?? (() => new Date());
  const trialEndsAt = new Date(now().getTime() + trialDays * 86_400_000).toISOString();
  await deps.repo.updateUser(chatId, {
    status: 'trialing',
    trial_ends_at: trialEndsAt,
    preferences: { ...result.state.answers, onboarding: result.state },
  });
  await deps.repo.recordEvent(user.id, 'trial_activated', { trial_ends_at: trialEndsAt });
  await deps.track('trial_activated', user.id, { trial_ends_at: trialEndsAt });
  await deps.sender.sendMessage(chatId, result.reply);

  // Optional AI personalization of the first nudge (stub returns base verbatim).
  const nudge = await deps.ai.compose(buildFirstNudge(result.state.answers));
  await deps.sender.sendMessage(chatId, nudge);
}

async function handleStatus(chatId: number, deps: DispatchDeps): Promise<void> {
  const user = await deps.repo.findByTelegramId(chatId);
  if (!user || user.status === 'new') {
    await deps.sender.sendMessage(chatId, "You're not set up yet. Send /start to begin.");
    return;
  }
  if (user.status === 'onboarding') {
    await deps.sender.sendMessage(
      chatId,
      'Setup in progress. Reply to the last question to finish.',
    );
    return;
  }
  const lines = [`Status: ${user.status}.`];
  if (user.trial_ends_at) lines.push(`Trial ends: ${user.trial_ends_at.slice(0, 10)}.`);
  await deps.sender.sendMessage(chatId, lines.join('\n'));
}

async function handleUpgrade(chatId: number, deps: DispatchDeps): Promise<void> {
  const user = await deps.repo.findByTelegramId(chatId);
  if (!user || user.status === 'new') {
    await deps.sender.sendMessage(chatId, 'Send /start first, then come back to /upgrade.');
    return;
  }
  if (!deps.checkout) {
    await deps.sender.sendMessage(chatId, 'Billing is not configured in this demo.');
    return;
  }
  const result = await deps.checkout(user.id);
  if (result.ok && result.url) {
    await deps.sender.sendMessage(chatId, `Complete your upgrade here:\n${result.url}`);
  } else {
    await deps.sender.sendMessage(chatId, 'Billing is not available right now. Please try later.');
  }
}
