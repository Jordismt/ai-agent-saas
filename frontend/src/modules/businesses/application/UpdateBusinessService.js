export class UpdateBusinessService {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute(businessId, serviceId, serviceData) {
    return this.businessService.updateBusinessService(
      businessId,
      serviceId,
      serviceData
    );
  }
}
