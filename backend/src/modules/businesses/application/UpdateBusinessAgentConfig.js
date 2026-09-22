import { BusinessAgentConfig } from "../domain/BusinessAgentConfig.js";

export class UpdateBusinessAgentConfig {
  constructor(businessAgentConfigRepository) {
    this.businessAgentConfigRepository = businessAgentConfigRepository;
  }

  async execute(businessId, config) {
    const businessAgentConfig = new BusinessAgentConfig({
      businessId,
      systemInstructions: config.systemInstructions,
      welcomeMessage: config.welcomeMessage,
      tone: config.tone,
    });

    return this.businessAgentConfigRepository.upsert(businessAgentConfig);
  }
}
