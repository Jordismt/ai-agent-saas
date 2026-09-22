import { AppError } from "../../../shared/errors/AppError.js";

export class GetOwnedConversationOrThrow {
  constructor(getOwnedConversation) {
    this.getOwnedConversation = getOwnedConversation;
  }

  async execute(conversationId, ownerId) {
    const conversation = await this.getOwnedConversation.execute(conversationId, ownerId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    return conversation;
  }
}
