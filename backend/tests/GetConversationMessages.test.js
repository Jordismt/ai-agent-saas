import { describe, it, expect, vi } from "vitest";
import { GetConversationMessages } from "../src/modules/conversations/application/GetConversationMessages.js";

describe("GetConversationMessages", () => {
  it("should get messages by conversation id", async () => {
    const messages = [
      {
        id: "message-1",
        role: "user",
        content: "Hola",
      },
      {
        id: "message-2",
        role: "assistant",
        content: "¡Hola!",
      },
    ];

    const repository = {
      findByConversationId: vi.fn().mockResolvedValue(messages),
    };

    const useCase = new GetConversationMessages(repository);

    const result = await useCase.execute("conversation-123");

    expect(result).toEqual(messages);

    expect(repository.findByConversationId).toHaveBeenCalledWith("conversation-123");
  });
});
