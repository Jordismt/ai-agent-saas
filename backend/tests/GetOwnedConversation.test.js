import { describe, it, expect, vi } from "vitest";
import { GetOwnedConversation } from "../src/modules/conversations/application/GetOwnedConversation.js";

describe("GetOwnedConversation", () => {
  it("should return the conversation when it belongs to the owner", async () => {
    const conversation = {
      id: "conversation-123",
      business_id: "business-123",
    };

    const conversationRepository = {
      findById: vi.fn().mockResolvedValue(conversation),
    };

    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      }),
    };

    const useCase = new GetOwnedConversation({
      conversationRepository,
      businessRepository,
    });

    const result = await useCase.execute("conversation-123", "owner-123");

    expect(result).toEqual(conversation);
  });

  it("should return null when the conversation does not exist", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const businessRepository = {
      findById: vi.fn(),
    };

    const useCase = new GetOwnedConversation({
      conversationRepository,
      businessRepository,
    });

    const result = await useCase.execute("conversation-123", "owner-123");

    expect(result).toBeNull();
    expect(businessRepository.findById).not.toHaveBeenCalled();
  });

  it("should return null when the conversation belongs to another owner", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      }),
    };

    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "other-owner",
      }),
    };

    const useCase = new GetOwnedConversation({
      conversationRepository,
      businessRepository,
    });

    const result = await useCase.execute("conversation-123", "owner-123");

    expect(result).toBeNull();
  });
});
