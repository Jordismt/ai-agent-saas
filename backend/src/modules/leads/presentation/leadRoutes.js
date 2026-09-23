import { Router } from "express";

import { LeadController } from "./LeadController.js";

import { SupabaseLeadRepository } from "../infrastructure/SupabaseLeadRepository.js";

import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const leadRepository = new SupabaseLeadRepository(req.supabase);

  const businessRepository = new SupabaseBusinessRepository(req.supabase);

  return new LeadController({
    leadRepository,
    businessRepository,
  });
}

router.post("/businesses/:businessId/leads", authMiddleware, (req, res, next) =>
  createController(req).create(req, res, next),
);

router.get("/businesses/:businessId/leads", authMiddleware, (req, res, next) =>
  createController(req).getByBusinessId(req, res, next),
);

router.patch("/leads/:id/status", authMiddleware, (req, res, next) =>
  createController(req).updateStatus(req, res, next),
);

export default router;
