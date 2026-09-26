import express from "express";
import billingRoutes, { stripeWebhook } from "./modules/billing/presentation/billingRoutes.js";
import cors from "cors";
import helmet from "helmet";

import { supabase } from "./infrastructure/database/supabase.js";

import businessRoutes from "./modules/businesses/presentation/businessRoutes.js";
import conversationRoutes from "./modules/conversations/presentation/conversationRoutes.js";
import publicRoutes from "./modules/public/presentation/publicRoutes.js";
import businessHoursRoutes from "./modules/businesses/presentation/businessHoursRoutes.js";
import businessAgentConfigRoutes from "./modules/businesses/presentation/businessAgentConfigRoutes.js";
import leadRoutes from "./modules/leads/presentation/leadRoutes.js";
import bookingRoutes from "./modules/bookings/presentation/bookingRoutes.js";
import dashboardRoutes from "./modules/dashboard/presentation/dashboardRoutes.js";
import employeeRoutes from "./modules/employees/presentation/employeeRoutes.js";
import businessPublicPageRoutes from "./modules/publicPages/presentation/businessPublicPageRoutes.js";
import managedBookingRoutes from "./modules/bookings/presentation/managedBookingRoutes.js";
import bookingReminderRoutes from "./modules/bookings/presentation/bookingReminderRoutes.js";
import accountRoutes from "./modules/account/presentation/accountRoutes.js";

import { apiLimiter, bookingLimiter } from "./shared/middleware/rateLimits.js";
import { authMiddleware } from "./shared/middleware/authMiddleware.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.post("/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json({ limit: "32kb" }));
app.use(apiLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/health/supabase", async (req, res) => {
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }

  res.json({
    status: "ok",
    database: "connected",
  });
});

app.get("/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});
app.use("/account", accountRoutes);
app.use("/billing", billingRoutes);
app.use("/businesses", businessRoutes);
app.use("/conversations", conversationRoutes);

app.use("/", leadRoutes);
app.use("/", bookingRoutes);
app.use("/", dashboardRoutes);
app.use("/", employeeRoutes);

app.use("/public", publicRoutes);
app.use("/business-hours", businessHoursRoutes);

app.use("/", businessAgentConfigRoutes);

app.use(businessPublicPageRoutes);
app.use("/public/bookings/manage", bookingLimiter);
app.use(managedBookingRoutes);

/*
 * Internal routes.
 *
 * No authMiddleware here because authentication is performed
 * using CRON_SECRET inside bookingReminderRoutes.
 */
app.use(bookingReminderRoutes);

app.use(errorHandler);

export default app;
