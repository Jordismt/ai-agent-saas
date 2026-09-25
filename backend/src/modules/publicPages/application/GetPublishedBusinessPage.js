export class GetPublishedBusinessPage {
  constructor({
    publicPageRepository,
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  }) {
    this.publicPageRepository = publicPageRepository;

    this.businessRepository = businessRepository;

    this.businessServiceRepository = businessServiceRepository;

    this.businessHoursRepository = businessHoursRepository;

    this.employeeRepository = employeeRepository;
  }

  async execute(slug) {
    const page = await this.publicPageRepository.findBySlug(slug);

    if (!page) {
      return null;
    }

    const business = await this.businessRepository.findById(page.business_id);

    if (!business) {
      return null;
    }

    const [services, businessHours, employees] = await Promise.all([
      this.businessServiceRepository.findByBusinessId(business.id),

      this.businessHoursRepository.findByBusinessId(business.id),

      this.employeeRepository.findByBusinessId(business.id),
    ]);

    const activeEmployees = (employees || []).filter((employee) => employee.active);

    let publicEmployees = [];

    if (page.show_team) {
      publicEmployees = await Promise.all(
        activeEmployees.map(async (employee) => {
          const employeeServices = await this.employeeRepository.getServices(employee.id);

          return {
            id: employee.id,
            name: employee.name,

            services: employeeServices.map((service) => ({
              id: service.id,
              name: service.name,
            })),
          };
        }),
      );
    }

    return {
      business: {
        id: business.id,
        name: business.name,
        description: business.description ?? null,
        phone: business.phone ?? null,
        address: business.address ?? null,
        timezone: business.timezone || "Europe/Madrid",
      },

      page: {
        slug: page.slug,

        headline: page.headline,
        description: page.description,
        about: page.about,

        logo_url: page.logo_url,
        cover_image_url: page.cover_image_url,

        public_phone: page.public_phone,
        public_email: page.public_email,
        public_address: page.public_address,

        instagram_url: page.instagram_url,

        facebook_url: page.facebook_url,

        tiktok_url: page.tiktok_url,

        website_url: page.website_url,

        maps_url: page.maps_url,

        theme_primary: page.theme_primary,
        theme_secondary: page.theme_secondary,
        theme_background: page.theme_background,
        theme_surface: page.theme_surface,
        theme_text: page.theme_text,
        theme_font: page.theme_font,
        theme_radius: page.theme_radius,
        theme_button_style: page.theme_button_style,
        show_services: page.show_services,

        show_team: page.show_team,

        show_hours: page.show_hours,

        show_about: page.show_about,

        show_contact: page.show_contact,
      },

      services: page.show_services
        ? (services || []).map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration_minutes: service.duration_minutes,
          }))
        : [],

      employees: publicEmployees,

      opening_hours: page.show_hours
        ? (businessHours || []).map((hours) => ({
            day_of_week: hours.day_of_week,

            open_time: hours.open_time,

            close_time: hours.close_time,

            second_open_time: hours.second_open_time,

            second_close_time: hours.second_close_time,

            is_closed: hours.is_closed,
          }))
        : [],
    };
  }
}
