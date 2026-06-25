// Optional observability: product analytics (PostHog) and error tracking (Sentry).
//
// Both are dependency-free (direct HTTP) and OPTIONAL by design: when the
// relevant env var is unset, every entry point is a no-op and never throws.
// Observability must never take down the request it observes — so all network
// calls here swallow their own errors.

import { optionalEnv } from './env.ts';

export type TrackFn = (
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>,
) => Promise<void>;

/**
 * Send a product/funnel event to PostHog. No-op when POSTHOG_API_KEY is unset.
 * `distinctId` should be a stable user id so backend events stitch into one
 * person. Mirrors the rows written to the Postgres `events` table.
 */
export const track: TrackFn = async (event, distinctId, properties) => {
  const apiKey = optionalEnv('POSTHOG_API_KEY');
  if (!apiKey) return;
  const host = optionalEnv('POSTHOG_HOST') ?? 'https://eu.i.posthog.com';
  try {
    await fetch(`${host.replace(/\/+$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: properties ?? {},
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn('analytics: posthog capture failed', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

interface ParsedDsn {
  storeUrl: string;
  publicKey: string;
}

/** Parse `https://<publicKey>@<host>/<projectId>` into a store endpoint + key. */
function parseSentryDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+/, '');
    if (!publicKey || !projectId) return null;
    return { storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/`, publicKey };
  } catch {
    return null;
  }
}

/** Report an error to Sentry. No-op when SENTRY_DSN is unset; never throws. */
export async function captureError(
  err: unknown,
  context: Record<string, unknown> = {},
): Promise<void> {
  const dsn = optionalEnv('SENTRY_DSN');
  if (!dsn) return;
  const parsed = parseSentryDsn(dsn);
  if (!parsed) {
    console.warn('analytics: SENTRY_DSN is set but could not be parsed');
    return;
  }
  const error = err instanceof Error ? err : new Error(typeof err === 'string' ? err : String(err));
  const environment = optionalEnv('SENTRY_ENVIRONMENT') ?? 'production';
  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    environment,
    logger: 'edge',
    exception: {
      values: [{
        type: error.name || 'Error',
        value: error.message || String(err),
      }],
    },
    extra: { ...context, ...(error.stack ? { stack: error.stack } : {}) },
  };
  try {
    await fetch(parsed.storeUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sentry-auth':
          `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=mns-edge/1.0`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (postErr) {
    console.warn('analytics: sentry send failed', {
      message: postErr instanceof Error ? postErr.message : String(postErr),
    });
  }
}

/**
 * Wrap a request handler so any unhandled error is reported to Sentry (if
 * configured) and answered with a 500 instead of an opaque runtime crash.
 */
export function withErrorReporting(
  fnName: string,
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      await captureError(err, { function: fnName });
      console.error(`${fnName} unhandled error`, {
        message: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      });
      return new Response(JSON.stringify({ error: 'internal_error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  };
}
