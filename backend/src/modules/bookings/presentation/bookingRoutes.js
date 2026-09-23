import { Router } from "express";

import { BookingController } from "./BookingController.js";

import { SupabaseBookingRepository } from "../infrastructure/SupabaseBookingRepository.js";

import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";

import { SupabaseBusinessServiceRepository } from "../../businesses/infrastructure/SupabaseBusinessServiceRepository.js";

import { SupabaseBusinessHoursRepository } from "../../businesses/infrastructure/SupabaseBusinessHoursRepository.js";

import { SupabaseConversationRepository } from "../../conversations/infrastructure/SupabaseConversationRepository.js";

import { SupabaseLeadRepository } from "../../leads/infrastructure/SupabaseLeadRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const bookingRepository = new SupabaseBookingRepository(req.supabase);

  const businessRepository = new SupabaseBusinessRepository(req.supabase);

  const businessServiceRepository = new SupabaseBusinessServiceRepository(req.supabase);

  const businessHoursRepository = new SupabaseBusinessHoursRepository(req.supabase);

  const conversationRepository = new SupabaseConversationRepository(req.supabase);

  const leadRepository = new SupabaseLeadRepository(req.supabase);

  return new BookingController({
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    conversationRepository,
    leadRepository,
  });
}

router.post("/businesses/:businessId/bookings", authMiddleware, (req, res, next) =>
  createController(req).create(req, res, next),
);

router.get("/businesses/:businessId/bookings/availability", authMiddleware, (req, res, next) =>
  createController(req).getAvailability(req, res, next),
);

router.get("/businesses/:businessId/bookings", authMiddleware, (req, res, next) =>
  createController(req).getByBusinessId(req, res, next),
);

router.patch("/bookings/:id/status", authMiddleware, (req, res, next) =>
  createController(req).updateStatus(req, res, next),
);

export default router;
