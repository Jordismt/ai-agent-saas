import { describe, it, expect, vi } from "vitest";
import { CreateConversation } from "../src/modules/conversations/application/CreateConversation.js";

describe("CreateConversation", () => {
  it("should create a conversation", async () => {
    const repository = {
      create: vi.fn().mockResolvedValue({
        id: "conversation-123",
      }),
    };

    const useCase = new CreateConversation(repository);

    const result = await useCase.execute({
      businessId: "business-123",
      channel: "web",
      status: "active",
      visitorId: "visitor-123",
    });

    expect(result).toEqual({
      id: "conversation-123",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "business-123",
        channel: "web",
        status: "active",
        visitorId: "visitor-123",
      }),
    );
  });
});
