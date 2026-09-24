export class GetBusinessPublicPage {
  constructor(publicPageRepository) {
    this.publicPageRepository = publicPageRepository;
  }

  async execute(businessId) {
    return this.publicPageRepository.findByBusinessId(businessId);
  }
}
