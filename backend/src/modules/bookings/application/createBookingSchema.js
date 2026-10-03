import { z } from "zod";

export const createBookingSchema = z.object({
  businessId: z.string().uuid(),

  serviceId: z.string().uuid(),

  employeeId: z.string().uuid().nullable().optional(),

  conversationId: z.string().uuid().nullable().optional(),

  leadId: z.string().uuid().nullable().optional(),

  customerName: z.string().trim().min(1, "Customer name is required").max(120),

  customerPhone: z.string().trim().min(1, "Customer phone is required").max(50),

  customerEmail: z.preprocess(
    (value) => typeof value === "string" && !value.trim() ? null : value,
    z.string().trim().email("Customer email must be valid").max(254).nullable().optional(),
  ),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),

  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format"),

  notes: z.string().trim().max(1000).nullable().optional(),
});
