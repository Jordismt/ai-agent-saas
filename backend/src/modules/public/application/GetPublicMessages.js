export class GetPublicMessages {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute(conversationId) {
    return this.messageRepository.findByConversationId(conversationId);
  }
}
