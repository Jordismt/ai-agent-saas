import { z } from "zod";

export const updateConversationStatusSchema = z.object({
  status: z.enum(["active", "closed", "human"]),
});
