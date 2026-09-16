import { CreateBusiness } from "../application/CreateBusiness.js";
import { GetBusinesses } from "../application/GetBusinesses.js";
import { GetBusinessServices } from "../application/GetBusinessServices.js";
import { CreateBusinessService } from "../application/CreateBusinessService.js";
import { DeleteBusinessService } from "../application/DeleteBusinessService.js";
import { UpdateBusinessService } from "../application/UpdateBusinessService.js";
import { GetOwnedBusiness } from "../application/GetOwnedBusiness.js";
import { GetOwnedBusinessOrThrow } from "../application/GetOwnedBusinessOrThrow.js";

import { createBusinessSchema } from "./createBusinessSchema.js";
import { createBusinessServiceSchema } from "./createBusinessServiceSchema.js";
import { updateBusinessServiceSchema } from "./updateBusinessServiceSchema.js";

export class BusinessController {
  constructor({ businessRepository, businessServiceRepository }) {
    this.createBusiness = new CreateBusiness(businessRepository);

    this.getBusinesses = new GetBusinesses(businessRepository);

    this.getOwnedBusinessOrThrow = new GetOwnedBusinessOrThrow(new GetOwnedBusiness(businessRepository));

    this.getBusinessServices = new GetBusinessServices(businessServiceRepository);

    this.createBusinessService = new CreateBusinessService(businessServiceRepository);

    this.deleteBusinessService = new DeleteBusinessService(businessServiceRepository);

    this.updateBusinessService = new UpdateBusinessService(businessServiceRepository);
  }

  async create(req, res, next) {
    try {
      const data = createBusinessSchema.parse(req.body);

      const business = await this.createBusiness.execute({
        ...data,
        ownerId: req.user.id,
      });

      return res.status(201).json(business);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const businesses = await this.getBusinesses.execute(req.user.id);

      return res.json(businesses);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const business = await this.getOwnedBusinessOrThrow.execute(req.params.id, req.user.id);

      return res.json(business);
    } catch (error) {
      next(error);
    }
  }

  async getServices(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.id, req.user.id);

      const services = await this.getBusinessServices.execute(req.params.id);

      return res.json(services);
    } catch (error) {
      next(error);
    }
  }

  async createService(req, res, next) {
    try {
      const data = createBusinessServiceSchema.parse(req.body);

      await this.getOwnedBusinessOrThrow.execute(req.params.id, req.user.id);

      const service = await this.createBusinessService.execute(req.params.id, data);

      return res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.id, req.user.id);

      const service = await this.deleteBusinessService.execute(req.params.id, req.params.serviceId);

      return res.json(service);
    } catch (error) {
      next(error);
    }
  }

  async updateService(req, res, next) {
    try {
      const data = updateBusinessServiceSchema.parse(req.body);

      await this.getOwnedBusinessOrThrow.execute(req.params.id, req.user.id);

      const service = await this.updateBusinessService.execute(req.params.id, req.params.serviceId, data);

      return res.json(service);
    } catch (error) {
      next(error);
    }
  }
}
