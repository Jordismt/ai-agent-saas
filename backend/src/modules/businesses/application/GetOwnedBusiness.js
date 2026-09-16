export class GetOwnedBusiness {
  constructor(businessRepository) {
    this.businessRepository = businessRepository;
  }

  async execute(businessId, ownerId) {
    const business = await this.businessRepository.findById(businessId);

    if (!business || business.owner_id !== ownerId) {
      return null;
    }

    return business;
  }
}
