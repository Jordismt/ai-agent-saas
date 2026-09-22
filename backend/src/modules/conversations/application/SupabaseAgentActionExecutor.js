import { AgentActionExecutor } from "./AgentActionExecutor.js";

import { CreateLead } from "../../leads/application/CreateLead.js";

import { AppError } from "../../../shared/errors/AppError.js";

import { AGENT_ACTIONS } from "../domain/AgentAction.js";

export class SupabaseAgentActionExecutor extends AgentActionExecutor {
  constructor({ leadRepository, conversationRepository }) {
    super();

    this.leadRepository = leadRepository;

    this.conversationRepository = conversationRepository;

    this.createLead = new CreateLead(leadRepository);
  }

  async execute({ action, businessId, conversationId, data = {} }) {
    switch (action) {
      case AGENT_ACTIONS.NONE:
        return {
          action: AGENT_ACTIONS.NONE,
          result: null,
        };

      case AGENT_ACTIONS.CREATE_LEAD: {
        const existingLeads = await this.leadRepository.findByConversationId(conversationId);

        const existingLead = existingLeads[0] || null;

        if (existingLead) {
          const updatedLead = {
            ...existingLead,

            name: data.name || existingLead.name || null,

            phone: data.phone || existingLead.phone || null,

            email: data.email || existingLead.email || null,

            notes: data.notes || existingLead.notes || null,

            status: existingLead.status || "new",
          };

          const lead = await this.leadRepository.update(existingLead.id, updatedLead);

          return {
            action: AGENT_ACTIONS.CREATE_LEAD,
            result: lead,
          };
        }

        const lead = await this.createLead.execute({
          businessId,
          conversationId,
          name: data.name || null,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
        });

        return {
          action: AGENT_ACTIONS.CREATE_LEAD,
          result: lead,
        };
      }

      case AGENT_ACTIONS.HUMAN_HANDOFF: {
        const conversation = await this.conversationRepository.updateStatus(conversationId, "human");

        return {
          action: AGENT_ACTIONS.HUMAN_HANDOFF,
          result: conversation,
        };
      }

      default:
        throw new AppError(`Unsupported agent action: ${action}`, 400);
    }
  }
}
