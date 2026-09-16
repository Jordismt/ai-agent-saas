import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del negocio es obligatorio.")
    .max(100, "El nombre del negocio no puede superar los 100 caracteres."),

  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede superar los 1000 caracteres.")
    .nullable()
    .optional(),

  phone: z.string().trim().max(30, "El teléfono no puede superar los 30 caracteres.").nullable().optional(),

  address: z
    .string()
    .trim()
    .max(255, "La dirección no puede superar los 255 caracteres.")
    .nullable()
    .optional(),
});
