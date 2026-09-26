import { Router } from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

import { billingLimiter } from "../../../shared/middleware/rateLimits.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const admin = () => createSupabaseServerClient();

const fail = (res, message, status = 500) => res.status(status).json({ error: message });

// Recuperar eliminaciones interrumpidas
// después de haber borrado la base de datos.
router.post("/deletion-recovery", async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const db = admin();

    const { data: jobs, error } = await db
      .from("account_deletion_requests")
      .select("user_id")
      .eq("status", "database_deleted")
      .limit(50);

    if (error) throw error;

    let completed = 0;

    for (const job of jobs) {
      const { error: authError } = await db.auth.admin.deleteUser(job.user_id);

      if (authError && !/not found/i.test(authError.message)) {
        console.error("Auth deletion retry failed", job.user_id, authError.message);

        continue;
      }

      const { error: updateError } = await db
        .from("account_deletion_requests")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", job.user_id);

      if (updateError) throw updateError;

      completed++;
    }

    return res.json({ completed });
  } catch (error) {
    console.error("Deletion recovery error", error);

    return res.status(503).json({
      error: "Recovery failed",
    });
  }
});

// Obtener datos de la cuenta.
router.get("/summary", authMiddleware, async (req, res, next) => {
  try {
    const db = admin();

    const { data: businesses, error } = await db
      .from("businesses")
      .select("id,name")
      .eq("owner_id", req.user.id);

    if (error) throw error;

    return res.json({
      email: req.user.email,
      businesses,
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar definitivamente la cuenta.
router.post("/delete", authMiddleware, billingLimiter, async (req, res) => {
  try {
    // 1. Confirmar contraseña.

    if (
      req.body?.confirmation !== "ELIMINAR" ||
      typeof req.body?.password !== "string" ||
      !req.body.password
    ) {
      return fail(res, "Confirma la eliminación e introduce tu contraseña.", 400);
    }

    const verifier = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({
      email: req.user.email,
      password: req.body.password,
    });

    if (verifyError || verified.user?.id !== req.user.id) {
      return fail(res, "Contraseña incorrecta. Si accedes mediante OAuth, contacta con soporte.", 403);
    }

    // 2. Recuperar o crear la solicitud.

    const db = admin();

    const { data: existing, error: readError } = await db
      .from("account_deletion_requests")
      .select("user_id,stripe_customer_id,subscription_ids,status")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (readError) throw readError;

    let job = existing;

    if (!job) {
      const { data: customer, error: customerError } = await db
        .from("billing_customers")
        .select("stripe_customer_id")
        .eq("user_id", req.user.id)
        .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      const { data: businesses, error: businessError } = await db
        .from("businesses")
        .select("id")
        .eq("owner_id", req.user.id);

      if (businessError) {
        throw businessError;
      }

      const ids = businesses.map((business) => business.id);

      let subs = [];

      if (ids.length) {
        const { data: billing, error: billingError } = await db
          .from("business_billing")
          .select("stripe_subscription_id")
          .in("business_id", ids);

        if (billingError) {
          throw billingError;
        }

        subs = billing.map((row) => row.stripe_subscription_id).filter(Boolean);
      }

      // Guardar el proceso antes de
      // realizar operaciones externas.

      const { data: inserted, error: insertError } = await db
        .from("account_deletion_requests")
        .insert({
          user_id: req.user.id,

          stripe_customer_id: customer?.stripe_customer_id || null,

          subscription_ids: [...new Set(subs)],

          status: "pending",
        })
        .select("user_id,stripe_customer_id,subscription_ids,status")
        .single();

      if (insertError) {
        throw insertError;
      }

      job = inserted;
    }

    if (job.status === "completed") {
      return res.json({ deleted: true });
    }

    // 3. Expirar sesiones de Checkout abiertas.

    const { data: owned, error: ownedError } = await db
      .from("businesses")
      .select("id")
      .eq("owner_id", req.user.id);

    if (ownedError) {
      throw ownedError;
    }

    if (owned.length) {
      const { data: billingRows, error: billingError } = await db
        .from("business_billing")
        .select("checkout_session_id")
        .in(
          "business_id",
          owned.map((business) => business.id),
        );

      if (billingError) {
        throw billingError;
      }

      for (const row of billingRows) {
        if (!row.checkout_session_id) {
          continue;
        }

        const session = await stripe.checkout.sessions.retrieve(row.checkout_session_id);

        if (session.status === "open") {
          await stripe.checkout.sessions.expire(session.id);
        }
      }
    }

    // 4. Localizar todas las suscripciones.

    const subscriptionIds = new Set(job.subscription_ids || []);

    if (job.stripe_customer_id) {
      for await (const subscription of stripe.subscriptions.list({
        customer: job.stripe_customer_id,
        status: "all",
        limit: 100,
      })) {
        subscriptionIds.add(subscription.id);
      }
    }

    // 5. Cancelar las suscripciones.

    for (const id of subscriptionIds) {
      const subscription = await stripe.subscriptions.retrieve(id);

      if (job.stripe_customer_id && subscription.customer !== job.stripe_customer_id) {
        throw new Error("Subscription/customer mismatch");
      }

      if (subscription.status !== "canceled" && subscription.status !== "incomplete_expired") {
        await stripe.subscriptions.cancel(id, { prorate: false });
      }
    }

    // 6. Eliminar los datos relacionados.

    const { error: rpcError } = await db.rpc("delete_resbix_account_data", {
      target_user_id: req.user.id,
    });

    if (rpcError) {
      throw rpcError;
    }

    const { error: statusError } = await db
      .from("account_deletion_requests")
      .update({
        status: "database_deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", req.user.id);

    if (statusError) {
      throw statusError;
    }

    // 7. Eliminar el usuario de Supabase Auth.

    const { error: authError } = await db.auth.admin.deleteUser(req.user.id);

    if (authError && !/not found/i.test(authError.message)) {
      throw authError;
    }

    // 8. Marcar el proceso como completado.

    const { error: doneError } = await db
      .from("account_deletion_requests")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", req.user.id);

    if (doneError) {
      throw doneError;
    }

    return res.json({
      deleted: true,
    });
  } catch (error) {
    console.error("Account deletion failed:", error);

    return res.status(503).json({
      error: "No se ha completado la eliminación. " + "Contacta con soporte si el problema persiste.",
    });
  }
});

export default router;
