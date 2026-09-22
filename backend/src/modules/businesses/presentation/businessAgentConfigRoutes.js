import { Router } from "express";

import { BusinessAgentConfigController } from "./BusinessAgentConfigController.js";

import { SupabaseBusinessAgentConfigRepository } from "../infrastructure/SupabaseBusinessAgentConfigRepository.js";
import { SupabaseBusinessRepository } from "../infrastructure/SupabaseBusinessRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const businessAgentConfigRepository = new SupabaseBusinessAgentConfigRepository(req.supabase);

  const businessRepository = new SupabaseBusinessRepository(req.supabase);

  return new BusinessAgentConfigController({
    businessAgentConfigRepository,
    businessRepository,
  });
}

router.get("/businesses/:businessId/agent-config", authMiddleware, (req, res, next) =>
  createController(req).getByBusinessId(req, res, next),
);

router.put("/businesses/:businessId/agent-config", authMiddleware, (req, res, next) =>
  createController(req).update(req, res, next),
);

export default router;
