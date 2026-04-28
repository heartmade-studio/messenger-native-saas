/**
 * Server-only environment variables. Fails at request time if required vars are missing.
 * See `.env.example` for descriptions.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  get appUrl() {
    return required("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET");
  },
  get stripePriceId() {
    return required("STRIPE_PRICE_ID");
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get telegramBotToken() {
    return required("TELEGRAM_BOT_TOKEN");
  },
  /** Optional. If set, Telegram sends `X-Telegram-Bot-Api-Secret-Token` on webhooks. */
  get telegramWebhookSecret() {
    return process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  },
};
