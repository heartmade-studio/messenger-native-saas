// AI personalization adapter (OPTIONAL).
//
// The method's rule of thumb: keep business logic deterministic and let the LLM
// only personalize wording. So callers build a deterministic `base` message and
// ask the composer to optionally rewrite it. With no GEMINI_API_KEY the stub
// returns the base verbatim — the product works fully without any AI account,
// and AI is purely additive.

import { optionalEnv } from './env.ts';

export interface AiComposer {
  /**
   * Optionally rewrite/personalize `base`. Implementations MUST return a usable
   * message even on failure (fall back to `base`) — never throw.
   */
  compose(base: string): Promise<string>;
}

/** No-network fallback: returns the deterministic base message unchanged. */
class StubComposer implements AiComposer {
  compose(base: string): Promise<string> {
    return Promise.resolve(base);
  }
}

/** Google Gemini via the public Generative Language REST API. */
class GeminiComposer implements AiComposer {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async compose(base: string): Promise<string> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const prompt = `Rewrite the following short message to be warmer and more personal. ` +
      `Keep it to one or two sentences, plain text, no emoji.\n\nMessage: ${base}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.warn('ai: gemini request failed', { status: res.status });
        return base;
      }
      const payload = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text && text.length > 0 ? text : base;
    } catch (err) {
      console.warn('ai: gemini unreachable', {
        message: err instanceof Error ? err.message : String(err),
      });
      return base;
    }
  }
}

/** Returns Gemini when GEMINI_API_KEY is set, otherwise the deterministic stub. */
export function createAiComposer(): AiComposer {
  const apiKey = optionalEnv('GEMINI_API_KEY');
  if (!apiKey) return new StubComposer();
  return new GeminiComposer(apiKey, optionalEnv('GEMINI_MODEL') ?? 'gemini-2.0-flash');
}
