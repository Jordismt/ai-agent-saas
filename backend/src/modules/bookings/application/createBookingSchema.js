import { z } from "zod";

export const createBookingSchema = z
  .object({
    businessId: z.string().uuid(),

    serviceId: z.string().uuid(),

    conversationId: z.string().uuid().nullable().optional(),

    leadId: z.string().uuid().nullable().optional(),

    customerName: z.string().trim().min(1).max(120),

    customerPhone: z.string().trim().max(50).nullable().optional(),

    customerEmail: z.string().trim().email().max(254).nullable().optional(),

    startsAt: z.string().datetime({ offset: true }),

    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (data) => {
      const phone = data.customerPhone?.trim();

      const email = data.customerEmail?.trim();

      return Boolean(phone || email);
    },
    {
      message: "A booking requires at least a phone or email",
      path: ["customerPhone"],
    },
  );
