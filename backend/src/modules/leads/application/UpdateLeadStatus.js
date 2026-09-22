import { AppError } from "../../../shared/errors/AppError.js";

export class UpdateLeadStatus {
  constructor(leadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute(leadId, status) {
    const lead = await this.leadRepository.findById(leadId);

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return this.leadRepository.update(leadId, {
      ...lead,
      status,
    });
  }
}
