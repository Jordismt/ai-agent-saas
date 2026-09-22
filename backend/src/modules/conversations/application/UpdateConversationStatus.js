export class UpdateConversationStatus {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  async execute(conversationId, status) {
    return this.conversationRepository.updateStatus(conversationId, status);
  }
}
