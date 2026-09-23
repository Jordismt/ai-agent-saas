export class ConversationRepository {
  async create(_conversation) {
    throw new Error("Method not implemented");
  }

  async findById(_id) {
    throw new Error("Method not implemented");
  }

  async findByBusinessId(_businessId) {
    throw new Error("Method not implemented");
  }

  async updateStatus(_id, _status) {
    throw new Error("Method not implemented");
  }

  async findActiveByBusinessIdAndVisitorId(_businessId, _visitorId) {
    throw new Error("Method not implemented");
  }
}
