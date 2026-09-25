import { requireActiveBusiness } from "../../../shared/billing/requireActiveBusiness.js";
import { AgentActionExecutor } from "./AgentActionExecutor.js";

import { CreateLead } from "../../leads/application/CreateLead.js";

import { CreateBooking } from "../../bookings/application/CreateBooking.js";

import { GetAvailableSlots } from "../../bookings/application/GetAvailableSlots.js";

import { ResendEmailService } from "../../notifications/infrastructure/ResendEmailService.js";

import { SendBookingConfirmation } from "../../notifications/application/SendBookingConfirmation.js";

import { AppError } from "../../../shared/errors/AppError.js";

import { AGENT_ACTIONS } from "../domain/AgentAction.js";

import { CONVERSATION_STATUSES } from "../domain/Conversation.js";

export class SupabaseAgentActionExecutor extends AgentActionExecutor {
  constructor({
    leadRepository,
    conversationRepository,
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  }) {
    super();

    this.leadRepository = leadRepository;
    this.conversationRepository = conversationRepository;
    this.bookingRepository = bookingRepository;
    this.businessRepository = businessRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.employeeRepository = employeeRepository;

    this.createLead = new CreateLead(leadRepository);

    this.getAvailableSlots = new GetAvailableSlots({
      bookingRepository,
      businessServiceRepository,
      businessHoursRepository,
      businessRepository,
      employeeRepository,
    });

    /*
     * Servicio de correo para confirmaciones de reserva.
     *
     * El agente crea reservas directamente mediante CreateBooking,
     * por lo que también necesita recibir SendBookingConfirmation.
     */
    const emailService = new ResendEmailService();

    const sendBookingConfirmation = new SendBookingConfirmation(emailService);

    this.createBooking = new CreateBooking({
      bookingRepository,
      businessRepository,
      businessServiceRepository,
      conversationRepository,
      leadRepository,
      employeeRepository,
      getAvailableSlots: this.getAvailableSlots,
      sendBookingConfirmation,
    });
  }

  async execute({ action, businessId, conversationId, data = {} }) {
    await requireActiveBusiness(businessId);
    switch (action) {
      case AGENT_ACTIONS.NONE:
        return {
          action: AGENT_ACTIONS.NONE,
          result: null,
        };

      case AGENT_ACTIONS.CREATE_LEAD:
        return this.handleCreateLead({
          businessId,
          conversationId,
          data,
        });

      case AGENT_ACTIONS.HUMAN_HANDOFF:
        return this.handleHumanHandoff({
          conversationId,
        });

      case AGENT_ACTIONS.CHECK_AVAILABILITY:
        return this.handleCheckAvailability({
          businessId,
          data,
        });

      case AGENT_ACTIONS.CREATE_BOOKING:
        return this.handleCreateBooking({
          businessId,
          conversationId,
          data,
        });

      default:
        throw new AppError(`Unsupported agent action: ${action}`, 400);
    }
  }

  async handleCreateLead({ businessId, conversationId, data }) {
    if (!businessId) {
      throw new AppError("Business id is required to create a lead", 400);
    }

    if (!conversationId) {
      throw new AppError("Conversation id is required to create a lead", 400);
    }

    const existingLeads = await this.leadRepository.findByConversationId(conversationId);

    const existingLead = existingLeads?.[0] || null;

    if (existingLead) {
      if (existingLead.business_id !== businessId) {
        throw new AppError("Lead does not belong to this business", 403);
      }

      const updatedLead = {
        ...existingLead,
        name: this.getNewValue(data.name, existingLead.name),
        phone: this.getNewValue(data.phone, existingLead.phone),
        email: this.getNewValue(data.email, existingLead.email),
        notes: this.getNewValue(data.notes, existingLead.notes),
        status: existingLead.status || "new",
      };

      const lead = await this.leadRepository.update(existingLead.id, updatedLead);

      return {
        action: AGENT_ACTIONS.CREATE_LEAD,
        result: lead,
      };
    }

    const phone = this.normalizeOptionalValue(data.phone);
    const email = this.normalizeOptionalValue(data.email);

    if (!phone && !email) {
      throw new AppError("A lead requires at least a phone or email", 400);
    }

    const lead = await this.createLead.execute({
      businessId,
      conversationId,
      name: this.normalizeOptionalValue(data.name),
      phone,
      email,
      notes: this.normalizeOptionalValue(data.notes),
    });

    return {
      action: AGENT_ACTIONS.CREATE_LEAD,
      result: lead,
    };
  }

