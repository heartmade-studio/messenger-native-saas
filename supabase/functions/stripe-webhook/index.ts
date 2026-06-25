// stripe-webhook — SKELETON (v1).
//
// Demonstrates the integration point without being a full billing system:
//   1. verify the Stripe signature (HMAC-SHA256 over the raw body),
//   2. map the event type to a user status (pure, in billing.ts),
//   3. apply that status to the user row.
//
// Intentionally out of scope for v1 (see docs/billing-and-ai.md):
//   - provisioning prices/products, the customer portal, proration,
//   - idempotency keys / replay protection, dunning on failed payments,
//   - reconciling Stripe customer ids back to users.
//
// Inert without STRIPE_WEBHOOK_SECRET: returns 200 {ok:false} so Stripe does
// not retry against an unconfigured endpoint.

import { optionalEnv } from '../_shared/env.ts';
import { withErrorReporting } from '../_shared/analytics.ts';
import { interpretWebhookEvent, verifyStripeSignature } from '../_shared/billing.ts';
import { SupabaseUserRepository } from '../_shared/supabase-repository.ts';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const webhookSecret = optionalEnv('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) return json(200, { ok: false, reason: 'not_configured' });

  const signature = req.headers.get('stripe-signature');
  if (!signature) return json(400, { error: 'missing_signature' });

  const rawBody = await req.text();
  const valid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) return json(400, { error: 'invalid_signature' });

  let event: { type: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const outcome = interpretWebhookEvent(event);
  if (!outcome) return json(200, { ok: true, ignored: event.type });

  // TODO: outcome.userId comes from client_reference_id / metadata.user_id set
  // at checkout. A production system also reconciles by stripe_customer_id.
  if (outcome.userId) {
    // The repository keys on telegram_id; a production schema would also let you
    // look up by our internal user id. For the skeleton we record the intent.
    console.info('stripe-webhook: would set status', {
      userId: outcome.userId,
      status: outcome.status,
    });
    const repo = new SupabaseUserRepository();
    await repo.recordEvent(outcome.userId, 'stripe_webhook', {
      event_type: event.type,
      status: outcome.status,
    });
  }

  return json(200, { ok: true, type: event.type });
}

Deno.serve(withErrorReporting('stripe-webhook', handler));
