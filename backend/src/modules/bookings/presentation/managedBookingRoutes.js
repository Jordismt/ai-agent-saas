import express from "express";

import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

import { SupabaseBookingRepository } from "../infrastructure/SupabaseBookingRepository.js";
import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";
import { SupabaseBusinessServiceRepository } from "../../businesses/infrastructure/SupabaseBusinessServiceRepository.js";
import { SupabaseBusinessHoursRepository } from "../../businesses/infrastructure/SupabaseBusinessHoursRepository.js";
import { SupabaseEmployeeRepository } from "../../employees/infrastructure/SupabaseEmployeeRepository.js";

import { ResendEmailService } from "../../notifications/infrastructure/ResendEmailService.js";
import { SendBookingRescheduled } from "../../notifications/application/SendBookingRescheduled.js";
import { SendBookingCancellation } from "../../notifications/application/SendBookingCancellation.js";

import { GetAvailableSlots } from "../application/GetAvailableSlots.js";
import { GetManagedBooking } from "../application/GetManagedBooking.js";
import { GetManagedBookingAvailability } from "../application/GetManagedBookingAvailability.js";
import { CancelManagedBooking } from "../application/CancelManagedBooking.js";
import { RescheduleManagedBooking } from "../application/RescheduleManagedBooking.js";

import { ManagedBookingController } from "./ManagedBookingController.js";

const router = express.Router();

function createController() {
  const supabase = createSupabaseServerClient();

  const bookingRepository = new SupabaseBookingRepository(supabase);
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);
  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);
  const employeeRepository = new SupabaseEmployeeRepository(supabase);

  const emailService = new ResendEmailService();

  const sendBookingRescheduled = new SendBookingRescheduled(emailService);
  const sendBookingCancellation = new SendBookingCancellation(emailService);

  const getAvailableSlots = new GetAvailableSlots({
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    bookingRepository,
    employeeRepository,
  });

  // GetManagedBooking recibe directamente el repository.
  const getManagedBooking = new GetManagedBooking(bookingRepository);

  const getManagedBookingAvailability = new GetManagedBookingAvailability({
    getManagedBooking,
    getAvailableSlots,
  });

  const cancelManagedBooking = new CancelManagedBooking({
    getManagedBooking,
    bookingRepository,
    businessRepository,
    sendBookingCancellation,
  });

  const rescheduleManagedBooking = new RescheduleManagedBooking({
    getManagedBooking,
    getAvailableSlots,
    bookingRepository,
    businessRepository,
    sendBookingRescheduled,
  });

  return new ManagedBookingController({
    getManagedBooking,
    getManagedBookingAvailability,
    cancelManagedBooking,
    rescheduleManagedBooking,
  });
}

router.get("/public/bookings/manage/:token", (req, res, next) => createController().get(req, res, next));

router.get("/public/bookings/manage/:token/availability", (req, res, next) =>
  createController().getAvailability(req, res, next),
);

router.patch("/public/bookings/manage/:token/cancel", (req, res, next) =>
  createController().cancel(req, res, next),
);

router.patch("/public/bookings/manage/:token/reschedule", (req, res, next) =>
  createController().reschedule(req, res, next),
);

export default router;
