import { GetBusinessAgentConfig } from "../application/GetBusinessAgentConfig.js";
import { GetOwnedBusiness } from "../application/GetOwnedBusiness.js";
import { GetOwnedBusinessAgentConfig } from "../application/GetOwnedBusinessAgentConfig.js";
import { UpdateBusinessAgentConfig } from "../application/UpdateBusinessAgentConfig.js";

import { updateBusinessAgentConfigSchema } from "./updateBusinessAgentConfigSchema.js";

export class BusinessAgentConfigController {
  constructor({ businessAgentConfigRepository, businessRepository }) {
    this.getBusinessAgentConfig = new GetBusinessAgentConfig(businessAgentConfigRepository);

    this.getOwnedBusiness = new GetOwnedBusiness(businessRepository);

    this.getOwnedBusinessAgentConfig = new GetOwnedBusinessAgentConfig({
      getOwnedBusiness: this.getOwnedBusiness,

      getBusinessAgentConfig: this.getBusinessAgentConfig,
    });

    this.updateBusinessAgentConfig = new UpdateBusinessAgentConfig(businessAgentConfigRepository);
  }

  async getByBusinessId(req, res, next) {
    try {
      const config = await this.getOwnedBusinessAgentConfig.execute(req.params.businessId, req.user.id);

      return res.json(
        config || {
          system_instructions: null,
          welcome_message: null,
          tone: "professional",
        },
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateBusinessAgentConfigSchema.parse(req.body);

      const business = await this.getOwnedBusiness.execute(req.params.businessId, req.user.id);

      if (!business) {
        return res.status(404).json({
          error: "Business not found",
        });
      }

      const config = await this.updateBusinessAgentConfig.execute(req.params.businessId, data);

      return res.json(config);
    } catch (error) {
      next(error);
    }
  }
}
