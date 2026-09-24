import { z } from "zod";

const timeOffTypeSchema = z.enum(["vacation", "sick", "personal", "other"]);

export const createEmployeeTimeOffSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }),

    endsAt: z.string().datetime({ offset: true }),

    type: timeOffTypeSchema.default("other"),

    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => new Date(data.startsAt) < new Date(data.endsAt), {
    message: "startsAt must be before endsAt",
    path: ["endsAt"],
  });
