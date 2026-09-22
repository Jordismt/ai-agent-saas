export class GetPublicBusinessConfig {
  constructor({ businessRepository, businessAgentConfigRepository }) {
    this.businessRepository = businessRepository;
    this.businessAgentConfigRepository = businessAgentConfigRepository;
  }

  async execute(businessId) {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      return null;
    }

    const agentConfig = await this.businessAgentConfigRepository.findByBusinessId(businessId);

    return {
      id: business.id,
      name: business.name,
      description: business.description,
      phone: business.phone,
      address: business.address,

      welcome_message: agentConfig?.welcome_message || "Hola 👋 ¿En qué puedo ayudarte?",

      tone: agentConfig?.tone || "professional",
    };
  }
}
