import { describe, it, expect, vi } from "vitest";
import { CreateMessage } from "../src/modules/conversations/application/CreateMessage.js";

describe("CreateMessage", () => {
  it("should create a message", async () => {
    const repository = {
      create: vi.fn().mockResolvedValue({
        id: "message-123",
      }),
    };

    const useCase = new CreateMessage(repository);

    const result = await useCase.execute({
      conversationId: "conversation-123",
      role: "user",
      content: "Hola",
    });

    expect(result).toEqual({
      id: "message-123",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conversation-123",
        role: "user",
        content: "Hola",
      }),
    );
  });
});
