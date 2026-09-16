import { z } from "zod";

export const updateBusinessServiceSchema = z.object({
  name: z.string().trim().min(1, "El nombre del servicio es obligatorio."),

  description: z.string().trim().nullable().optional(),

  price: z.number().min(0, "El precio no puede ser negativo.").nullable().optional(),

  duration_minutes: z.number().int().positive("La duración debe ser mayor que 0.").nullable().optional(),
});
