import Stripe from "stripe";
import { AppError } from "../errors/AppError.js";
import { subscriptionFields } from "./subscriptionPolicy.js";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
);

export async function readBusinessBilling(admin, businessId) {
  const { data, error } = await admin
    .from("business_billing")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Read the local version BEFORE Stripe, then compare-and-set to protect concurrent deliveries.
// Retrieve even for delayed/deleted events: event snapshots are not the current state.
export async function reconcileBusinessBilling(
  admin,
  businessId,
  { subscriptionId, checkoutId, event, failedAt } = {},
) {
  const existing = await readBusinessBilling(admin, businessId);
  const id = subscriptionId || existing?.stripe_subscription_id;
  if (!id) return existing;
  if (
    existing?.stripe_subscription_id &&
    existing.stripe_subscription_id !== id
  ) {
    console.info("billing.sync.skipped", {
      eventId: event?.id,
      subscriptionId: id,
      reason: "different_subscription",
    });
    return existing;
  }
  const { data: business, error: businessError } = await admin
    .from("businesses")
    .select("id,owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (businessError) throw businessError;
  if (!business) return null;
  const { data: deleting, error: deletingError } = await admin
    .from("account_deletion_requests")
    .select("user_id")
    .eq("user_id", business.owner_id)
    .maybeSingle();
  if (deletingError) throw deletingError;
  if (deleting) return null;

  try {
    const sub = await stripe.subscriptions.retrieve(id, {
      expand: ["discounts"],
    });
    const { data: customer, error: customerError } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", business.owner_id)
      .maybeSingle();
    if (customerError) throw customerError;
    if (
      sub.id !== id ||
      sub.metadata?.business_id !== businessId ||
      sub.metadata?.owner_id !== business.owner_id ||
      !customer?.stripe_customer_id ||
      customer.stripe_customer_id !==
        (typeof sub.customer === "string" ? sub.customer : sub.customer?.id)
    ) {
      throw new AppError("Suscripción no corresponde al negocio", 409);
    }
    const founderCoupon = process.env.STRIPE_FOUNDER_COUPON_ID;
    const payload = {
      business_id: businessId,
      ...subscriptionFields(sub),
      trial_used: true,
      founder: (sub.discounts || []).some(
        (d) =>
          (typeof d.coupon === "object" ? d.coupon?.id : d.coupon) ===
          founderCoupon,
      ),
      // Ensure two writes in the same millisecond still have distinct CAS versions.
      updated_at: new Date(
        Math.max(Date.now(), (Date.parse(existing?.updated_at) || 0) + 1),
      ).toISOString(),
    };
    if (checkoutId) payload.checkout_session_id = checkoutId;
    if (
      failedAt &&
      (!existing?.last_payment_failed_at ||
        Date.parse(failedAt) > Date.parse(existing.last_payment_failed_at))
    ) {
      payload.last_payment_failed_at = failedAt;
    }
    let query;
    if (existing) {
      query = admin
        .from("business_billing")
        .update(payload)
        .eq("business_id", businessId);
      query = existing.stripe_subscription_id
        ? query.eq("stripe_subscription_id", existing.stripe_subscription_id)
        : query.is("stripe_subscription_id", null);
      query = existing.updated_at
        ? query.eq("updated_at", existing.updated_at)
        : query.is("updated_at", null);
    } else {
      query = admin
        .from("business_billing")
        .upsert(payload, { onConflict: "business_id", ignoreDuplicates: true });
    }
    const { data: saved, error } = await query.select("*").maybeSingle();
    if (error) throw error;
    // A competing writer won. Fail the delivery so Stripe retries with a new live snapshot.
    if (!saved)
      throw new AppError(
        "Sincronización de suscripción concurrente; reintenta",
        503,
      );
    console.info("billing.sync.completed", {
      eventId: event?.id,
      subscriptionId: id,
      previousStatus: existing?.status,
      status: saved.status,
    });
    return {
      ...saved,
      cancel_at_period_end: sub.cancel_at_period_end,
      cancel_at: sub.cancel_at
        ? new Date(sub.cancel_at * 1000).toISOString()
        : null,
    };
  } catch (error) {
    console.error("billing.sync.failed", {
      eventId: event?.id,
      subscriptionId: id,
      code: error.code || error.statusCode || "sync_error",
    });
    throw error;
  }
}
