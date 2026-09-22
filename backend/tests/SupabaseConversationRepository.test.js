import { describe, it, expect, vi, beforeEach } from "vitest";

import { SupabaseConversationRepository } from "../src/modules/conversations/infrastructure/SupabaseConversationRepository.js";

describe("SupabaseConversationRepository", () => {
  let repository;

  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new SupabaseConversationRepository(mockSupabase);
  });

  describe("create", () => {
    it("should create a conversation", async () => {
      const conversation = {
        id: "conversation-123",
        business_id: "business-123",
        channel: "web",
        status: "active",
        visitor_id: "visitor-123",
      };

      const single = vi.fn().mockResolvedValue({
        data: conversation,
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
        businessId: "business-123",
        channel: "web",
        status: "active",
        visitorId: "visitor-123",
      });

      expect(result).toEqual(conversation);

      expect(mockSupabase.from).toHaveBeenCalledWith("conversations");

      expect(insert).toHaveBeenCalledWith({
        business_id: "business-123",
        channel: "web",
        status: "active",
        visitor_id: "visitor-123",
      });

      expect(select).toHaveBeenCalled();
      expect(single).toHaveBeenCalled();
    });

    it("should throw an AppError when creating a conversation fails", async () => {
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
          businessId: "business-123",
          channel: "web",
          status: "active",
          visitorId: "visitor-123",
        }),
      ).rejects.toMatchObject({
        message: "Failed to create conversation: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findById", () => {
    it("should find a conversation by id", async () => {
      const conversation = {
        id: "conversation-123",
        business_id: "business-123",
        channel: "web",
        status: "active",
        visitor_id: "visitor-123",
      };

      const maybeSingle = vi.fn().mockResolvedValue({
        data: conversation,
        error: null,
      });

      const eq = vi.fn().mockReturnValue({
        maybeSingle,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findById("conversation-123");

      expect(result).toEqual(conversation);

      expect(mockSupabase.from).toHaveBeenCalledWith("conversations");

      expect(select).toHaveBeenCalledWith("*");
      expect(eq).toHaveBeenCalledWith("id", "conversation-123");
      expect(maybeSingle).toHaveBeenCalled();
    });

    it("should return null when conversation does not exist", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const eq = vi.fn().mockReturnValue({
        maybeSingle,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findById("conversation-123");

      expect(result).toBeNull();
    });

    it("should throw an AppError when finding a conversation fails", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const eq = vi.fn().mockReturnValue({
        maybeSingle,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      await expect(repository.findById("conversation-123")).rejects.toMatchObject({
        message: "Failed to find conversation: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findByBusinessId", () => {
    it("should find conversations by business id", async () => {
      const conversations = [
        {
          id: "conversation-1",
          business_id: "business-123",
          channel: "web",
          status: "active",
        },
        {
          id: "conversation-2",
          business_id: "business-123",
          channel: "web",
          status: "closed",
        },
      ];

      const order = vi.fn().mockResolvedValue({
        data: conversations,
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

      const result = await repository.findByBusinessId("business-123");

      expect(result).toEqual(conversations);

      expect(mockSupabase.from).toHaveBeenCalledWith("conversations");

      expect(select).toHaveBeenCalledWith("*");

      expect(eq).toHaveBeenCalledWith("business_id", "business-123");

      expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should throw an AppError when finding conversations fails", async () => {
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

      await expect(repository.findByBusinessId("business-123")).rejects.toMatchObject({
        message: "Failed to find conversations: Database error",
        statusCode: 500,
      });
    });
  });

  describe("updateStatus", () => {
    it("should update conversation status", async () => {
      const conversation = {
        id: "conversation-123",
        business_id: "business-123",
        status: "human",
      };

      const single = vi.fn().mockResolvedValue({
        data: conversation,
        error: null,
      });

      const select = vi.fn().mockReturnValue({
        single,
      });

      const eq = vi.fn().mockReturnValue({
        select,
      });

      const update = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        update,
      });

      const result = await repository.updateStatus("conversation-123", "human");

      expect(result).toEqual(conversation);

      expect(mockSupabase.from).toHaveBeenCalledWith("conversations");

      expect(update).toHaveBeenCalledWith({
        status: "human",
        updated_at: expect.any(String),
      });

      expect(eq).toHaveBeenCalledWith("id", "conversation-123");

      expect(select).toHaveBeenCalled();
      expect(single).toHaveBeenCalled();
    });

    it("should throw an AppError when updating conversation fails", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const select = vi.fn().mockReturnValue({
        single,
      });

      const eq = vi.fn().mockReturnValue({
        select,
      });

      const update = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        update,
      });

      await expect(repository.updateStatus("conversation-123", "human")).rejects.toMatchObject({
        message: "Failed to update conversation: Database error",
        statusCode: 500,
      });
    });
  });
});
