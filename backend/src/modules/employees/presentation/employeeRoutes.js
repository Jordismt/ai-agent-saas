import { Router } from "express";

import { EmployeeController } from "./EmployeeController.js";
import { SupabaseEmployeeRepository } from "../infrastructure/SupabaseEmployeeRepository.js";

import { createEmployeeSchema } from "./schemas/createEmployeeSchema.js";
import { updateEmployeeSchema } from "./schemas/updateEmployeeSchema.js";

import { updateEmployeeServicesSchema } from "./schemas/updateEmployeeServicesSchema.js";
import { updateEmployeeHoursSchema } from "./schemas/updateEmployeeHoursSchema.js";

import { createEmployeeTimeOffSchema } from "./schemas/createEmployeeTimeOffSchema.js";
import { updateEmployeeTimeOffSchema } from "./schemas/updateEmployeeTimeOffSchema.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";
import { AppError } from "../../../shared/errors/AppError.js";

const router = Router();

function createController(req) {
  const employeeRepository = new SupabaseEmployeeRepository(req.supabase);

  return new EmployeeController({
    employeeRepository,
  });
}

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new AppError(result.error.issues.map((issue) => issue.message).join(", "), 400));
    }

    req.body = result.data;

    next();
  };
}

router.get("/businesses/:businessId/employees", authMiddleware, (req, res, next) =>
  createController(req).getByBusinessId(req, res, next),
);

router.post(
  "/businesses/:businessId/employees",
  authMiddleware,
  validate(createEmployeeSchema),
  (req, res, next) => createController(req).create(req, res, next),
);

router.get("/employees/:employeeId", authMiddleware, (req, res, next) =>
  createController(req).getById(req, res, next),
);

router.patch("/employees/:employeeId", authMiddleware, validate(updateEmployeeSchema), (req, res, next) =>
  createController(req).update(req, res, next),
);

router.patch("/employees/:employeeId/deactivate", authMiddleware, (req, res, next) =>
  createController(req).deactivate(req, res, next),
);

router.get("/employees/:employeeId/services", authMiddleware, (req, res, next) =>
  createController(req).getServices(req, res, next),
);

router.put(
  "/employees/:employeeId/services",
  authMiddleware,
  validate(updateEmployeeServicesSchema),
  (req, res, next) => createController(req).updateServices(req, res, next),
);

router.get("/employees/:employeeId/hours", authMiddleware, (req, res, next) =>
  createController(req).getHours(req, res, next),
);

router.put(
  "/employees/:employeeId/hours",
  authMiddleware,
  validate(updateEmployeeHoursSchema),
  (req, res, next) => createController(req).updateHours(req, res, next),
);

router.get("/employees/:employeeId/time-off", authMiddleware, (req, res, next) =>
  createController(req).getTimeOff(req, res, next),
);

router.post(
  "/employees/:employeeId/time-off",
  authMiddleware,
  validate(createEmployeeTimeOffSchema),
  (req, res, next) => createController(req).createTimeOff(req, res, next),
);

router.put(
  "/employees/:employeeId/time-off/:timeOffId",
  authMiddleware,
  validate(updateEmployeeTimeOffSchema),
  (req, res, next) => createController(req).updateTimeOff(req, res, next),
);

router.delete("/employees/:employeeId/time-off/:timeOffId", authMiddleware, (req, res, next) =>
  createController(req).deleteTimeOff(req, res, next),
);

export default router;
