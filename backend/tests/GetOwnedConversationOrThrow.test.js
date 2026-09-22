import { describe, it, expect, vi } from "vitest";
import { GetOwnedConversationOrThrow } from "../src/modules/conversations/application/GetOwnedConversationOrThrow.js";

describe("GetOwnedConversationOrThrow", () => {
  it("should return the conversation when it belongs to the owner", async () => {
    const conversation = {
      id: "conversation-123",
    };

    const getOwnedConversation = {
      execute: vi.fn().mockResolvedValue(conversation),
    };

    const useCase = new GetOwnedConversationOrThrow(getOwnedConversation);

    const result = await useCase.execute("conversation-123", "owner-123");

    expect(result).toEqual(conversation);
  });

  it("should throw 404 when the conversation does not belong to the owner", async () => {
    const getOwnedConversation = {
      execute: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetOwnedConversationOrThrow(getOwnedConversation);

    await expect(useCase.execute("conversation-123", "owner-123")).rejects.toMatchObject({
      message: "Conversation not found",
      statusCode: 404,
    });
  });
});
