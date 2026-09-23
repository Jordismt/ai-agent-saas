import { describe, it, expect, vi } from "vitest";

import { CreatePublicMessage } from "../src/modules/public/application/CreatePublicMessage.js";

describe("CreatePublicMessage", () => {
  it("should create a user message for an active conversation", async () => {
    const conversation = {
      id: "conversation-123",
      business_id: "business-123",
      status: "active",
    };

    const conversationRepository = {
      findById: vi.fn().mockResolvedValue(conversation),
    };

    const messageRepository = {
      create: vi.fn().mockImplementation(async (message) => ({
        id: "message-123",
        conversation_id: message.conversationId,
        role: message.role,
        content: message.content,
      })),
    };

    const useCase = new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    });

    const result = await useCase.execute({
      conversationId: "conversation-123",
      content: "Hola, quiero información",
    });

    expect(conversationRepository.findById).toHaveBeenCalledWith("conversation-123");

    expect(messageRepository.create).toHaveBeenCalledOnce();

    const message = messageRepository.create.mock.calls[0][0];

    expect(message.conversationId).toBe("conversation-123");
    expect(message.role).toBe("user");
    expect(message.content).toBe("Hola, quiero información");

    expect(result).toEqual({
      id: "message-123",
      conversation_id: "conversation-123",
      role: "user",
      content: "Hola, quiero información",
    });
  });

  it("should allow creating a user message while conversation is handled by a human", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
        status: "human",
      }),
    };

    const messageRepository = {
      create: vi.fn().mockImplementation(async (message) => ({
        id: "message-123",
        conversation_id: message.conversationId,
        role: message.role,
        content: message.content,
      })),
    };

    const useCase = new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    });

    const result = await useCase.execute({
      conversationId: "conversation-123",
      content: "¿Hay alguien?",
    });

    expect(messageRepository.create).toHaveBeenCalledOnce();

    expect(result.role).toBe("user");
    expect(result.content).toBe("¿Hay alguien?");
  });

  it("should reject creating a message for a closed conversation", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
        status: "closed",
      }),
    };

    const messageRepository = {
      create: vi.fn(),
    };

    const useCase = new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    });

    await expect(
      useCase.execute({
        conversationId: "conversation-123",
        content: "Hola",
      }),
    ).rejects.toMatchObject({
      message: "This conversation is closed",
      statusCode: 409,
    });

    expect(messageRepository.create).not.toHaveBeenCalled();
  });

  it("should reject when conversation does not exist", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const messageRepository = {
      create: vi.fn(),
    };

    const useCase = new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    });

    await expect(
      useCase.execute({
        conversationId: "conversation-123",
        content: "Hola",
      }),
    ).rejects.toMatchObject({
      message: "Conversation not found",
      statusCode: 404,
    });

    expect(messageRepository.create).not.toHaveBeenCalled();
  });

  it("should always create the public message with user role", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
        status: "active",
      }),
    };

    const messageRepository = {
      create: vi.fn().mockImplementation(async (message) => message),
    };

    const useCase = new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    });

    await useCase.execute({
      conversationId: "conversation-123",
      content: "Mensaje del cliente",
    });

    const message = messageRepository.create.mock.calls[0][0];

    expect(message.role).toBe("user");
  });

  it("should preserve the message content", async () => {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
        status: "active",
      }),
    };

    const messageRepository = {
      create: vi.fn().mockImplementation(async (message) => message),
    };

    const useCase = new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    });

    const content = "Quiero reservar un corte mañana a las 17:00";

    await useCase.execute({
      conversationId: "conversation-123",
      content,
    });

    const message = messageRepository.create.mock.calls[0][0];

    expect(message.content).toBe(content);
  });
});
