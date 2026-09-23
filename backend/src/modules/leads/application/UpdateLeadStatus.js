import { AppError } from "../../../shared/errors/AppError.js";
import { LEAD_STATUSES } from "../domain/Lead.js";
const VALID_LEAD_STATUSES = Object.values(LEAD_STATUSES);
export class UpdateLeadStatus {
  constructor(leadRepository) {
    this.leadRepository = leadRepository;
  }
  async execute(leadId, status) {
    if (!leadId) {
      throw new AppError("Lead id is required", 400);
    }
    if (!VALID_LEAD_STATUSES.includes(status)) {
      throw new AppError(`Invalid lead status: ${status}`, 400);
    }
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new AppError("Lead not found", 404);
    }
    if (lead.status === status) {
      return lead;
    }
    return this.leadRepository.update(leadId, {
      ...lead,
      status,
    });
  }
}
