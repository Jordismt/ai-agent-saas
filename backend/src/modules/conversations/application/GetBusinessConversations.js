export class GetBusinessConversations {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute(businessId) {
    return this.conversationRepository.findByBusinessId(businessId);
  }
}
