import { GetConversation } from "./GetConversation.js";

export class GetOwnedConversation {
  constructor({ conversationRepository, businessRepository }) {
    this.getConversation = new GetConversation(conversationRepository);

    this.businessRepository = businessRepository;
  }

  async execute(conversationId, ownerId) {
    const conversation = await this.getConversation.execute(conversationId);

    if (!conversation) {
      return null;
    }

    const business = await this.businessRepository.findById(conversation.business_id);

    if (!business || business.owner_id !== ownerId) {
      return null;
    }

    return conversation;
  }
}
