import { Router } from "express";

import { BusinessHoursController } from "./BusinessHoursController.js";

import { SupabaseBusinessHoursRepository } from "../infrastructure/SupabaseBusinessHoursRepository.js";
import { SupabaseBusinessRepository } from "../infrastructure/SupabaseBusinessRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const businessHoursRepository = new SupabaseBusinessHoursRepository(req.supabase);

  const businessRepository = new SupabaseBusinessRepository(req.supabase);

  return new BusinessHoursController({
    businessHoursRepository,
    businessRepository,
  });
}

router.get("/businesses/:businessId/hours", authMiddleware, (req, res, next) =>
  createController(req).getByBusinessId(req, res, next),
);

router.put("/businesses/:businessId/hours", authMiddleware, (req, res, next) =>
  createController(req).update(req, res, next),
);

export default router;
