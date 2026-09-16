import { Router } from "express";

import { BusinessController } from "./BusinessController.js";

import { SupabaseBusinessRepository } from "../infrastructure/SupabaseBusinessRepository.js";
import { SupabaseBusinessServiceRepository } from "../infrastructure/SupabaseBusinessServiceRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

const businessRepository = new SupabaseBusinessRepository();

const businessServiceRepository = new SupabaseBusinessServiceRepository();

const businessController = new BusinessController({
  businessRepository,
  businessServiceRepository,
});

router.post("/", authMiddleware, businessController.create.bind(businessController));

router.get("/", authMiddleware, businessController.getAll.bind(businessController));

router.post("/:id/services", authMiddleware, businessController.createService.bind(businessController));

router.get("/:id/services", authMiddleware, businessController.getServices.bind(businessController));

router.get("/:id", authMiddleware, businessController.getById.bind(businessController));

router.delete(
  "/:id/services/:serviceId",
  authMiddleware,
  businessController.deleteService.bind(businessController),
);

router.put(
  "/:id/services/:serviceId",
  authMiddleware,
  businessController.updateService.bind(businessController),
);

export default router;
