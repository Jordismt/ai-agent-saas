export class GetConversationMessages {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute(conversationId) {
    return this.messageRepository.findByConversationId(conversationId);
  }
}
