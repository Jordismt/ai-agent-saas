import { Lead } from "../domain/Lead.js";

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
      status: "new",
    });

    return this.leadRepository.create(lead);
  }
}
