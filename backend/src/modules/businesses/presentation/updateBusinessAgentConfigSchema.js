import { z } from "zod";

export const updateBusinessAgentConfigSchema =
  z.object({
    systemInstructions: z
      .string()
      .trim()
      .max(
        10000,
        "Las instrucciones no pueden superar los 10000 caracteres."
      )
      .nullable(),

    welcomeMessage: z
      .string()
      .trim()
      .max(
        1000,
        "El mensaje de bienvenida no puede superar los 1000 caracteres."
      )
      .nullable(),

    tone: z.enum([
      "professional",
      "friendly",
      "casual",
    ]),
  });