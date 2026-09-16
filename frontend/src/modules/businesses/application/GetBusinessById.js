export class GetBusinessById {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute(id) {
    return this.businessService.getBusinessById(id);
  }
}
