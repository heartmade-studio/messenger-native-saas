import { assert, assertEquals } from '@std/assert';
import { createAiComposer } from './ai.ts';
import { captureError, track } from './analytics.ts';
import { interpretWebhookEvent } from './billing.ts';

/** Remove every optional integration var so we exercise the "no keys" path. */
function clearOptionalEnv(): void {
  for (
    const key of [
      'GEMINI_API_KEY',
      'GEMINI_MODEL',
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_ID',
      'STRIPE_WEBHOOK_SECRET',
      'POSTHOG_API_KEY',
      'POSTHOG_HOST',
      'SENTRY_DSN',
      'SENTRY_ENVIRONMENT',
    ]
  ) {
    Deno.env.delete(key);
  }
}

Deno.test('AI composer falls back to the deterministic stub without a key', async () => {
  clearOptionalEnv();
  const composer = createAiComposer();
  const out = await composer.compose('hello base message');
  assertEquals(out, 'hello base message');
});

Deno.test('track() is a no-op (no throw, no network) without POSTHOG_API_KEY', async () => {
  clearOptionalEnv();
  // Must resolve without throwing even though there is no key/host configured.
  await track('trial_activated', 'user-123', { plan: 'demo' });
  assert(true);
});

Deno.test('captureError() is a no-op without SENTRY_DSN', async () => {
  clearOptionalEnv();
  await captureError(new Error('boom'), { function: 'test' });
  assert(true);
});

Deno.test('interpretWebhookEvent maps event types to statuses', () => {
  assertEquals(
    interpretWebhookEvent({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'u1' } },
    }),
    { userId: 'u1', status: 'active' },
  );
  assertEquals(
    interpretWebhookEvent({
      type: 'customer.subscription.deleted',
      data: { object: { metadata: { user_id: 'u2' } } },
    }),
    { userId: 'u2', status: 'cancelled' },
  );
  assertEquals(interpretWebhookEvent({ type: 'some.other.event' }), null);
});
