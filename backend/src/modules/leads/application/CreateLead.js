import { Lead, LEAD_STATUSES } from "../domain/Lead.js";

export class CreateLead {
  constructor(leadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute({
    businessId,
    conversationId = null,
    name = null,
    phone = null,
    email = null,
    notes = null,
  }) {
    const lead = new Lead({
      businessId,
      conversationId,
      name,
      phone,
      email,
      notes,
      status: LEAD_STATUSES.NEW,
    });

    return this.leadRepository.create(lead);
  }
}
