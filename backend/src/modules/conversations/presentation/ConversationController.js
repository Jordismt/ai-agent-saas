import { CreateConversation } from "../application/CreateConversation.js";
import { GetBusinessConversations } from "../application/GetBusinessConversations.js";
import { CreateMessage } from "../application/CreateMessage.js";
import { GetConversationMessages } from "../application/GetConversationMessages.js";
import { UpdateConversationStatus } from "../application/UpdateConversationStatus.js";

import { GetOwnedConversation } from "../application/GetOwnedConversation.js";
import { GetOwnedConversationOrThrow } from "../application/GetOwnedConversationOrThrow.js";

import { GetOwnedBusiness } from "../../businesses/application/GetOwnedBusiness.js";
import { GetOwnedBusinessOrThrow } from "../../businesses/application/GetOwnedBusinessOrThrow.js";

import { createConversationSchema } from "./createConversationSchema.js";
import { createMessageSchema } from "./createMessageSchema.js";
import { updateConversationStatusSchema } from "./updateConversationStatusSchema.js";

export class ConversationController {
  constructor({ conversationRepository, messageRepository, businessRepository }) {
    this.createConversation = new CreateConversation(conversationRepository);

    this.getBusinessConversations = new GetBusinessConversations(conversationRepository);

    this.createMessageUseCase = new CreateMessage(messageRepository);

    this.getConversationMessages = new GetConversationMessages(messageRepository);

    this.updateConversationStatus = new UpdateConversationStatus(conversationRepository);

    this.getOwnedConversationOrThrow = new GetOwnedConversationOrThrow(
      new GetOwnedConversation({
        conversationRepository,
        businessRepository,
      }),
    );

    this.getOwnedBusinessOrThrow = new GetOwnedBusinessOrThrow(new GetOwnedBusiness(businessRepository));
  }

  async create(req, res, next) {
    try {
      const data = createConversationSchema.parse(req.body);

      await this.getOwnedBusinessOrThrow.execute(data.businessId, req.user.id);

      const conversation = await this.createConversation.execute(data);

      return res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const conversation = await this.getOwnedConversationOrThrow.execute(req.params.id, req.user.id);

      return res.json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async getByBusinessId(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const conversations = await this.getBusinessConversations.execute(req.params.businessId);

      return res.json(conversations);
    } catch (error) {
      next(error);
    }
  }

  async createMessage(req, res, next) {
    try {
      await this.getOwnedConversationOrThrow.execute(req.params.id, req.user.id);

      const data = createMessageSchema.parse(req.body);

      const message = await this.createMessageUseCase.execute({
        conversationId: req.params.id,
        ...data,
      });

      return res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      await this.getOwnedConversationOrThrow.execute(req.params.id, req.user.id);

      const messages = await this.getConversationMessages.execute(req.params.id);

      return res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      await this.getOwnedConversationOrThrow.execute(req.params.id, req.user.id);

      const { status } = updateConversationStatusSchema.parse(req.body);

      const conversation = await this.updateConversationStatus.execute(req.params.id, status);

      return res.json(conversation);
    } catch (error) {
      next(error);
    }
  }
}
