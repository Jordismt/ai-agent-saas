import { z } from "zod";

export const updateLeadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
});
