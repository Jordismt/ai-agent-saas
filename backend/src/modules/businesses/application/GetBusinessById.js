export class GetBusinessById {
  constructor(businessRepository) {
    this.businessRepository = businessRepository;
  }

  async execute(id) {
    return this.businessRepository.findById(id);
  }
}
