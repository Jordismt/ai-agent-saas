import { createSupabaseServerClient } from "../../infrastructure/database/supabase.js";
import { AppError } from "../errors/AppError.js";

// Fail closed: only a verified local Stripe webhook may update business_billing.
export async function requireActiveBusiness(businessId, client = createSupabaseServerClient()) {
  if (!businessId) throw new AppError("Business id required", 400);
  const { data, error } = await client.from("business_billing")
    .select("status,stripe_subscription_id,trial_end")
    .eq("business_id", businessId).maybeSingle();
  if (error) throw error;
  if (!data?.stripe_subscription_id || !["active", "trialing"].includes(data.status)) {
    throw new AppError("Este negocio no tiene una suscripción activa", 403);
  }
  // Trial end is advisory: Stripe webhook is the source of truth for transitions.
  // If trial_end has passed and status has not transitioned, fail closed.
  if (data.status === "trialing" && (!data.trial_end || Date.parse(data.trial_end) <= Date.now())) {
    throw new AppError("La prueba gratuita ha finalizado", 403);
  }
  return data;
}
