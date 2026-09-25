import { createBookingSchema } from "./createBookingSchema.js";
import { z } from "zod";

export const adminCreateBookingSchema = createBookingSchema.extend({
  customerEmail: z.union([z.email(), z.literal(""), z.null()]).optional(),
});
export const adminUpdateBookingSchema = z.object({
  serviceId: z.uuid(),
  employeeId: z.uuid().nullable().optional(),
  date: z.iso.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().max(50).nullable().optional(),
  customerEmail: z.union([z.email(), z.literal(""), z.null()]).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});
