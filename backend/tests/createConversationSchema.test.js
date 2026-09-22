import { describe, it, expect } from "vitest";
import { createConversationSchema } from "../src/modules/conversations/presentation/createConversationSchema.js";

describe("createConversationSchema", () => {
  it("should accept valid data", () => {
    const result = createConversationSchema.parse({
      businessId: "550e8400-e29b-41d4-a716-446655440000",
      channel: "web",
      visitorId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(result).toEqual({
      businessId: "550e8400-e29b-41d4-a716-446655440000",
      channel: "web",
      visitorId: "550e8400-e29b-41d4-a716-446655440001",
    });
  });

  it("should default channel to web", () => {
    const result = createConversationSchema.parse({
      businessId: "550e8400-e29b-41d4-a716-446655440000",
      visitorId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(result.channel).toBe("web");
  });

  it("should reject an invalid businessId", () => {
    expect(() =>
      createConversationSchema.parse({
        businessId: "invalid-id",
        visitorId: "550e8400-e29b-41d4-a716-446655440001",
      }),
    ).toThrow();
  });

  it("should reject an invalid visitorId", () => {
    expect(() =>
      createConversationSchema.parse({
        businessId: "550e8400-e29b-41d4-a716-446655440000",
        visitorId: "invalid-id",
      }),
    ).toThrow();
  });

  it("should reject an invalid channel", () => {
    expect(() =>
      createConversationSchema.parse({
        businessId: "550e8400-e29b-41d4-a716-446655440000",
        channel: "telegram",
        visitorId: "550e8400-e29b-41d4-a716-446655440001",
      }),
    ).toThrow();
  });
});
