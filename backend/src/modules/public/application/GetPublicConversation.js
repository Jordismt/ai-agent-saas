import { AppError } from "../../../shared/errors/AppError.js";

export class GetPublicConversation {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute(conversationId, publicToken) {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation || conversation.public_token !== publicToken) {
      throw new AppError("Public conversation not found", 404);
    }

    return conversation;
  }
}
