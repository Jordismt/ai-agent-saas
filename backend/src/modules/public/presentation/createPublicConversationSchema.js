import { z } from "zod";

export const createPublicConversationSchema = z.object({
  businessId: z.string().uuid("El business ID no es válido."),

  visitorId: z.string().uuid("El visitor ID no es válido."),
});
