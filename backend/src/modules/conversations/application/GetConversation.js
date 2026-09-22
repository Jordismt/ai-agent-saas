export class GetConversation {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute(conversationId) {
    return this.conversationRepository.findById(conversationId);
  }
}
