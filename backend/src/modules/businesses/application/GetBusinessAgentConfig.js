export class GetBusinessAgentConfig {
  constructor(businessAgentConfigRepository) {
    this.businessAgentConfigRepository = businessAgentConfigRepository;
  }

  async execute(businessId) {
    return this.businessAgentConfigRepository.findByBusinessId(businessId);
  }
}
