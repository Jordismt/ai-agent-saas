import { z } from "zod";

export const updateEmployeeServicesSchema = z.object({
  serviceIds: z
    .array(z.string().uuid())
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, "Service IDs cannot be duplicated"),
});
