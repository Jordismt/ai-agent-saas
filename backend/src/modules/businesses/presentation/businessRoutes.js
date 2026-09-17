import { Router } from "express";

import { BusinessController } from "./BusinessController.js";

import { SupabaseBusinessRepository } from "../infrastructure/SupabaseBusinessRepository.js";

import { SupabaseBusinessServiceRepository } from "../infrastructure/SupabaseBusinessServiceRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const businessRepository = new SupabaseBusinessRepository(req.supabase);

  const businessServiceRepository = new SupabaseBusinessServiceRepository(req.supabase);

  return new BusinessController({
    businessRepository,
    businessServiceRepository,
  });
}

router.post("/", authMiddleware, (req, res, next) => createController(req).create(req, res, next));

router.get("/", authMiddleware, (req, res, next) => createController(req).getAll(req, res, next));

router.post("/:id/services", authMiddleware, (req, res, next) =>
  createController(req).createService(req, res, next),
);

router.get("/:id/services", authMiddleware, (req, res, next) =>
  createController(req).getServices(req, res, next),
);

router.delete("/:id/services/:serviceId", authMiddleware, (req, res, next) =>
  createController(req).deleteService(req, res, next),
);

router.put("/:id/services/:serviceId", authMiddleware, (req, res, next) =>
  createController(req).updateService(req, res, next),
);

router.get("/:id", authMiddleware, (req, res, next) => createController(req).getById(req, res, next));

export default router;
