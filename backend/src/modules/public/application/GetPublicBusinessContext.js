import { DateTime } from "luxon";

export class GetPublicBusinessContext {
  constructor({
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    businessAgentConfigRepository,
    employeeRepository,
  }) {
    this.businessRepository = businessRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.businessAgentConfigRepository = businessAgentConfigRepository;
    this.employeeRepository = employeeRepository;
  }

  async execute(businessId) {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      return null;
    }

    const [services, businessHours, agentConfig, employees] = await Promise.all([
      this.businessServiceRepository.findByBusinessId(businessId),
      this.businessHoursRepository.findByBusinessId(businessId),
      this.businessAgentConfigRepository.findByBusinessId(businessId),
      this.employeeRepository.findByBusinessId(businessId),
    ]);

    const activeEmployees = (employees || []).filter((employee) => employee.active);

    /*
     * Para el LLM solo necesitamos saber qué empleado existe
     * y qué servicios puede realizar.
     *
     * Horarios, vacaciones, reservas y conflictos NO se mandan
     * al modelo: GetAvailableSlots es la fuente de verdad.
     */
    const employeesWithServices = await Promise.all(
      activeEmployees.map(async (employee) => {
        const employeeServices = await this.employeeRepository.getServices(employee.id);

        return {
          id: employee.id,
          name: employee.name,
          service_ids: employeeServices.map((service) => service.id),
        };
      }),
    );

    const dayNames = [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];

    const timezone = business.timezone || "Europe/Madrid";

    let now = DateTime.now().setZone(timezone);

    if (!now.isValid) {
      now = DateTime.now().setZone("Europe/Madrid");
    }

    return {
      id: business.id,
      name: business.name,
      description: business.description,
      phone: business.phone,
      address: business.address,
      timezone: now.zoneName,

      current_datetime: {
        date: now.toISODate(),
        time: now.toFormat("HH:mm"),
        weekday: now.setLocale("es").toFormat("cccc"),
      },

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

      employees: employeesWithServices,

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
