export class Message {
  constructor({ id = null, conversationId, role, content, createdAt = null }) {
    this.id = id;
    this.conversationId = conversationId;
    this.role = role;
    this.content = content;
    this.createdAt = createdAt;
  }
}
