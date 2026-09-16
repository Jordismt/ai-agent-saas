export class GetBusinesses {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute() {
    return this.businessService.getBusinesses();
  }
}
