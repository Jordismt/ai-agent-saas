export class UpdateBusinessService {
  constructor(businessServiceRepository) {
    this.businessServiceRepository = businessServiceRepository;
  }

  async execute(businessId, serviceId, serviceData) {
    return this.businessServiceRepository.update(businessId, serviceId, serviceData);
  }
}
