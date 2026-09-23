import { AppError } from "../../../shared/errors/AppError.js";

export const CONVERSATION_STATUSES = {
  ACTIVE: "active",
  HUMAN: "human",
  CLOSED: "closed",
};

export const CONVERSATION_CHANNELS = {
  WEB: "web",
};

const VALID_STATUSES = Object.values(CONVERSATION_STATUSES);

const VALID_CHANNELS = Object.values(CONVERSATION_CHANNELS);

export class Conversation {
  constructor({
    id = null,
    businessId,
    channel = CONVERSATION_CHANNELS.WEB,
    status = CONVERSATION_STATUSES.ACTIVE,
    visitorId,
    publicToken = null,
    createdAt = null,
    updatedAt = null,
  }) {
    if (!businessId) {
      throw new AppError("Conversation businessId is required", 400);
    }

    if (!visitorId) {
      throw new AppError("Conversation visitorId is required", 400);
    }

    if (!VALID_CHANNELS.includes(channel)) {
      throw new AppError(`Invalid conversation channel: ${channel}`, 400);
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid conversation status: ${status}`, 400);
    }

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
