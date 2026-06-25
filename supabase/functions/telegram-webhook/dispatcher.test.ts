import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { InMemoryUserRepository } from '../_shared/repository.ts';
import type { AiComposer } from '../_shared/ai.ts';
import { type DispatchDeps, dispatchUpdate } from './dispatcher.ts';
import { CapturingSender, type TelegramUpdate } from './telegram.ts';

/** Stub composer that returns the base message verbatim (no AI). */
const stubAi: AiComposer = { compose: (base) => Promise.resolve(base) };

function makeDeps(overrides: Partial<DispatchDeps> = {}): {
  deps: DispatchDeps;
  repo: InMemoryUserRepository;
  sender: CapturingSender;
} {
  const repo = new InMemoryUserRepository();
  const sender = new CapturingSender();
  const deps: DispatchDeps = {
    repo,
    sender,
    ai: stubAi,
    track: () => Promise.resolve(),
    trialDays: 14,
    now: () => new Date('2026-06-25T00:00:00.000Z'),
    ...overrides,
  };
  return { deps, repo, sender };
}

function textUpdate(chatId: number, text: string): TelegramUpdate {
  return { update_id: 1, message: { message_id: 1, chat: { id: chatId }, text } };
}

Deno.test('/start creates a user, begins onboarding, and prompts step 1', async () => {
  const { deps, repo, sender } = makeDeps();
  await dispatchUpdate(textUpdate(100, '/start'), deps);

  const user = await repo.findByTelegramId(100);
  assert(user, 'user should exist');
  assertEquals(user.status, 'onboarding');
  assertStringIncludes(sender.lastText() ?? '', 'Step 1/4');
  assert(repo.events.some((e) => e.type === 'onboarding_started'));
});

Deno.test('full conversation activates the trial and sends a first nudge', async () => {
  const { deps, repo, sender } = makeDeps();
  await dispatchUpdate(textUpdate(200, '/start'), deps);
  await dispatchUpdate(textUpdate(200, 'Sam'), deps);
  await dispatchUpdate(textUpdate(200, 'Read more books'), deps);
  await dispatchUpdate(textUpdate(200, '4'), deps); // Learning
  await dispatchUpdate(textUpdate(200, '7'), deps); // hour

  const user = await repo.findByTelegramId(200);
  assert(user);
  assertEquals(user.status, 'trialing');
  assertEquals(user.trial_ends_at, '2026-07-09T00:00:00.000Z'); // +14 days
  assertEquals(user.preferences.focus, 'Learning');

  assert(repo.events.some((e) => e.type === 'trial_activated'));
  // The confirmation, then the first nudge.
  assertStringIncludes(sender.sent.at(-2)?.text ?? '', 'free trial is now active');
  assertStringIncludes(sender.lastText() ?? '', 'first nudge');
  assertStringIncludes(sender.lastText() ?? '', 'Read more books');
});

Deno.test('invalid input during onboarding re-prompts without advancing', async () => {
  const { deps, repo, sender } = makeDeps();
  await dispatchUpdate(textUpdate(300, '/start'), deps);
  await dispatchUpdate(textUpdate(300, 'Jo'), deps); // name -> goal
  await dispatchUpdate(textUpdate(300, 'Be calmer'), deps); // goal -> focus
  await dispatchUpdate(textUpdate(300, '9'), deps); // invalid focus (1-4)

  const user = await repo.findByTelegramId(300);
  const onboarding = user?.preferences.onboarding as { step: string };
  assertEquals(onboarding.step, 'ask_focus');
  assertStringIncludes(sender.lastText() ?? '', 'number from 1 to 4');
});

Deno.test('/help and unknown commands respond without creating a user', async () => {
  const { deps, repo, sender } = makeDeps();
  await dispatchUpdate(textUpdate(400, '/help'), deps);
  assertStringIncludes(sender.lastText() ?? '', '/start');
  await dispatchUpdate(textUpdate(400, '/frobnicate'), deps);
  assertStringIncludes(sender.lastText() ?? '', "didn't catch that");
  assertEquals(await repo.findByTelegramId(400), null);
});

Deno.test('/status reflects lifecycle', async () => {
  const { deps, sender } = makeDeps();
  await dispatchUpdate(textUpdate(500, '/status'), deps);
  assertStringIncludes(sender.lastText() ?? '', 'not set up yet');
});

Deno.test('/upgrade without a checkout hook reports not configured', async () => {
  const { deps, sender } = makeDeps();
  await dispatchUpdate(textUpdate(600, '/start'), deps);
  await dispatchUpdate(textUpdate(600, '/upgrade'), deps);
  assertStringIncludes(sender.lastText() ?? '', 'not configured');
});

Deno.test('/upgrade with a checkout hook returns the link', async () => {
  const { deps, sender } = makeDeps({
    checkout: () => Promise.resolve({ ok: true, url: 'https://checkout.example/abc' }),
  });
  await dispatchUpdate(textUpdate(700, '/start'), deps);
  await dispatchUpdate(textUpdate(700, '/upgrade'), deps);
  assertStringIncludes(sender.lastText() ?? '', 'https://checkout.example/abc');
});

Deno.test('non-text updates are ignored', async () => {
  const { deps, sender } = makeDeps();
  await dispatchUpdate({ update_id: 9 }, deps);
  assertFalse(sender.sent.length > 0);
});
