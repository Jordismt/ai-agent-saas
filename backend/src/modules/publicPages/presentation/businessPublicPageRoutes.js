import { Router } from "express";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";

import { SupabaseBusinessServiceRepository } from "../../businesses/infrastructure/SupabaseBusinessServiceRepository.js";

import { SupabaseBusinessHoursRepository } from "../../businesses/infrastructure/SupabaseBusinessHoursRepository.js";

import { SupabaseEmployeeRepository } from "../../employees/infrastructure/SupabaseEmployeeRepository.js";

import { SupabaseBusinessPublicPageRepository } from "../infrastructure/SupabaseBusinessPublicPageRepository.js";

import { BusinessPublicPageController } from "./BusinessPublicPageController.js";

const router = Router();

function createAuthenticatedController(req) {
  const supabase = req.supabase;

  const businessRepository = new SupabaseBusinessRepository(supabase);

  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);

  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);

  const employeeRepository = new SupabaseEmployeeRepository(supabase);

  const publicPageRepository = new SupabaseBusinessPublicPageRepository(supabase);

  return new BusinessPublicPageController({
    businessRepository,
    publicPageRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  });
}

function createPublicController() {
  const supabase = createSupabaseServerClient();

  const businessRepository = new SupabaseBusinessRepository(supabase);

  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);

  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);

  const employeeRepository = new SupabaseEmployeeRepository(supabase);

  const publicPageRepository = new SupabaseBusinessPublicPageRepository(supabase);

  return new BusinessPublicPageController({
    businessRepository,
    publicPageRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  });
}

/*
 * DASHBOARD
 *
 * GET /businesses/:businessId/public-page
 */

router.get("/businesses/:businessId/public-page", authMiddleware, (req, res, next) =>
  createAuthenticatedController(req).getByBusinessId(req, res, next),
);

/*
 * DASHBOARD
 *
 * PUT /businesses/:businessId/public-page
 */

router.put("/businesses/:businessId/public-page", authMiddleware, (req, res, next) =>
  createAuthenticatedController(req).upsert(req, res, next),
);

/*
 * PUBLIC
 *
 * GET /public/pages/:slug
 */

router.get("/public/pages/:slug", (req, res, next) => createPublicController().getPublished(req, res, next));

export default router;
