import { describe, it, expect } from "vitest";
import { updateConversationStatusSchema } from "../src/modules/conversations/presentation/updateConversationStatusSchema.js";

describe("updateConversationStatusSchema", () => {
  it("should accept active status", () => {
    const result = updateConversationStatusSchema.parse({
      status: "active",
    });

    expect(result.status).toBe("active");
  });

  it("should accept closed status", () => {
    const result = updateConversationStatusSchema.parse({
      status: "closed",
    });

    expect(result.status).toBe("closed");
  });

  it("should accept human status", () => {
    const result = updateConversationStatusSchema.parse({
      status: "human",
    });

    expect(result.status).toBe("human");
  });

  it("should reject an invalid status", () => {
    expect(() =>
      updateConversationStatusSchema.parse({
        status: "pending",
      }),
    ).toThrow();
  });

  it("should reject a missing status", () => {
    expect(() => updateConversationStatusSchema.parse({})).toThrow();
  });
});
