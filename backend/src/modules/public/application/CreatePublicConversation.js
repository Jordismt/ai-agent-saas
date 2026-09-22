import { Conversation } from "../../conversations/domain/Conversation.js";

export class CreatePublicConversation {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute({ businessId, visitorId }) {
    const existingConversation = await this.conversationRepository.findActiveByBusinessIdAndVisitorId(
      businessId,
      visitorId,
    );

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = new Conversation({
      businessId,
      channel: "web",
      status: "active",
      visitorId,
    });

    return this.conversationRepository.create(conversation);
  }
}
