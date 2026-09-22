import { AppError } from "../../../shared/errors/AppError.js";

export class GetOwnedBusinessHours {
  constructor({ getOwnedBusiness, getBusinessHours }) {
    this.getOwnedBusiness = getOwnedBusiness;
    this.getBusinessHours = getBusinessHours;
  }

  async execute(businessId, ownerId) {
    const business = await this.getOwnedBusiness.execute(businessId, ownerId);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    return this.getBusinessHours.execute(businessId);
  }
}
