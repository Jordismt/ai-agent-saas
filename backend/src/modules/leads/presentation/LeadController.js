import { CreateLead } from "../application/CreateLead.js";
import { GetBusinessLeads } from "../application/GetBusinessLeads.js";
import { createLeadSchema } from "../application/createLeadSchema.js";
import { UpdateLeadStatus } from "../application/UpdateLeadStatus.js";
import { updateLeadStatusSchema } from "../application/updateLeadStatusSchema.js";

export class LeadController {
  constructor({ leadRepository }) {
    this.createLead = new CreateLead(leadRepository);

    this.getBusinessLeads = new GetBusinessLeads(leadRepository);

    this.updateLeadStatus = new UpdateLeadStatus(leadRepository);
  }

  async create(req, res, next) {
    try {
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
      const leads = await this.getBusinessLeads.execute(req.params.businessId);

      return res.json(leads);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = updateLeadStatusSchema.parse(req.body);

      const lead = await this.updateLeadStatus.execute(req.params.id, status);

      return res.json(lead);
    } catch (error) {
      next(error);
    }
  }
}
