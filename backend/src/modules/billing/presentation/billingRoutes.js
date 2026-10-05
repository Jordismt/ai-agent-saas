import { billingLimiter } from "../../../shared/middleware/rateLimits.js";
import { Router } from "express";
import { stripe, reconcileBusinessBilling } from "../../../shared/billing/subscriptionSync.js";
import { hasSubscriptionAccess, stripeInstant } from "../../../shared/billing/subscriptionPolicy.js";
import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";
import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

const router = Router();
const db = () => createSupabaseServerClient();
const frontend = () => {
  if (!process.env.FRONTEND_URL) throw new Error("Missing FRONTEND_URL");
  return process.env.FRONTEND_URL.replace(/\/$/, "");
};
const price = () => {
  if (!process.env.STRIPE_PRICE_ID) throw new Error("Missing STRIPE_PRICE_ID");
  return process.env.STRIPE_PRICE_ID;
};
const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (e) {
    next(e);
  }
};
const validId = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);

async function ownedBusiness(admin, userId, businessId) {
  if (!validId(businessId)) return null;
  const { data, error } = await admin
    .from("businesses")
    .select("id,owner_id")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Every endpoint scopes billing to an owned business, not just the logged-in user.
router.get(
  "/status",
  authMiddleware,
  handle(async (req, res) => {
    const admin = db();
    if (!(await ownedBusiness(admin, req.user.id, req.query.businessId)))
      return res.status(404).json({ error: "Negocio no encontrado" });
    const billing = await reconcileBusinessBilling(admin, req.query.businessId);
    res.json({
      billing: billing
        ? {
            business_id: billing.business_id,
            stripe_subscription_id: billing.stripe_subscription_id,
            status: billing.status,
            trial_end: billing.trial_end,
            current_period_end: billing.current_period_end,
            founder: billing.founder,
            last_payment_failed_at: billing.last_payment_failed_at,
            cancel_at_period_end: billing.cancel_at_period_end,
            cancel_at: billing.cancel_at,
            has_access: hasSubscriptionAccess(billing),
          }
        : null,
    });
  }),
);

router.post(
  "/checkout",
  authMiddleware,
  billingLimiter,
  handle(async (req, res) => {
    const admin = db(),
      businessId = req.body?.businessId;
    if (!(await ownedBusiness(admin, req.user.id, businessId)))
      return res.status(404).json({ error: "Negocio no encontrado" });
    const { data: row, error } = await admin
      .from("business_billing")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) throw error;
    if (row?.stripe_subscription_id || row?.trial_used)
      return res.status(409).json({ error: "Este negocio ya tiene suscripción o ha usado su prueba" });
    if (row?.checkout_session_id) {
      const prior = await stripe.checkout.sessions.retrieve(row.checkout_session_id);
      if (prior.status === "open" && prior.url) return res.json({ url: prior.url });
    }
    // One Stripe customer per owner, multiple independent subscriptions by business.
    const { data: owner, error: ownerError } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (ownerError) throw ownerError;
    let customerId = owner?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create(
        { email: req.user.email, metadata: { supabase_user_id: req.user.id } },
        { idempotencyKey: `resbix-owner-${req.user.id}` },
      );
      customerId = customer.id;
      const { error: customerError } = await admin
        .from("billing_customers")
        .upsert({ user_id: req.user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
      if (customerError) throw customerError;
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: businessId,
        line_items: [{ price: price(), quantity: 1 }],
        payment_method_collection: "always",
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 7,
          trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
          metadata: { business_id: businessId, owner_id: req.user.id },
        },
        success_url: `${frontend()}/businesses/${encodeURIComponent(businessId)}/billing?checkout=success`,
        cancel_url: `${frontend()}/businesses/${encodeURIComponent(businessId)}/billing?checkout=cancel`,
        metadata: { business_id: businessId, owner_id: req.user.id },
      },
      { idempotencyKey: `resbix-checkout-${businessId}-${row?.checkout_session_id || "first"}` },
    );
    // A subscription webhook may have won while Checkout was being created/retried.
    // Never overwrite its state with the pending placeholder.
    const pending = {
      business_id: businessId,
      checkout_session_id: session.id,
      status: "checkout_pending",
      updated_at: new Date().toISOString(),
    };
    let save;
    if (row) {
      save = admin
        .from("business_billing")
        .update(pending)
        .eq("business_id", businessId)
        .is("stripe_subscription_id", null);
      save = row.updated_at
        ? save.eq("updated_at", row.updated_at)
        : save.is("updated_at", null);
    } else {
      save = admin
        .from("business_billing")
        .upsert(pending, { onConflict: "business_id", ignoreDuplicates: true });
    }
    const { data: saved, error: saveError } = await save
      .select("business_id")
      .maybeSingle();
    if (saveError) throw saveError;
    if (!saved)
      return res
        .status(409)
        .json({
          error: "La suscripción ha cambiado; vuelve a comprobar su estado",
        });
    res.json({ url: session.url });
  }),
);

