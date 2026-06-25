// Billing adapter (Stripe) — SKELETON in v1.
//
// What is real here: creating a Checkout session link, the pure event→status
// mapping, and webhook signature verification. What is intentionally NOT here:
// price/product provisioning, the customer portal, proration, dunning, trial-to-
// paid edge cases. See docs/billing-and-ai.md for the TODO list.
//
// Everything degrades gracefully: with no STRIPE_SECRET_KEY / STRIPE_PRICE_ID,
// createCheckoutLink reports `billing_not_configured` and the bot keeps working.

import { optionalEnv } from './env.ts';
import { timingSafeEqual } from './security.ts';
import type { UserStatus } from './repository.ts';

export interface CheckoutLinkResult {
  ok: boolean;
  url?: string;
  /** Machine-readable reason when ok === false. */
  reason?: string;
}

/**
 * Create a Stripe Checkout session and return its URL. Returns
 * `{ ok: false, reason: 'billing_not_configured' }` when Stripe env is absent.
 */
export async function createCheckoutLink(
  params: { userId: string; botUsername?: string },
): Promise<CheckoutLinkResult> {
  const secretKey = optionalEnv('STRIPE_SECRET_KEY');
  const priceId = optionalEnv('STRIPE_PRICE_ID');
  if (!secretKey || !priceId) return { ok: false, reason: 'billing_not_configured' };

  const returnUrl = params.botUsername ? `https://t.me/${params.botUsername}` : 'https://t.me';
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('success_url', returnUrl);
  form.set('cancel_url', returnUrl);
  form.set('line_items[0][price]', priceId);
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', params.userId);
  form.set('metadata[user_id]', params.userId);

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn('billing: stripe checkout failed', { status: res.status });
      return { ok: false, reason: 'stripe_error' };
    }
    const payload = await res.json() as { url?: string | null };
    return payload.url ? { ok: true, url: payload.url } : { ok: false, reason: 'stripe_error' };
  } catch (err) {
    console.warn('billing: stripe unreachable', {
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, reason: 'stripe_unreachable' };
  }
}

export interface StripeEventLike {
  type: string;
  data?: { object?: Record<string, unknown> };
}

export interface BillingOutcome {
  /** Our user id (from client_reference_id / metadata.user_id), if present. */
  userId: string | null;
  status: UserStatus;
}

/**
 * Pure mapping from a Stripe event to the user status it should produce.
 * Returns null for events we don't act on. Unit-testable in isolation.
 */
export function interpretWebhookEvent(event: StripeEventLike): BillingOutcome | null {
  const obj = event.data?.object ?? {};
  const metadata = obj.metadata as Record<string, unknown> | undefined;
  const userId = typeof obj.client_reference_id === 'string'
    ? obj.client_reference_id
    : typeof metadata?.user_id === 'string'
    ? metadata.user_id
    : null;

  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.paid':
      return { userId, status: 'active' };
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
      return { userId, status: 'cancelled' };
    default:
      return null;
  }
}

/**
 * Verify a Stripe `Stripe-Signature` header (`t=...,v1=...`) against the raw
 * request body using HMAC-SHA256. Returns false on any malformed input.
 */
export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const kv of signatureHeader.split(',')) {
    const idx = kv.indexOf('=');
    if (idx > 0) parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  }
  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(expected, v1);
}
