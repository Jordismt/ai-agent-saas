import { z } from "zod";

export const updateEmployeeSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),

    email: z.string().trim().email().max(255).nullable().optional(),

    phone: z.string().trim().max(30).nullable().optional(),

    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
