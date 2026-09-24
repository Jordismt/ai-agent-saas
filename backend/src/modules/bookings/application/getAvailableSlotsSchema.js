import { z } from "zod";

export const getAvailableSlotsSchema = z.object({
  businessId: z.string().uuid(),

  serviceId: z.string().uuid(),

  employeeId: z.string().uuid().nullable().optional(),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
});