// Only the business owner can cancel/reactivate this specific subscription.
router.post(
  "/renewal",
  authMiddleware,
  handle(async (req, res) => {
    const admin = db(),
      businessId = req.body?.businessId,
      cancel = req.body?.cancel;
    if (typeof cancel !== "boolean") return res.status(400).json({ error: "cancel debe ser booleano" });
    if (!(await ownedBusiness(admin, req.user.id, businessId)))
      return res.status(404).json({ error: "Negocio no encontrado" });
    const { data, error } = await admin
      .from("business_billing")
      .select("stripe_subscription_id")
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.stripe_subscription_id) return res.status(404).json({ error: "No existe una suscripción" });
    const sub = await stripe.subscriptions.retrieve(data.stripe_subscription_id);
    if (sub.metadata?.business_id !== businessId)
      return res.status(409).json({ error: "Suscripción no corresponde al negocio" });
    if (!["trialing", "active", "past_due"].includes(sub.status))
      return res.status(409).json({ error: "La suscripción no admite este cambio" });
    // Never reactivate subscriptions already scheduled to end for other reasons.
    if (!cancel && !sub.cancel_at_period_end)
      return res.status(409).json({ error: "Esta suscripción no tiene cancelación pendiente" });
    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: cancel });
    res.json({ cancel_at_period_end: updated.cancel_at_period_end });
  }),
);

router.post(
  "/portal",
  authMiddleware,
  handle(async (req, res) => {
    const admin = db(),
      businessId = req.body?.businessId;
    if (!(await ownedBusiness(admin, req.user.id, businessId)))
      return res.status(404).json({ error: "Negocio no encontrado" });
    const { data, error } = await admin
      .from("business_billing")
      .select("stripe_subscription_id")
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.stripe_subscription_id)
      return res.status(404).json({ error: "Este negocio no tiene suscripción" });
    const { data: customer, error: customerError } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", req.user.id)
      .single();
    if (customerError) throw customerError;
    // Stripe portal is customer-wide: an owner can see all subscriptions for their businesses.
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${frontend()}/dashboard`,
    });
    res.json({ url: session.url });
  }),
);

// Mount before express.json() so Stripe verifies the unmodified body.
export const stripeWebhook = handle(async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return res.status(500).json({ error: "Missing webhook secret" });
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return res.status(400).send("Invalid Stripe signature");
  }
  const admin = db();
  console.info("billing.webhook.received", {
    eventId: event.id,
    type: event.type,
  });
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const businessId = session.metadata?.business_id;
      if (
        businessId &&
        session.mode === "subscription" &&
        session.subscription
      ) {
        await reconcileBusinessBilling(admin, businessId, {
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          checkoutId: session.id,
          event,
        });
      }
    }
    if (
      [
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ].includes(event.type)
    ) {
      const incoming = event.data.object;
      if (incoming.metadata?.business_id) {
        await reconcileBusinessBilling(admin, incoming.metadata.business_id, {
          subscriptionId: incoming.id,
          event,
        });
      }
    }
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscription =
        invoice.parent?.subscription_details?.subscription ??
        invoice.subscription;
      const subscriptionId =
        typeof subscription === "string" ? subscription : subscription?.id;
      if (subscriptionId) {
        const { data, error } = await admin
          .from("business_billing")
          .select("business_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        if (error) throw error;
        if (data)
          await reconcileBusinessBilling(admin, data.business_id, {
            subscriptionId,
            event,
            failedAt: stripeInstant(event.created),
          });
      }
    }
    console.info("billing.webhook.processed", {
      eventId: event.id,
      type: event.type,
    });
    res.json({ received: true });
  } catch (error) {
    console.error("billing.webhook.failed", {
      eventId: event.id,
      type: event.type,
      code: error.code || error.statusCode || "processing_error",
    });
    throw error;
  }
});
export default router;
