export class GetBusinessServices {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute(businessId) {
    return this.businessService.getBusinessServices(businessId);
  }
}
