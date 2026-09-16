export class CreateBusinessService {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute(businessId, serviceData) {
    return this.businessService.createBusinessService(businessId, serviceData);
  }
}
