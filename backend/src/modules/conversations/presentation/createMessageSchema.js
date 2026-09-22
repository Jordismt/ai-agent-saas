import { z } from "zod";

export const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z
    .string()
    .trim()
    .min(1, "El contenido del mensaje es obligatorio.")
    .max(10000, "El mensaje no puede superar los 10000 caracteres."),
});
