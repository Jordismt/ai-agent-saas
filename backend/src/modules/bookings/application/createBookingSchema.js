import { z } from "zod";

export const createBookingSchema = z.object({
  businessId: z.string().uuid(),

  serviceId: z.string().uuid(),

  employeeId: z.string().uuid().nullable().optional(),

  conversationId: z.string().uuid().nullable().optional(),

  leadId: z.string().uuid().nullable().optional(),

  customerName: z.string().trim().min(1, "Customer name is required").max(120),

  customerPhone: z.string().trim().max(50).nullable().optional(),

  customerEmail: z
    .string()
    .trim()
    .min(1, "Customer email is required")
    .email("Customer email must be valid")
    .max(254),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),

  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format"),

  notes: z.string().trim().max(1000).nullable().optional(),
});
