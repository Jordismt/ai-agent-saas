import { z } from "zod";

import { LEAD_STATUSES } from "../domain/Lead.js";

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    LEAD_STATUSES.NEW,
    LEAD_STATUSES.CONTACTED,
    LEAD_STATUSES.QUALIFIED,
    LEAD_STATUSES.WON,
    LEAD_STATUSES.LOST,
  ]),
});
