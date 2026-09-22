import { describe, it, expect, vi } from "vitest";
import { GetBusinessConversations } from "../src/modules/conversations/application/GetBusinessConversations.js";

describe("GetBusinessConversations", () => {
  it("should get conversations by business id", async () => {
    const conversations = [
      {
        id: "conversation-1",
      },
      {
        id: "conversation-2",
      },
    ];

    const repository = {
      findByBusinessId: vi.fn().mockResolvedValue(conversations),
    };

    const useCase = new GetBusinessConversations(repository);

    const result = await useCase.execute("business-123");

    expect(result).toEqual(conversations);

    expect(repository.findByBusinessId).toHaveBeenCalledWith("business-123");
  });
});
