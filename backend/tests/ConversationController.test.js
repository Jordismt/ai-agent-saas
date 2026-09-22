import { describe, it, expect, vi } from "vitest";
import { ConversationController } from "../src/modules/conversations/presentation/ConversationController.js";

function createController() {
  const conversationRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByBusinessId: vi.fn(),
    updateStatus: vi.fn(),
  };

  const messageRepository = {
    create: vi.fn(),
    findByConversationId: vi.fn(),
  };

  const businessRepository = {
    findById: vi.fn(),
  };

  const controller = new ConversationController({
    conversationRepository,
    messageRepository,
    businessRepository,
  });

  return {
    controller,
    conversationRepository,
    messageRepository,
    businessRepository,
  };
}

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("ConversationController", () => {
  describe("create", () => {
    it("should create a conversation", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      const conversation = {
        id: "conversation-123",
      };

      conversationRepository.create.mockResolvedValue(conversation);

      businessRepository.findById.mockResolvedValue({
        id: "550e8400-e29b-41d4-a716-446655440000",
        owner_id: "owner-123",
      });

      const req = {
        body: {
          businessId: "550e8400-e29b-41d4-a716-446655440000",
          channel: "web",
          visitorId: "550e8400-e29b-41d4-a716-446655440001",
        },
        user: {
          id: "owner-123",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(conversation);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return a validation error when businessId is missing", async () => {
      const { controller } = createController();

      const req = {
        body: {
          visitorId: "550e8400-e29b-41d4-a716-446655440001",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ZodError",
        }),
      );
    });

    it("should return a validation error when visitorId is missing", async () => {
      const { controller } = createController();

      const req = {
        body: {
          businessId: "550e8400-e29b-41d4-a716-446655440000",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ZodError",
        }),
      );
    });
  });

  describe("getById", () => {
    it("should return an owned conversation", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      const conversation = {
        id: "conversation-123",
        business_id: "business-123",
      };

      conversationRepository.findById.mockResolvedValue(conversation);

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(conversation);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 when conversation is not owned", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "other-owner",
      });

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Conversation not found",
        }),
      );
    });
  });

  describe("getByBusinessId", () => {
    it("should return conversations for an owned business", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      const conversations = [
        {
          id: "conversation-1",
          business_id: "business-123",
        },
        {
          id: "conversation-2",
          business_id: "business-123",
        },
      ];

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      conversationRepository.findByBusinessId.mockResolvedValue(conversations);

      const req = {
        params: {
          businessId: "business-123",
        },
        user: {
          id: "owner-123",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.getByBusinessId(req, res, next);

      expect(res.json).toHaveBeenCalledWith(conversations);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 when business is not owned", async () => {
      const { controller, businessRepository } = createController();

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "other-owner",
      });

      const req = {
        params: {
          businessId: "business-123",
        },
        user: {
          id: "owner-123",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.getByBusinessId(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Business not found",
        }),
      );
    });
  });

  describe("createMessage", () => {
    it("should create a message in an owned conversation", async () => {
      const { controller, conversationRepository, messageRepository, businessRepository } =
        createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const message = {
        id: "message-123",
      };

      messageRepository.create.mockResolvedValue(message);

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
        body: {
          role: "user",
          content: "Hola",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.createMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(message);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return a validation error when role is missing", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
        body: {
          content: "Hola",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.createMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ZodError",
        }),
      );
    });

    it("should return a validation error when content is missing", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
        body: {
          role: "user",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.createMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ZodError",
        }),
      );
    });
  });

  describe("getMessages", () => {
    it("should return messages from an owned conversation", async () => {
      const { controller, conversationRepository, messageRepository, businessRepository } =
        createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const messages = [
        {
          id: "message-1",
          role: "user",
          content: "Hola",
        },
      ];

      messageRepository.findByConversationId.mockResolvedValue(messages);

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.getMessages(req, res, next);

      expect(res.json).toHaveBeenCalledWith(messages);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("should update the status of an owned conversation", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const updatedConversation = {
        id: "conversation-123",
        status: "human",
      };

      conversationRepository.updateStatus.mockResolvedValue(updatedConversation);

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
        body: {
          status: "human",
        },
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.updateStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updatedConversation);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return a validation error when status is missing", async () => {
      const { controller, conversationRepository, businessRepository } = createController();

      conversationRepository.findById.mockResolvedValue({
        id: "conversation-123",
        business_id: "business-123",
      });

      businessRepository.findById.mockResolvedValue({
        id: "business-123",
        owner_id: "owner-123",
      });

      const req = {
        params: {
          id: "conversation-123",
        },
        user: {
          id: "owner-123",
        },
        body: {},
      };

      const res = createResponse();
      const next = vi.fn();

      await controller.updateStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ZodError",
        }),
      );
    });
  });
});
