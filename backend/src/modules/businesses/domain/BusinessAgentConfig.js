export class BusinessAgentConfig {
  constructor({ id, businessId, systemInstructions = null, welcomeMessage = null, tone = "professional" }) {
    this.id = id;
    this.businessId = businessId;
    this.systemInstructions = systemInstructions;
    this.welcomeMessage = welcomeMessage;
    this.tone = tone;
  }
}
