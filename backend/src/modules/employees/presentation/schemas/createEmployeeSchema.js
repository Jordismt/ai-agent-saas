import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required").max(100),

  email: z.string().trim().email().max(255).nullable().optional(),

  phone: z.string().trim().max(30).nullable().optional(),
});
