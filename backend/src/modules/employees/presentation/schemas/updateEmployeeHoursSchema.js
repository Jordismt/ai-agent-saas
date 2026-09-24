import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format. Expected HH:mm");

const employeeDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),

    isClosed: z.boolean(),

    startTime: timeSchema.nullable().optional(),
    endTime: timeSchema.nullable().optional(),

    secondStartTime: timeSchema.nullable().optional(),
    secondEndTime: timeSchema.nullable().optional(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) {
      return;
    }

    if (!day.startTime || !day.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Open days require startTime and endTime",
      });

      return;
    }

    if (day.startTime >= day.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startTime must be before endTime",
      });
    }

    const hasSecondStart = Boolean(day.secondStartTime);
    const hasSecondEnd = Boolean(day.secondEndTime);

    if (hasSecondStart !== hasSecondEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Second period requires both start and end time",
      });

      return;
    }

    if (day.secondStartTime && day.secondEndTime) {
      if (day.secondStartTime >= day.secondEndTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "secondStartTime must be before secondEndTime",
        });
      }

      if (day.secondStartTime < day.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Second period cannot overlap the first period",
        });
      }
    }
  });

export const updateEmployeeHoursSchema = z
  .object({
    hours: z.array(employeeDaySchema).min(1).max(7),
  })
  .superRefine((data, ctx) => {
    const weekdays = data.hours.map((day) => day.weekday);

    if (new Set(weekdays).size !== weekdays.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekdays cannot be duplicated",
      });
    }
  });
