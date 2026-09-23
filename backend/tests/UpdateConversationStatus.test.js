import { describe, it, expect, vi } from "vitest";

import { UpdateConversationStatus } from "../src/modules/conversations/application/UpdateConversationStatus.js";

describe("UpdateConversationStatus", () => {
  it("should update conversation status", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        status: "active",
      }),

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

    expect(repository.findById).toHaveBeenCalledWith("conversation-123");

    expect(repository.updateStatus).toHaveBeenCalledWith("conversation-123", "human");
  });

  it("should allow changing conversation status to closed", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        status: "active",
      }),

      updateStatus: vi.fn().mockResolvedValue({
        id: "conversation-123",
        status: "closed",
      }),
    };

    const useCase = new UpdateConversationStatus(repository);

    const result = await useCase.execute("conversation-123", "closed");

    expect(result.status).toBe("closed");

    expect(repository.updateStatus).toHaveBeenCalledWith("conversation-123", "closed");
  });

  it("should allow reopening a closed conversation", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        status: "closed",
      }),

      updateStatus: vi.fn().mockResolvedValue({
        id: "conversation-123",
        status: "active",
      }),
    };

    const useCase = new UpdateConversationStatus(repository);

    const result = await useCase.execute("conversation-123", "active");

    expect(result.status).toBe("active");

    expect(repository.updateStatus).toHaveBeenCalledWith("conversation-123", "active");
  });

  it("should return the conversation without updating when status is already the same", async () => {
    const conversation = {
      id: "conversation-123",
      status: "human",
    };

    const repository = {
      findById: vi.fn().mockResolvedValue(conversation),

      updateStatus: vi.fn(),
    };

    const useCase = new UpdateConversationStatus(repository);

    const result = await useCase.execute("conversation-123", "human");

    expect(result).toEqual(conversation);

    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("should throw when conversation does not exist", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
    };

    const useCase = new UpdateConversationStatus(repository);

    await expect(useCase.execute("conversation-123", "human")).rejects.toMatchObject({
      message: "Conversation not found",
      statusCode: 404,
    });

    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("should throw when status is invalid", async () => {
    const repository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    };

    const useCase = new UpdateConversationStatus(repository);

    await expect(useCase.execute("conversation-123", "whatever")).rejects.toMatchObject({
      message: "Invalid conversation status: whatever",
      statusCode: 400,
    });

    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("should throw when conversation id is missing", async () => {
    const repository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    };

    const useCase = new UpdateConversationStatus(repository);

    await expect(useCase.execute(null, "human")).rejects.toMatchObject({
      message: "Conversation id is required",
      statusCode: 400,
    });

    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });
});
