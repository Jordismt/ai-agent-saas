import { describe, it, expect, vi } from "vitest";
import { GetConversation } from "../src/modules/conversations/application/GetConversation.js";

describe("GetConversation", () => {
  it("should get a conversation by id", async () => {
    const conversation = {
      id: "conversation-123",
    };

    const repository = {
      findById: vi.fn().mockResolvedValue(conversation),
    };

    const useCase = new GetConversation(repository);

    const result = await useCase.execute("conversation-123");

    expect(result).toEqual(conversation);
    expect(repository.findById).toHaveBeenCalledWith("conversation-123");
  });
});
