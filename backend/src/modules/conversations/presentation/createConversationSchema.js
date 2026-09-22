import { z } from "zod";

export const createConversationSchema = z.object({
  businessId: z.string().uuid("El business ID no es válido."),

  channel: z.enum(["web", "whatsapp"]).default("web"),

  visitorId: z.string().uuid("El visitor ID no es válido."),
});
