import { describe, it, expect, vi } from "vitest";
import { UpdateConversationStatus } from "../src/modules/conversations/application/UpdateConversationStatus.js";

describe("UpdateConversationStatus", () => {
  it("should update conversation status", async () => {
    const repository = {
      updateStatus: vi.fn().mockResolvedValue({
        id: "conversation-123",
        status: "human",
      }),
    };

    const useCase = new UpdateConversationStatus(repository);

    const result = await useCase.execute("conversation-123", "human");

    expect(result).toEqual({
      id: "conversation-123",
      status: "human",
    });

    expect(repository.updateStatus).toHaveBeenCalledWith("conversation-123", "human");
  });
});
