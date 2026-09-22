import { z } from "zod";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM.")
  .nullable();

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),

  openTime: timeSchema,
  closeTime: timeSchema,

  secondOpenTime: timeSchema,
  secondCloseTime: timeSchema,

  isClosed: z.boolean(),
});

export const updateBusinessHoursSchema = z
  .object({
    hours: z.array(daySchema).length(7, "Debes proporcionar los 7 días de la semana."),
  })
  .superRefine((data, ctx) => {
    const days = data.hours.map((day) => day.dayOfWeek);

    if (new Set(days).size !== 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "Los días de la semana no pueden estar repetidos.",
      });
    }

    for (const day of data.hours) {
      if (day.isClosed) {
        if (
          day.openTime !== null ||
          day.closeTime !== null ||
          day.secondOpenTime !== null ||
          day.secondCloseTime !== null
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hours"],
            message: "Un día cerrado no puede tener horarios.",
          });
        }

        continue;
      }

      if (day.openTime === null || day.closeTime === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hours"],
          message: "Un día abierto debe tener horario de apertura y cierre.",
        });
      }

      const hasSecondOpen = day.secondOpenTime !== null;

      const hasSecondClose = day.secondCloseTime !== null;

      if (hasSecondOpen !== hasSecondClose) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hours"],
          message: "El segundo horario debe tener apertura y cierre.",
        });
      }
    }
  });
