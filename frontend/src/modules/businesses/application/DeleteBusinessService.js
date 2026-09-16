export class DeleteBusinessService {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute(businessId, serviceId) {
    return this.businessService.deleteBusinessService(businessId, serviceId);
  }
}
