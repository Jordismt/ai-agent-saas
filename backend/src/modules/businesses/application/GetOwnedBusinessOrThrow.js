import { AppError } from "../../../shared/errors/AppError.js";

export class GetOwnedBusinessOrThrow {
  constructor(getOwnedBusiness) {
    this.getOwnedBusiness = getOwnedBusiness;
  }

  async execute(businessId, ownerId) {
    const business = await this.getOwnedBusiness.execute(businessId, ownerId);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    return business;
  }
}
