export class CreateBusiness {
  constructor(businessService) {
    this.businessService = businessService;
  }

  async execute(businessData) {
    return this.businessService.createBusiness(businessData);
  }
}
