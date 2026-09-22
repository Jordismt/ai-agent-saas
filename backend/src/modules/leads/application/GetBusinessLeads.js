export class GetBusinessLeads {
  constructor(leadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute(businessId) {
    return this.leadRepository.findByBusinessId(businessId);
  }
}
