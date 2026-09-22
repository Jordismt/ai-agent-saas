import { AppError } from "../../../shared/errors/AppError.js";

export class GetOwnedBusinessAgentConfig {
  constructor({ getOwnedBusiness, getBusinessAgentConfig }) {
    this.getOwnedBusiness = getOwnedBusiness;

    this.getBusinessAgentConfig = getBusinessAgentConfig;
  }

  async execute(businessId, ownerId) {
    const business = await this.getOwnedBusiness.execute(businessId, ownerId);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    return this.getBusinessAgentConfig.execute(businessId);
  }
}
