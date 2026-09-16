export class DeleteBusinessService {
  constructor(businessServiceRepository) {
    this.businessServiceRepository = businessServiceRepository;
  }

  async execute(businessId, serviceId) {
    return this.businessServiceRepository.delete(businessId, serviceId);
  }
}
