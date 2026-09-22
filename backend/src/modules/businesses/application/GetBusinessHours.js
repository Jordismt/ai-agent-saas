export class GetBusinessHours {
  constructor(businessHoursRepository) {
    this.businessHoursRepository = businessHoursRepository;
  }

  async execute(businessId) {
    return this.businessHoursRepository.findByBusinessId(businessId);
  }
}
