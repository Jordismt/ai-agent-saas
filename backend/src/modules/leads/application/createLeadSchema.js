import { z } from "zod";

export const createLeadSchema = z
  .object({
    businessId: z.string().uuid(),

    conversationId: z.string().uuid().nullable().optional(),

    name: z.string().trim().max(100).nullable().optional(),

    phone: z.string().trim().max(30).nullable().optional(),

    email: z.string().trim().email().max(255).nullable().optional(),

    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (data) => {
      const phone = data.phone?.trim();
      const email = data.email?.trim();

      return Boolean(phone || email);
    },
    {
      message: "A lead requires at least a phone or email",
      path: ["phone"],
    },
  );
