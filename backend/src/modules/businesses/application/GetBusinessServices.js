export class GetBusinessServices {
  constructor(businessServiceRepository) {
    this.businessServiceRepository = businessServiceRepository;
  }

  async execute(businessId) {
    return this.businessServiceRepository.findByBusinessId(businessId);
  }
}