  async handleHumanHandoff({ conversationId }) {
    if (!conversationId) {
      throw new AppError("Conversation id is required for human handoff", 400);
    }

    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.status === CONVERSATION_STATUSES.CLOSED) {
      throw new AppError("Cannot transfer a closed conversation to a human", 409);
    }

    if (conversation.status === CONVERSATION_STATUSES.HUMAN) {
      return {
        action: AGENT_ACTIONS.HUMAN_HANDOFF,
        result: conversation,
      };
    }

    const updatedConversation = await this.conversationRepository.updateStatus(
      conversationId,
      CONVERSATION_STATUSES.HUMAN,
    );

    return {
      action: AGENT_ACTIONS.HUMAN_HANDOFF,
      result: updatedConversation,
    };
  }

  async handleCheckAvailability({ businessId, data }) {
    if (!businessId) {
      throw new AppError("Business id is required to check availability", 400);
    }

    if (!data.serviceId) {
      throw new AppError("Service id is required to check availability", 400);
    }

    if (!data.date) {
      throw new AppError("Date is required to check availability", 400);
    }

    const slots = await this.getAvailableSlots.execute({
      businessId,
      serviceId: data.serviceId,
      date: data.date,
      employeeId: data.employeeId || null,
    });

    return {
      action: AGENT_ACTIONS.CHECK_AVAILABILITY,
      result: {
        serviceId: data.serviceId,
        date: data.date,
        employeeId: data.employeeId || null,
        slots,
      },
    };
  }

  async handleCreateBooking({ businessId, conversationId, data }) {
    if (!businessId) {
      throw new AppError("Business id is required to create a booking", 400);
    }

    if (!conversationId) {
      throw new AppError("Conversation id is required to create a booking", 400);
    }

    if (!data.serviceId) {
      throw new AppError("Service id is required to create a booking", 400);
    }

    if (!data.date) {
      throw new AppError("Date is required to create a booking", 400);
    }

    if (!data.time) {
      throw new AppError("Time is required to create a booking", 400);
    }

    if (!data.customerName?.trim()) {
      throw new AppError("Customer name is required to create a booking", 400);
    }

    const customerPhone = this.normalizeOptionalValue(data.customerPhone);

    const customerEmail = this.normalizeOptionalValue(data.customerEmail);

    /*
     * El email es obligatorio para las reservas.
     *
     * Lo necesitamos para:
     * - confirmación
     * - cancelación
     * - modificación
     * - recordatorios
     */
    if (!customerEmail) {
      throw new AppError("Customer email is required to create a booking", 400);
    }

    const existingLeads = await this.leadRepository.findByConversationId(conversationId);

    const existingLead = existingLeads?.[0] || null;

    if (existingLead && existingLead.business_id !== businessId) {
      throw new AppError("Lead does not belong to this business", 403);
    }

    const booking = await this.createBooking.execute({
      businessId,
      serviceId: data.serviceId,
      employeeId: data.employeeId || null,
      conversationId,
      leadId: existingLead?.id || null,
      customerName: data.customerName.trim(),
      customerPhone,
      customerEmail,
      date: data.date,
      time: data.time,
      notes: this.normalizeOptionalValue(data.notes),
    });

    return {
      action: AGENT_ACTIONS.CREATE_BOOKING,
      result: booking,
    };
  }

  normalizeOptionalValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  getNewValue(newValue, currentValue) {
    const normalized = this.normalizeOptionalValue(newValue);

    if (normalized !== null) {
      return normalized;
    }

    return currentValue || null;
  }
}
