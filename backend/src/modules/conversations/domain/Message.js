import { AppError } from "../../../shared/errors/AppError.js";

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

const VALID_MESSAGE_ROLES = Object.values(MESSAGE_ROLES);

export class Message {
  constructor({ id = null, conversationId, role, content, createdAt = null }) {
    if (!conversationId) {
      throw new AppError("Message conversationId is required", 400);
    }

    if (!VALID_MESSAGE_ROLES.includes(role)) {
      throw new AppError(`Invalid message role: ${role}`, 400);
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new AppError("Message content is required", 400);
    }

    this.id = id;
    this.conversationId = conversationId;
    this.role = role;
    this.content = content.trim();
    this.createdAt = createdAt;
  }
}
