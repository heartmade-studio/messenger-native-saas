// Tiny env helpers shared across functions.

/** Read a required env var; throw a clear error if it is missing or empty. */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value || value.length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

/** Read an optional env var; returns undefined when missing or empty. */
export function optionalEnv(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value && value.length > 0 ? value : undefined;
}
