export class Lead {
  constructor({
    id,
    businessId,
    conversationId = null,
    name = null,
    phone = null,
    email = null,
    notes = null,
    status = "new",
  }) {
    this.id = id;
    this.businessId = businessId;
    this.conversationId = conversationId;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.notes = notes;
    this.status = status;
  }
}
