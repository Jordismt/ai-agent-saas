import { Router } from "express";

import { LeadController } from "./LeadController.js";
import { SupabaseLeadRepository } from "../infrastructure/SupabaseLeadRepository.js";
import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";
import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

const router = Router();

function createController(req) {
  const leadRepository = new SupabaseLeadRepository(req.supabase);

  return new LeadController({
    leadRepository,
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
