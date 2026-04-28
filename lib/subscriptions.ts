import { getSupabaseAdmin } from "./supabase-admin";

export type SubscriptionRow = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  telegram_chat_id: number | null;
  updated_at: string;
};

export async function upsertFromStripe(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
  telegramChatId: number | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("subscriptions").upsert(
    {
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      status: params.status,
      telegram_chat_id: params.telegramChatId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_customer_id" },
  );
  if (error) throw error;
}

export async function getSubscriptionByTelegramChatId(
  chatId: number,
): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (error) throw error;
  return data as SubscriptionRow | null;
}

/** Updates billing fields without overwriting telegram_chat_id (used by Stripe subscription webhooks). */
export async function updateBillingByCustomerId(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: params.stripeSubscriptionId,
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", params.stripeCustomerId);
  if (error) throw error;
}
