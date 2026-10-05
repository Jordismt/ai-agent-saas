import { createSupabaseServerClient } from "../../infrastructure/database/supabase.js";
import { AppError } from "../errors/AppError.js";
import {
  hasSubscriptionAccess,
  needsSubscriptionRefresh,
} from "./subscriptionPolicy.js";
import {
  readBusinessBilling,
  reconcileBusinessBilling,
} from "./subscriptionSync.js";

// Webhooks maintain the local snapshot; expired/invalid snapshots are verified with Stripe.
export async function requireActiveBusiness(
  businessId,
  client = createSupabaseServerClient(),
) {
  if (!businessId) throw new AppError("Business id required", 400);
  let data = await readBusinessBilling(client, businessId);
  if (needsSubscriptionRefresh(data))
    data = await reconcileBusinessBilling(client, businessId);
  if (!hasSubscriptionAccess(data)) {
    throw new AppError("Este negocio no tiene una suscripción activa", 403);
  }
  return data;
}
