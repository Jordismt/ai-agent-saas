import { describe, it, expect } from "vitest";
import { createMessageSchema } from "../src/modules/conversations/presentation/createMessageSchema.js";

describe("createMessageSchema", () => {
  it("should accept a valid user message", () => {
    const result = createMessageSchema.parse({
      role: "user",
      content: "Hola, ¿qué servicios ofrecéis?",
    });

    expect(result).toEqual({
      role: "user",
      content: "Hola, ¿qué servicios ofrecéis?",
    });
  });

  it("should accept assistant messages", () => {
    const result = createMessageSchema.parse({
      role: "assistant",
      content: "Hola, ¿en qué puedo ayudarte?",
    });

    expect(result.role).toBe("assistant");
  });

  it("should accept system messages", () => {
    const result = createMessageSchema.parse({
      role: "system",
      content: "Contexto del negocio.",
    });

    expect(result.role).toBe("system");
  });

  it("should reject an invalid role", () => {
    expect(() =>
      createMessageSchema.parse({
        role: "admin",
        content: "Hola",
      }),
    ).toThrow();
  });

  it("should reject empty content", () => {
    expect(() =>
      createMessageSchema.parse({
        role: "user",
        content: "",
      }),
    ).toThrow();
  });

  it("should reject whitespace-only content", () => {
    expect(() =>
      createMessageSchema.parse({
        role: "user",
        content: "   ",
      }),
    ).toThrow();
  });

  it("should trim content", () => {
    const result = createMessageSchema.parse({
      role: "user",
      content: "   Hola   ",
    });

    expect(result.content).toBe("Hola");
  });
});
