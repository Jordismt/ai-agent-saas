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

    /*
     * Mientras la conversación esté en modo humano,
     * la IA NO puede generar ninguna respuesta.
     */
    if (conversation.status === "human") {
      throw new AppError("AI cannot respond while the conversation is handled by a human", 409);
    }

    if (!businessContext) {
      throw new AppError("Business context not found", 404);
    }

    /*
     * Primera llamada a la IA.
     *
     * Su trabajo aquí es interpretar el mensaje
     * y decidir si hace falta ejecutar una acción.
     *
     * Todavía NO guardamos ninguna respuesta.
     */
    const response = await this.aiService.generateResponse({
      businessContext,
      messages,
    });
    console.log("\n========== PARSED AI RESPONSE ==========");

    console.dir(response, {
      depth: null,
    });

    console.log("========================================\n");

    const action = response.action?.type || AGENT_ACTIONS.NONE;

    /*
     * Una respuesta sin acción puede guardarse
     * directamente.
     *
     * IMPORTANTE:
     * el prompt debe impedir que "none" se utilice
     * para inventar disponibilidad o confirmar reservas.
     */
    if (action === AGENT_ACTIONS.NONE) {
      return this.createAssistantMessage({
        conversationId,
        content: response.content,
      });
    }

    /*
     * Primero ejecutamos la acción REAL.
     *
     * La IA nunca puede confirmar una acción
     * antes de que este paso haya terminado.
     */
    const actionResult = await this.executeAgentAction({
      action,
      businessId: businessContext.id,
      conversationId,
      data: response.action?.data || {},
    });

    /*
     * Nunca enviamos directamente a la segunda
     * llamada de IA objetos internos completos.
     *
     * Esto evita:
     *
     * - exponer IDs internos
     * - exponer timestamps UTC
     * - confundir UTC con hora local
     * - enviar datos innecesarios
     * - aumentar tokens innecesariamente
     */
    const safeActionResult = this.buildSafeActionResult({
      action,
      actionResult,
      businessContext,
      actionData: response.action?.data || {},
    });
    console.log("\n========== ACTION RESULT REAL ==========");

    console.dir(actionResult, {
      depth: null,
    });

    console.log("\n========== SAFE ACTION RESULT ==========");

    console.dir(safeActionResult, {
      depth: null,
    });

    console.log("========================================\n");
    /*
     * Segunda llamada.
     *
     * Groq redacta una respuesta natural utilizando
     * únicamente el resultado seguro y REAL de la acción.
     */
    const finalContent = await this.aiService.generateFinalResponse({
      businessContext,
      messages,
      action,
      actionResult: safeActionResult,
    });

    /*
     * Solo después de ejecutar la acción y generar
     * la respuesta final guardamos el mensaje.
     */
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
      /*
       * Solo convertimos errores CONTROLADOS
       * del cliente/dominio (4xx).
       *
       * Ejemplos:
       *
       * - slot no disponible
       * - servicio inexistente
       * - datos incompletos
       * - fecha inválida
       *
       * La IA puede explicarlos al cliente.
       */
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        return {
          success: false,

          error: {
            message: error.message,
            statusCode: error.statusCode,
          },
        };
      }

      /*
       * Los errores 5xx o inesperados NO deben
       * convertirse en información para Groq.
       *
       * Son errores internos y deben propagarse
       * hasta nuestro errorHandler/logging.
       */
      throw error;
    }
  }

  buildSafeActionResult({ action, actionResult, businessContext, actionData = {} }) {
    /*
     * Si la acción no se pudo ejecutar,
     * conservamos únicamente la información
     * controlada del error.
     */
    if (!actionResult?.success) {
      return {
        success: false,

        error: {
          message: actionResult?.error?.message || "The action could not be completed",

          statusCode: actionResult?.error?.statusCode || 400,
        },
      };
    }

    /*
     * DISPONIBILIDAD
     */
    if (action === AGENT_ACTIONS.CHECK_AVAILABILITY) {
      return this.buildSafeAvailabilityResult(actionResult, actionData);
    }

    /*
     * RESERVA
     */
    if (action === AGENT_ACTIONS.CREATE_BOOKING) {
      return this.buildSafeBookingResult(actionResult, businessContext);
    }

    /*
     * HUMAN HANDOFF
     *
     * No necesitamos enviar la conversación
     * completa a Groq.
     */
    if (action === AGENT_ACTIONS.HUMAN_HANDOFF) {
      return {
        success: true,

        result: {
          transferred: true,
        },
      };
    }

    /*
     * LEAD
     *
     * Tampoco necesitamos enviar datos internos
     * del lead a la segunda llamada.
     */
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

    /*
     * Si la IA ha interpretado que el usuario pregunta
     * por una hora concreta, NO podemos perder esa hora
     * al crear la selección representativa.
     *
     * El backend sigue siendo la fuente de verdad.
     */
    if (requestedTime) {
      const exactSlot = slots.find((slot) => slot.localTime === requestedTime);

      return {
        success: true,

        result: {
          date: result.date || null,

          requestedTime,

          requestedTimeAvailable: Boolean(exactSlot),

          totalAvailableSlots: slots.length,

          /*
           * Damos también algunas alternativas por si
           * la hora solicitada no está disponible.
           */
          slots: this.selectRepresentativeSlots(slots, 8)
            .map((slot) => ({
              time: typeof slot.localTime === "string" ? slot.localTime : null,
            }))
            .filter((slot) => slot.time),
        },
      };
    }

    /*
     * Consulta general:
     *
     * "¿Qué huecos tenéis mañana?"
     *
     * Aquí sí tiene sentido mandar únicamente una
     * selección representativa para no llenar el
     * contexto con decenas de slots.
     */
    const visibleSlots = this.selectRepresentativeSlots(slots, 8);

    return {
      success: true,

      result: {
        date: result.date || null,

        totalAvailableSlots: slots.length,

        slots: visibleSlots
          .map((slot) => ({
            time: typeof slot.localTime === "string" ? slot.localTime : null,
          }))
          .filter((slot) => slot.time),
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

    /*
     * Booking puede ser una entidad de dominio
     * camelCase o un registro procedente de BD
     * snake_case.
     *
     * Soportamos ambos formatos.
     */
    const rawStartsAt = booking.startsAt ?? booking.starts_at ?? null;

    const rawEndsAt = booking.endsAt ?? booking.ends_at ?? null;

    const startsAt = this.parseDateTimeInBusinessTimezone(rawStartsAt, timezone);

    const endsAt = this.parseDateTimeInBusinessTimezone(rawEndsAt, timezone);

    /*
     * IMPORTANTE:
     *
     * A Groq NO le enviamos los timestamps UTC.
     *
     * Solo recibe la representación local que
     * puede mostrar directamente al cliente.
     *
     * Ejemplo:
     *
     * BD:
     * 2026-09-24T15:00:00Z
     *
     * Europe/Madrid:
     * 17:00
     */
    return {
      success: true,

      result: {
        serviceName: booking.serviceName ?? booking.service_name ?? null,

        date: startsAt?.toISODate() ?? null,

        startTime: startsAt?.toFormat("HH:mm") ?? null,

        endTime: endsAt?.toFormat("HH:mm") ?? null,

        price: booking.price ?? null,

        status: booking.status ?? null,
      },
    };
  }

  selectRepresentativeSlots(slots, limit = 8) {
    if (!Array.isArray(slots)) {
      return [];
    }

    if (slots.length <= limit) {
      return slots;
    }

    if (limit <= 1) {
      return [slots[0]];
    }

    /*
     * Distribuimos las opciones a lo largo
     * de todo el día.
     *
     * Así evitamos devolver únicamente las
     * primeras horas de la mañana.
     *
     * Ejemplo:
     *
     * 09:00
     * 10:00
     * 11:00
     * ...
     * 17:00
     */
    const selected = [];

    const step = (slots.length - 1) / (limit - 1);

    for (let index = 0; index < limit; index += 1) {
      const slotIndex = Math.round(index * step);

      const slot = slots[slotIndex];

      /*
       * Evitamos duplicados por redondeo.
       */
      if (slot && !selected.includes(slot)) {
        selected.push(slot);
      }
    }

    return selected;
  }

  parseDateTimeInBusinessTimezone(value, timezone) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    const dateTime = DateTime.fromISO(value, {
      setZone: true,
    }).setZone(timezone);

    if (!dateTime.isValid) {
      return null;
    }

    return dateTime;
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
