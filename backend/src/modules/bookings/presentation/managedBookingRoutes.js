import express from "express";

import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

import { SupabaseBookingRepository } from "../infrastructure/SupabaseBookingRepository.js";

import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";

import { ResendEmailService } from "../../notifications/infrastructure/ResendEmailService.js";

import { SendBookingReminder } from "../../notifications/application/SendBookingReminder.js";

import { SendUpcomingBookingReminders } from "../application/SendUpcomingBookingReminders.js";

const router = express.Router();

function createReminderService() {
  /*
   * IMPORTANTE:
   * Este proceso necesita consultar reservas de todos los negocios.
   * Por eso utilizamos el cliente server-side y no el cliente
   * normal sujeto a las políticas RLS del usuario.
   */
  const supabase = createSupabaseServerClient();

  const bookingRepository = new SupabaseBookingRepository(supabase);

  const businessRepository = new SupabaseBusinessRepository(supabase);

  const emailService = new ResendEmailService();

  const sendBookingReminder = new SendBookingReminder(emailService);

  return new SendUpcomingBookingReminders({
    bookingRepository,
    businessRepository,
    sendBookingReminder,
  });
}

router.post("/internal/booking-reminders", async (req, res, next) => {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[BookingReminder] CRON_SECRET is not configured");

      return res.status(500).json({
        error: "Booking reminder service is not configured",
      });
    }

    const authorization = req.headers.authorization;

    if (authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const sendUpcomingBookingReminders = createReminderService();

    const result = await sendUpcomingBookingReminders.execute();

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
