import { GetBusinessHours } from "../application/GetBusinessHours.js";
import { GetOwnedBusiness } from "../application/GetOwnedBusiness.js";
import { GetOwnedBusinessHours } from "../application/GetOwnedBusinessHours.js";
import { UpdateBusinessHours } from "../application/UpdateBusinessHours.js";

import { updateBusinessHoursSchema } from "./updateBusinessHoursSchema.js";

export class BusinessHoursController {
  constructor({ businessHoursRepository, businessRepository }) {
    this.getBusinessHours = new GetBusinessHours(businessHoursRepository);

    this.getOwnedBusinessHours = new GetOwnedBusinessHours({
      getOwnedBusiness: new GetOwnedBusiness(businessRepository),
      getBusinessHours: this.getBusinessHours,
    });

    this.updateBusinessHours = new UpdateBusinessHours(businessHoursRepository);

    this.getOwnedBusiness = new GetOwnedBusiness(businessRepository);
  }

  async getByBusinessId(req, res, next) {
    try {
      const hours = await this.getOwnedBusinessHours.execute(req.params.businessId, req.user.id);

      return res.json(hours);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateBusinessHoursSchema.parse(req.body);

      const business = await this.getOwnedBusiness.execute(req.params.businessId, req.user.id);

      if (!business) {
        return res.status(404).json({
          error: "Business not found",
        });
      }

      const hours = await this.updateBusinessHours.execute(req.params.businessId, data.hours);

      return res.json(hours);
    } catch (error) {
      next(error);
    }
  }
}
