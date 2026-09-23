import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

const noneActionSchema = z.object({
  type: z.literal("none"),
  data: z.object({}).optional().default({}),
});

const createLeadActionSchema = z.object({
  type: z.literal("create_lead"),

  data: z.object({
    name: z.string().trim().max(120).nullable().optional(),

    phone: z.string().trim().max(50).nullable().optional(),

    email: z.string().trim().email().max(254).nullable().optional(),

    notes: z.string().trim().max(1000).nullable().optional(),
  }),
});

const humanHandoffActionSchema = z.object({
  type: z.literal("human_handoff"),
  data: z.object({}).optional().default({}),
});

const checkAvailabilityActionSchema = z.object({
  type: z.literal("check_availability"),

  data: z.object({
    serviceId: z.string().uuid(),

    date: dateSchema,

    /*
     * Hora LOCAL opcional.
     *
     * Se utiliza cuando el usuario pregunta
     * específicamente por una hora:
     *
     * "¿Hay hueco a las 17?"
     * "¿Tenéis a las 10:30?"
     *
     * El backend sigue calculando toda la
     * disponibilidad real. Esta hora únicamente
     * conserva la intención del usuario.
     */
    time: timeSchema.nullable().optional(),
  }),
});

const createBookingActionSchema = z.object({
  type: z.literal("create_booking"),

  data: z.object({
    serviceId: z.string().uuid(),

    /*
     * La IA solamente proporciona fecha y hora LOCAL.
     *
     * Nunca confiamos en la IA para generar offsets,
     * UTC o conversiones de zona horaria.
     */
    date: dateSchema,

    time: timeSchema,

    customerName: z.string().trim().min(1).max(120),

    customerPhone: z.string().trim().max(50).nullable().optional(),

    customerEmail: z.string().trim().email().max(254).nullable().optional(),

    notes: z.string().trim().max(1000).nullable().optional(),
  }),
});

export const agentResponseSchema = z.object({
  content: z.string().trim().min(1).max(4000),

  action: z.discriminatedUnion("type", [
    noneActionSchema,
    createLeadActionSchema,
    humanHandoffActionSchema,
    checkAvailabilityActionSchema,
    createBookingActionSchema,
  ]),
});
