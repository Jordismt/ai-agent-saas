export class Conversation {
  constructor({
    id = null,
    businessId,
    channel = "web",
    status = "active",
    visitorId,
    publicToken = null,
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.businessId = businessId;
    this.channel = channel;
    this.status = status;
    this.visitorId = visitorId;
    this.publicToken = publicToken;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
