import { AppError } from "../../../shared/errors/AppError.js";

export class GetBusinessLeads {
  constructor(leadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute(businessId) {
    if (!businessId) {
      throw new AppError("Business id is required", 400);
    }

    return this.leadRepository.findByBusinessId(businessId);
  }
}
