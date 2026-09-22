import { describe, it, expect, vi, beforeEach } from "vitest";

import { SupabaseMessageRepository } from "../src/modules/conversations/infrastructure/SupabaseMessageRepository.js";

describe("SupabaseMessageRepository", () => {
  let repository;

  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new SupabaseMessageRepository(mockSupabase);
  });

  describe("create", () => {
    it("should create a message", async () => {
      const message = {
        id: "message-123",
        conversation_id: "conversation-123",
        role: "user",
        content: "¿Cuánto cuesta un corte?",
      };

      const single = vi.fn().mockResolvedValue({
        data: message,
        error: null,
      });

      const select = vi.fn().mockReturnValue({
        single,
      });

      const insert = vi.fn().mockReturnValue({
        select,
      });

      mockSupabase.from.mockReturnValue({
        insert,
      });

      const result = await repository.create({
        conversationId: "conversation-123",
        role: "user",
        content: "¿Cuánto cuesta un corte?",
      });

      expect(result).toEqual(message);

      expect(mockSupabase.from).toHaveBeenCalledWith("messages");

      expect(insert).toHaveBeenCalledWith({
        conversation_id: "conversation-123",
        role: "user",
        content: "¿Cuánto cuesta un corte?",
      });

      expect(select).toHaveBeenCalled();
      expect(single).toHaveBeenCalled();
    });

    it("should throw an AppError when creating a message fails", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const select = vi.fn().mockReturnValue({
        single,
      });

      const insert = vi.fn().mockReturnValue({
        select,
      });

      mockSupabase.from.mockReturnValue({
        insert,
      });

      await expect(
        repository.create({
          conversationId: "conversation-123",
          role: "user",
          content: "Hola",
        }),
      ).rejects.toMatchObject({
        message: "Failed to create message: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findByConversationId", () => {
    it("should find messages by conversation id", async () => {
      const messages = [
        {
          id: "message-1",
          conversation_id: "conversation-123",
          role: "user",
          content: "Hola",
        },
        {
          id: "message-2",
          conversation_id: "conversation-123",
          role: "assistant",
          content: "¡Hola! ¿En qué puedo ayudarte?",
        },
      ];

      const order = vi.fn().mockResolvedValue({
        data: messages,
        error: null,
      });

      const eq = vi.fn().mockReturnValue({
        order,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findByConversationId("conversation-123");

      expect(result).toEqual(messages);

      expect(mockSupabase.from).toHaveBeenCalledWith("messages");

      expect(select).toHaveBeenCalledWith("*");

      expect(eq).toHaveBeenCalledWith("conversation_id", "conversation-123");

      expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
    });

    it("should throw an AppError when finding messages fails", async () => {
      const order = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const eq = vi.fn().mockReturnValue({
        order,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      await expect(repository.findByConversationId("conversation-123")).rejects.toMatchObject({
        message: "Failed to find messages: Database error",
        statusCode: 500,
      });
    });
  });
});
