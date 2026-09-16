export class CreateBusinessService {
  constructor(businessServiceRepository) {
    this.businessServiceRepository = businessServiceRepository;
  }

  async execute(businessId, serviceData) {
    return this.businessServiceRepository.create(businessId, serviceData);
  }
}
