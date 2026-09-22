import { Message } from "../domain/Message.js";

export class CreateMessage {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute({ conversationId, role, content }) {
    const message = new Message({
      conversationId,
      role,
      content,
    });

    return this.messageRepository.create(message);
  }
}
