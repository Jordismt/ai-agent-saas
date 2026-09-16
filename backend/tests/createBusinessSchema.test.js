import { describe, it, expect } from "vitest";
import { createBusinessSchema } from "../src/modules/businesses/presentation/createBusinessSchema.js";

describe("createBusinessSchema", () => {
  it("should accept valid business data", () => {
    const result = createBusinessSchema.parse({
      name: "Peluquería Laura",
      description: "Peluquería y barbería",
      phone: "600000000",
      address: "Calle Mayor 10",
    });

    expect(result.name).toBe("Peluquería Laura");
    expect(result.description).toBe("Peluquería y barbería");
    expect(result.phone).toBe("600000000");
    expect(result.address).toBe("Calle Mayor 10");
  });

  it("should reject an empty name", () => {
    expect(() =>
      createBusinessSchema.parse({
        name: "",
      }),
    ).toThrow();
  });

  it("should reject a name longer than 100 characters", () => {
    expect(() =>
      createBusinessSchema.parse({
        name: "a".repeat(101),
      }),
    ).toThrow();
  });

  it("should reject a description longer than 1000 characters", () => {
    expect(() =>
      createBusinessSchema.parse({
        name: "Peluquería Laura",
        description: "a".repeat(1001),
      }),
    ).toThrow();
  });

  it("should accept optional fields", () => {
    const result = createBusinessSchema.parse({
      name: "Peluquería Laura",
    });

    expect(result.name).toBe("Peluquería Laura");
  });
});
