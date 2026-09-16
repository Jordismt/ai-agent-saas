export class GetBusinesses {
  constructor(businessRepository) {
    this.businessRepository = businessRepository;
  }

  async execute(ownerId) {
    return this.businessRepository.findByOwnerId(ownerId);
  }
}
