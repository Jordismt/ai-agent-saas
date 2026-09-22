import { Conversation } from "../domain/Conversation.js";

export class CreateConversation {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute({ businessId, channel = "web", status = "active", visitorId }) {
    const conversation = new Conversation({
      businessId,
      channel,
      status,
      visitorId,
    });

    return this.conversationRepository.create(conversation);
  }
}
