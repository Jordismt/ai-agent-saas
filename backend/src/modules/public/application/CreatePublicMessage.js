import { Message } from "../../conversations/domain/Message.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class CreatePublicMessage {
  constructor({ messageRepository, conversationRepository }) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
  }

  async execute({ conversationId, content }) {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.status === "closed") {
      throw new AppError("This conversation is closed", 409);
    }

    const message = new Message({
      conversationId,
      role: "user",
      content,
    });

    return this.messageRepository.create(message);
  }
}
