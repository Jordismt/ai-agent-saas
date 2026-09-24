import { DateTime } from "luxon";

import { AppError } from "../../../shared/errors/AppError.js";
import { AGENT_ACTIONS } from "../../conversations/domain/AgentAction.js";

export class GeneratePublicAIResponse {
  constructor({ messageRepository, conversationRepository, aiService, agentActionExecutor }) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
    this.aiService = aiService;
    this.agentActionExecutor = agentActionExecutor;
  }

  async execute({ conversationId, messages, businessContext }) {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.status === "closed") {
      throw new AppError("This conversation is closed", 409);
    }

    if (conversation.status === "human") {
      throw new AppError("AI cannot respond while the conversation is handled by a human", 409);
    }

    if (!businessContext) {
      throw new AppError("Business context not found", 404);
    }

    /*
     * ÚNICA llamada normal al LLM:
     * interpretar lenguaje + producir action/data.
     */
    const response = await this.aiService.generateResponse({
      businessContext,
      messages,
    });

    console.log("[AI decision]", JSON.stringify(response, null, 2));

    const action = response.action?.type || AGENT_ACTIONS.NONE;

    if (action === AGENT_ACTIONS.NONE) {
      return this.createAssistantMessage({
        conversationId,
        content: response.content,
      });
    }

    const actionData = response.action?.data || {};

    const actionResult = await this.executeAgentAction({
      action,
      businessId: businessContext.id,
      conversationId,
      data: actionData,
    });
    console.log("[ACTION result]", JSON.stringify(actionResult, null, 2));
    const safeActionResult = this.buildSafeActionResult({
      action,
      actionResult,
      businessContext,
      actionData,
    });

    /*
     * OPTIMIZACIÓN:
     * no hacemos una segunda llamada a Groq.
     * El backend ya conoce el resultado real y puede redactar
     * de forma determinista las acciones soportadas.
     */
    const finalContent = this.buildDeterministicFinalResponse({
      action,
      actionResult: safeActionResult,
      actionData,
    });

    return this.createAssistantMessage({
      conversationId,
      content: finalContent,
    });
  }

  async executeAgentAction({ action, businessId, conversationId, data }) {
    try {
      const execution = await this.agentActionExecutor.execute({
        action,
        businessId,
        conversationId,
        data,
      });

      return {
        success: true,
        result: execution?.result ?? null,
      };
    } catch (error) {
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        return {
          success: false,
          error: {
            message: error.message,
            statusCode: error.statusCode,
          },
        };
      }

      throw error;
    }
  }

  buildSafeActionResult({ action, actionResult, businessContext, actionData = {} }) {
    if (!actionResult?.success) {
      return {
        success: false,
        error: {
          message: actionResult?.error?.message || "The action could not be completed",
          statusCode: actionResult?.error?.statusCode || 400,
        },
      };
    }

    if (action === AGENT_ACTIONS.CHECK_AVAILABILITY) {
      return this.buildSafeAvailabilityResult(actionResult, actionData);
    }

    if (action === AGENT_ACTIONS.CREATE_BOOKING) {
      return this.buildSafeBookingResult(actionResult, businessContext);
    }

    if (action === AGENT_ACTIONS.HUMAN_HANDOFF) {
      return {
        success: true,
        result: {
          transferred: true,
        },
      };
    }

    if (action === AGENT_ACTIONS.CREATE_LEAD) {
      return {
        success: true,
        result: {
          saved: true,
        },
      };
    }

    return {
      success: true,
      result: null,
    };
  }

  buildSafeAvailabilityResult(actionResult, actionData = {}) {
    const result = actionResult.result || {};
    const slots = Array.isArray(result.slots) ? result.slots : [];

    const requestedTime = typeof actionData.time === "string" ? actionData.time.trim() : null;

    if (requestedTime) {
      const exactSlot = slots.find((slot) => slot.localTime === requestedTime);

      return {
        success: true,
        result: {
          date: result.date || actionData.date || null,
          requestedTime,
          requestedTimeAvailable: Boolean(exactSlot),
          totalAvailableSlots: slots.length,
          requestedEmployeeId: actionData.employeeId || null,
          availableEmployees: exactSlot ? this.sanitizeEmployees(exactSlot.employees) : [],
          slots: this.selectRepresentativeSlots(slots, 6)
            .map((slot) => this.sanitizeSlot(slot))
            .filter(Boolean),
        },
      };
    }

    return {
      success: true,
      result: {
        date: result.date || actionData.date || null,
        totalAvailableSlots: slots.length,
        requestedEmployeeId: actionData.employeeId || null,
        slots: this.selectRepresentativeSlots(slots, 6)
          .map((slot) => this.sanitizeSlot(slot))
          .filter(Boolean),
      },
    };
  }

  buildSafeBookingResult(actionResult, businessContext) {
    const booking = actionResult.result;

    if (!booking) {
      return {
        success: true,
        result: null,
      };
    }

    const timezone = businessContext.timezone || "Europe/Madrid";
    const rawStartsAt = booking.startsAt ?? booking.starts_at ?? null;
    const rawEndsAt = booking.endsAt ?? booking.ends_at ?? null;

    const startsAt = this.parseDateTimeInBusinessTimezone(rawStartsAt, timezone);
    const endsAt = this.parseDateTimeInBusinessTimezone(rawEndsAt, timezone);

    return {
      success: true,
      result: {
        serviceName: booking.serviceName ?? booking.service_name ?? null,
        employeeName: booking.employeeName ?? booking.employee_name ?? booking.employee?.name ?? null,
        date: startsAt?.toISODate() ?? null,
        startTime: startsAt?.toFormat("HH:mm") ?? null,
        endTime: endsAt?.toFormat("HH:mm") ?? null,
        price: booking.price ?? null,
        status: booking.status ?? null,
      },
    };
  }

  sanitizeSlot(slot) {
    if (!slot || typeof slot.localTime !== "string") {
      return null;
    }

    return {
      time: slot.localTime,
      employees: this.sanitizeEmployees(slot.employees),
    };
  }

  sanitizeEmployees(employees) {
    if (!Array.isArray(employees)) {
      return [];
    }

    return employees
      .filter((employee) => employee && employee.name)
      .map((employee) => ({
        name: employee.name,
      }));
  }

  selectRepresentativeSlots(slots, limit = 6) {
    if (!Array.isArray(slots)) {
      return [];
    }

    if (slots.length <= limit) {
      return slots;
    }

    if (limit <= 1) {
      return [slots[0]];
    }

    const selected = [];
    const step = (slots.length - 1) / (limit - 1);

    for (let index = 0; index < limit; index += 1) {
      const slotIndex = Math.round(index * step);
      const slot = slots[slotIndex];

      if (slot && !selected.includes(slot)) {
        selected.push(slot);
      }
    }

    return selected;
  }

  buildDeterministicFinalResponse({ action, actionResult }) {
    if (!actionResult?.success) {
      return this.buildControlledErrorResponse(action, actionResult?.error);
    }

    if (action === AGENT_ACTIONS.CHECK_AVAILABILITY) {
      return this.buildAvailabilityResponse(actionResult.result);
    }

    if (action === AGENT_ACTIONS.CREATE_BOOKING) {
      return this.buildBookingResponse(actionResult.result);
    }

    if (action === AGENT_ACTIONS.HUMAN_HANDOFF) {
      return "Te paso con una persona del equipo para que pueda ayudarte.";
    }

    if (action === AGENT_ACTIONS.CREATE_LEAD) {
      return "Perfecto, he guardado tus datos. ¿En qué más puedo ayudarte?";
    }

    return "De acuerdo.";
  }

  buildAvailabilityResponse(result = {}) {
    if (result.requestedTime) {
      if (result.requestedTimeAvailable) {
        const employeeText = this.formatEmployeeNames(result.availableEmployees);

        return employeeText
          ? `Sí, las ${result.requestedTime} están disponibles con ${employeeText}.`
          : `Sí, las ${result.requestedTime} están disponibles.`;
      }

      const alternatives = (result.slots || [])
        .map((slot) => slot.time)
        .filter(Boolean)
        .slice(0, 4);

      if (alternatives.length) {
        return `Las ${result.requestedTime} no están disponibles. Como alternativa, hay hueco a las ${this.joinNatural(alternatives)}.`;
      }

      return `Las ${result.requestedTime} no están disponibles y no quedan otros huecos para esa fecha.`;
    }

    const slots = Array.isArray(result.slots) ? result.slots : [];

    if (!slots.length) {
      return "No hay disponibilidad para esa fecha.";
    }

    const descriptions = slots.map((slot) => {
      const employeeText = this.formatEmployeeNames(slot.employees);

      return employeeText ? `${slot.time} (${employeeText})` : slot.time;
    });

    return `Hay disponibilidad a las ${this.joinNatural(descriptions)}.`;
  }

  buildBookingResponse(result = {}) {
    if (!result) {
      return "La reserva se ha realizado correctamente.";
    }

    const parts = [];

    if (result.serviceName) {
      parts.push(`para ${result.serviceName}`);
    }

    if (result.date && result.startTime) {
      parts.push(`el ${result.date} a las ${result.startTime}`);
    } else if (result.startTime) {
      parts.push(`a las ${result.startTime}`);
    }

    if (result.employeeName) {
      parts.push(`con ${result.employeeName}`);
    }

    const detail = parts.length ? ` ${parts.join(" ")}` : "";

    return `Perfecto, tu reserva${detail} está confirmada.`;
  }

  buildControlledErrorResponse(action, error = {}) {
    const message = String(error.message || "").toLowerCase();

    if (action === AGENT_ACTIONS.CREATE_BOOKING) {
      if (
        message.includes("available") ||
        message.includes("availability") ||
        message.includes("conflict") ||
        message.includes("slot")
      ) {
        return "Ese horario ya no está disponible. Podemos probar con otra hora.";
      }

      if (message.includes("employee")) {
        return "No se ha podido hacer la reserva con ese empleado. Podemos elegir otro profesional u horario.";
      }

      return "No he podido completar la reserva con esos datos. Podemos revisar el horario e intentarlo de nuevo.";
    }

    if (action === AGENT_ACTIONS.CHECK_AVAILABILITY) {
      return "No he podido consultar esa disponibilidad. Revisa el servicio, el empleado o la fecha e inténtalo de nuevo.";
    }

    if (action === AGENT_ACTIONS.HUMAN_HANDOFF) {
      return "No he podido transferir la conversación en este momento.";
    }

    return "No he podido completar esa acción en este momento.";
  }

  formatEmployeeNames(employees) {
    const names = (employees || []).map((employee) => employee?.name).filter(Boolean);

    return this.joinNatural(names);
  }

  joinNatural(values) {
    if (!values.length) {
      return "";
    }

    if (values.length === 1) {
      return values[0];
    }

    if (values.length === 2) {
      return `${values[0]} y ${values[1]}`;
    }

    return `${values.slice(0, -1).join(", ")} y ${values.at(-1)}`;
  }

  parseDateTimeInBusinessTimezone(value, timezone) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    const dateTime = DateTime.fromISO(value, {
      setZone: true,
    }).setZone(timezone);

    return dateTime.isValid ? dateTime : null;
  }

  async createAssistantMessage({ conversationId, content }) {
    if (typeof content !== "string" || !content.trim()) {
      throw new AppError("AI generated an empty response", 500);
    }

    return this.messageRepository.create({
      conversationId,
      role: "assistant",
      content: content.trim(),
    });
  }
}
