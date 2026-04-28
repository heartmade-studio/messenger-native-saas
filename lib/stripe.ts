import Stripe from "stripe";
import { env } from "./env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  _stripe = new Stripe(env.stripeSecretKey, { typescript: true });
  return _stripe;
}
