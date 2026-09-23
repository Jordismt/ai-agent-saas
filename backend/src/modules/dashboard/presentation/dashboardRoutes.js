import { Router } from "express";

import { DashboardController } from "./DashboardController.js";

import { SupabaseDashboardRepository } from "../infrastructure/SupabaseDashboardRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const dashboardRepository = new SupabaseDashboardRepository(req.supabase);

  return new DashboardController({
    dashboardRepository,
  });
}

router.get("/dashboard/summary", authMiddleware, (req, res, next) =>
  createController(req).getSummary(req, res, next),
);

export default router;
