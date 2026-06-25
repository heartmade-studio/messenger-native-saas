// Smoke test: boot the real webhook handler with in-memory dependencies, send a
// simulated Telegram /start update over HTTP, and assert 200 + the expected
// onboarding reply. No Docker, no Supabase, no Telegram token required.
//
//   deno task smoke
//
// This is the "fork and run" proof: it exercises the actual HTTP path (secret
// header check, JSON parse, dispatch) end to end.

import { createHandler } from '../supabase/functions/telegram-webhook/app.ts';
import { CapturingSender } from '../supabase/functions/telegram-webhook/telegram.ts';
import { InMemoryUserRepository } from '../supabase/functions/_shared/repository.ts';

const SECRET = 'smoke-secret-token';

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  Deno.exit(1);
}

const repo = new InMemoryUserRepository();
const sender = new CapturingSender();
const handler = createHandler({
  repo,
  sender,
  ai: { compose: (base) => Promise.resolve(base) },
  track: () => Promise.resolve(),
  trialDays: 14,
  webhookSecret: SECRET,
});

const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, handler);
const { port } = server.addr as Deno.NetAddr;
const url = `http://127.0.0.1:${port}/`;

try {
  // 1) A request without the secret header must be rejected.
  const unauth = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ update_id: 1 }),
  });
  await unauth.body?.cancel();
  if (unauth.status !== 401) fail(`expected 401 without secret, got ${unauth.status}`);
  console.log(`OK   missing secret -> 401`);

  // 2) A valid /start update must return 200.
  const startUpdate = {
    update_id: 2,
    message: { message_id: 1, chat: { id: 4242 }, from: { id: 4242 }, text: '/start' },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET,
    },
    body: JSON.stringify(startUpdate),
  });
  const body = await res.json();
  if (res.status !== 200) fail(`expected 200 for /start, got ${res.status}`);
  if (body?.ok !== true) fail(`expected { ok: true }, got ${JSON.stringify(body)}`);
  console.log(`OK   /start -> 200 ${JSON.stringify(body)}`);

  // 3) The bot must have replied with the step-1 onboarding prompt.
  const reply = sender.lastText() ?? '';
  if (!reply.includes('Step 1/4')) fail(`expected step 1 prompt, got: ${reply.slice(0, 80)}`);
  console.log(`OK   reply contains step 1 prompt`);

  // 4) The user row must have been created and put into onboarding.
  const user = await repo.findByTelegramId(4242);
  if (!user || user.status !== 'onboarding') fail('expected an onboarding user row');
  console.log(`OK   user 4242 created with status=onboarding`);

  console.log('\nSmoke test passed.');
} finally {
  await server.shutdown();
}
