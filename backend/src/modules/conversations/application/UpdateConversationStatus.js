import { CONVERSATION_STATUSES } from "../domain/Conversation.js";

import { AppError } from "../../../shared/errors/AppError.js";

const VALID_STATUSES = Object.values(CONVERSATION_STATUSES);

export class UpdateConversationStatus {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute(conversationId, status) {
    if (!conversationId) {
      throw new AppError("Conversation id is required", 400);
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid conversation status: ${status}`, 400);
    }

    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.status === status) {
      return conversation;
    }

    return this.conversationRepository.updateStatus(conversationId, status);
  }
}
