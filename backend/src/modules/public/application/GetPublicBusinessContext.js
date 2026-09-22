export class GetPublicBusinessContext {
  constructor({
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    businessAgentConfigRepository,
  }) {
    this.businessRepository = businessRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.businessAgentConfigRepository = businessAgentConfigRepository;
  }

  async execute(businessId) {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      return null;
    }

    const services = await this.businessServiceRepository.findByBusinessId(businessId);

    const businessHours = await this.businessHoursRepository.findByBusinessId(businessId);

    const agentConfig = await this.businessAgentConfigRepository.findByBusinessId(businessId);

    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

    return {
      id: business.id,
      name: business.name,
      description: business.description,
      phone: business.phone,
      address: business.address,

      opening_hours: businessHours.map((hours) => ({
        day_name: dayNames[hours.day_of_week],
        open_time: hours.open_time,
        close_time: hours.close_time,
        second_open_time: hours.second_open_time,
        second_close_time: hours.second_close_time,
        is_closed: hours.is_closed,
      })),

      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
      })),

      agent_config: agentConfig
        ? {
            system_instructions: agentConfig.system_instructions,
            welcome_message: agentConfig.welcome_message,
            tone: agentConfig.tone,
          }
        : {
            system_instructions: null,
            welcome_message: null,
            tone: "professional",
          },
    };
  }
}
