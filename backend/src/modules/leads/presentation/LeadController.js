import { CreateLead } from "../application/CreateLead.js";
import { GetBusinessLeads } from "../application/GetBusinessLeads.js";
import { UpdateLeadStatus } from "../application/UpdateLeadStatus.js";

import { GetOwnedBusiness } from "../../businesses/application/GetOwnedBusiness.js";
import { GetOwnedBusinessOrThrow } from "../../businesses/application/GetOwnedBusinessOrThrow.js";

import { createLeadSchema } from "../application/createLeadSchema.js";
import { updateLeadStatusSchema } from "../application/updateLeadStatusSchema.js";

import { AppError } from "../../../shared/errors/AppError.js";

export class LeadController {
  constructor({ leadRepository, businessRepository }) {
    this.leadRepository = leadRepository;

    this.createLead = new CreateLead(leadRepository);

    this.getBusinessLeads = new GetBusinessLeads(leadRepository);

    this.updateLeadStatus = new UpdateLeadStatus(leadRepository);

    const getOwnedBusiness = new GetOwnedBusiness(businessRepository);

    this.getOwnedBusinessOrThrow = new GetOwnedBusinessOrThrow(getOwnedBusiness);
  }

  async create(req, res, next) {
    try {
      /*
       * Antes de crear el lead comprobamos
       * que el negocio pertenece al usuario.
       */
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const data = createLeadSchema.parse({
        ...req.body,
        businessId: req.params.businessId,
      });

      const lead = await this.createLead.execute(data);

      return res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  }

  async getByBusinessId(req, res, next) {
    try {
      /*
       * El usuario solamente puede consultar
       * leads de negocios que le pertenecen.
       */
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const leads = await this.getBusinessLeads.execute(req.params.businessId);

      return res.json(leads);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = updateLeadStatusSchema.parse(req.body);

      /*
       * Primero buscamos el lead para conocer
       * a qué negocio pertenece.
       */
      const lead = await this.leadRepository.findById(req.params.id);

      if (!lead) {
        throw new AppError("Lead not found", 404);
      }

      /*
       * Después comprobamos que ese negocio
       * pertenece al usuario autenticado.
       */
      await this.getOwnedBusinessOrThrow.execute(lead.business_id, req.user.id);

      const updatedLead = await this.updateLeadStatus.execute(req.params.id, status);

      return res.json(updatedLead);
    } catch (error) {
      next(error);
    }
  }
}
