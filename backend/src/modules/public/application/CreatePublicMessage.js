import { Message } from "../../conversations/domain/Message.js";

export class CreatePublicMessage {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  async execute({ conversationId, content }) {
    const message = new Message({
      conversationId,
      role: "user",
      content,
    });

    return this.messageRepository.create(message);
  }
}
