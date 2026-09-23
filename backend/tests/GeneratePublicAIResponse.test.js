import { describe, it, expect, vi } from "vitest";

import { GeneratePublicAIResponse } from "../src/modules/public/application/GeneratePublicAIResponse.js";
import { AppError } from "../src/shared/errors/AppError.js";

describe("GeneratePublicAIResponse", () => {
  const businessContext = {
    id: "business-123",
    name: "Peluquería Test",
    timezone: "Europe/Madrid",
    services: [],
    opening_hours: [],
    agent_config: {},
  };

  const messages = [
    {
      role: "user",
      content: "Hola",
    },
  ];

  function createDependencies({
    conversation = {
      id: "conversation-123",
      status: "active",
    },

    aiResponse = {
      content: "¡Hola! ¿En qué puedo ayudarte?",

      action: {
        type: "none",
        data: {},
      },
    },

    finalResponse = "Respuesta final",

    actionExecution = {
      action: "none",
      result: null,
    },
  } = {}) {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue(conversation),
    };

    const aiService = {
      generateResponse: vi.fn().mockResolvedValue(aiResponse),

      generateFinalResponse: vi.fn().mockResolvedValue(finalResponse),
    };

    const messageRepository = {
      create: vi.fn().mockImplementation(async ({ conversationId, role, content }) => ({
        id: "assistant-message-123",
        conversation_id: conversationId,
        role,
        content,
      })),
    };

    const agentActionExecutor = {
      execute: vi.fn().mockResolvedValue(actionExecution),
    };

    const useCase = new GeneratePublicAIResponse({
      messageRepository,
      conversationRepository,
      aiService,
      agentActionExecutor,
    });

    return {
      useCase,
      conversationRepository,
      aiService,
      messageRepository,
      agentActionExecutor,
    };
  }

  it("should generate and save a normal AI response without executing an action", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies();

    const result = await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(aiService.generateResponse).toHaveBeenCalledWith({
      businessContext,
      messages,
    });

    /*
     * NONE no necesita ejecutar ninguna
     * acción ni una segunda llamada a Groq.
     */
    expect(agentActionExecutor.execute).not.toHaveBeenCalled();

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledOnce();

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "¡Hola! ¿En qué puedo ayudarte?",
    });

    expect(result.content).toBe("¡Hola! ¿En qué puedo ayudarte?");
  });

  it("should execute create_lead before generating and saving the final response", async () => {
    const lead = {
      id: "lead-123",
      business_id: "business-123",
      conversation_id: "conversation-123",
      name: "Jordi",
      phone: "600123123",
      email: null,
      notes: "Interesado en corte de pelo",
      status: "new",
    };

    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        /*
         * Este contenido es provisional.
         * NO debe guardarse.
         */
        content: "Perfecto, he guardado tus datos.",

        action: {
          type: "create_lead",

          data: {
            name: "Jordi",
            phone: "600123123",
            email: null,
            notes: "Interesado en corte de pelo",
          },
        },
      },

      actionExecution: {
        action: "create_lead",
        result: lead,
      },

      finalResponse: "Perfecto, Jordi. ¿En qué más puedo ayudarte?",
    });

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(agentActionExecutor.execute).toHaveBeenCalledWith({
      action: "create_lead",
      businessId: "business-123",
      conversationId: "conversation-123",

      data: {
        name: "Jordi",
        phone: "600123123",
        email: null,
        notes: "Interesado en corte de pelo",
      },
    });

    /*
     * La segunda llamada NO recibe el lead
     * completo ni IDs/datos internos.
     */
    expect(aiService.generateFinalResponse).toHaveBeenCalledWith({
      businessContext,
      messages,
      action: "create_lead",

      actionResult: {
        success: true,

        result: {
          saved: true,
        },
      },
    });

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "Perfecto, Jordi. ¿En qué más puedo ayudarte?",
    });

    /*
     * La respuesta provisional de la
     * primera llamada NO se guarda.
     */
    expect(messageRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Perfecto, he guardado tus datos.",
      }),
    );
  });

  it("should execute human_handoff before saving the final response", async () => {
    const transferredConversation = {
      id: "conversation-123",
      status: "human",
    };

    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        content: "Voy a pasarte con una persona.",

        action: {
          type: "human_handoff",
          data: {},
        },
      },

      actionExecution: {
        action: "human_handoff",
        result: transferredConversation,
      },

      finalResponse: "De acuerdo. Voy a pasar la conversación a una persona del equipo.",
    });

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(agentActionExecutor.execute).toHaveBeenCalledWith({
      action: "human_handoff",
      businessId: "business-123",
      conversationId: "conversation-123",
      data: {},
    });

    /*
     * Groq no necesita recibir el objeto
     * completo de la conversación.
     */
    expect(aiService.generateFinalResponse).toHaveBeenCalledWith({
      businessContext,
      messages,
      action: "human_handoff",

      actionResult: {
        success: true,

        result: {
          transferred: true,
        },
      },
    });

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "De acuerdo. Voy a pasar la conversación a una persona del equipo.",
    });
  });

  it("should use real availability results before saving the response", async () => {
    const slots = [
      {
        startsAt: "2026-09-24T07:00:00.000Z",
        endsAt: "2026-09-24T08:00:00.000Z",
        localTime: "09:00",
      },
      {
        startsAt: "2026-09-24T07:15:00.000Z",
        endsAt: "2026-09-24T08:15:00.000Z",
        localTime: "09:15",
      },
    ];

    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        content: "Voy a comprobar la disponibilidad.",

        action: {
          type: "check_availability",

          data: {
            serviceId: "service-123",
            date: "2026-09-24",
          },
        },
      },

      actionExecution: {
        action: "check_availability",

        result: {
          serviceId: "service-123",
          date: "2026-09-24",
          slots,
        },
      },

      finalResponse: "Sí, tengo disponibilidad a las 09:00 y 09:15.",
    });

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(agentActionExecutor.execute).toHaveBeenCalledWith({
      action: "check_availability",
      businessId: "business-123",
      conversationId: "conversation-123",

      data: {
        serviceId: "service-123",
        date: "2026-09-24",
      },
    });

    /*
     * Groq recibe solamente fecha, cantidad
     * y horas locales.
     *
     * No recibe serviceId ni timestamps UTC.
     */
    expect(aiService.generateFinalResponse).toHaveBeenCalledWith({
      businessContext,
      messages,
      action: "check_availability",

      actionResult: {
        success: true,

        result: {
          date: "2026-09-24",

          totalAvailableSlots: 2,

          slots: [
            {
              time: "09:00",
            },
            {
              time: "09:15",
            },
          ],
        },
      },
    });

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "Sí, tengo disponibilidad a las 09:00 y 09:15.",
    });
  });

  it("should limit the availability data sent to the final AI response", async () => {
    const slots = Array.from({ length: 20 }, (_, index) => {
      const totalMinutes = 9 * 60 + index * 15;

      const hours = Math.floor(totalMinutes / 60);

      const minutes = totalMinutes % 60;

      const localTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      return {
        startsAt: `2026-09-24T${localTime}:00.000Z`,

        endsAt: `2026-09-24T${localTime}:00.000Z`,

        localTime,
      };
    });

    const { useCase, aiService } = createDependencies({
      aiResponse: {
        content: "Voy a comprobar la disponibilidad.",

        action: {
          type: "check_availability",

          data: {
            serviceId: "service-123",
            date: "2026-09-24",
          },
        },
      },

      actionExecution: {
        action: "check_availability",

        result: {
          serviceId: "service-123",
          date: "2026-09-24",
          slots,
        },
      },

      finalResponse: "Tengo varios horarios disponibles.",
    });

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(aiService.generateFinalResponse).toHaveBeenCalledOnce();

    const call = aiService.generateFinalResponse.mock.calls[0][0];

    expect(call.actionResult.success).toBe(true);

    expect(call.actionResult.result.totalAvailableSlots).toBe(20);

    expect(call.actionResult.result.slots).toHaveLength(8);

    expect(call.actionResult.result.slots[0]).toEqual({
      time: "09:00",
    });

    expect(call.actionResult.result.slots[call.actionResult.result.slots.length - 1]).toEqual({
      time: "13:45",
    });

    /*
     * Ningún timestamp interno debe llegar
     * a la segunda llamada.
     */
    for (const slot of call.actionResult.result.slots) {
      expect(slot).toEqual({
        time: expect.any(String),
      });
    }
  });

  it("should confirm a booking only after the booking action succeeds", async () => {
    const booking = {
      id: "booking-123",
      business_id: "business-123",
      service_id: "service-123",
      conversation_id: "conversation-123",
      customer_name: "Jordi",
      customer_phone: "600123123",
      service_name: "Corte",

      /*
       * 15:00 UTC = 17:00 Europe/Madrid
       * en septiembre.
       */
      starts_at: "2026-09-24T15:00:00.000Z",

      ends_at: "2026-09-24T16:00:00.000Z",

      status: "confirmed",
    };

    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        /*
         * Aunque el primer modelo devuelva
         * una confirmación, NO se guarda
         * hasta ejecutar la acción real.
         */
        content: "Tu reserva está confirmada.",

        action: {
          type: "create_booking",

          /*
           * Contrato actual:
           * fecha + hora LOCAL.
           *
           * La IA NO genera UTC.
           */
          data: {
            serviceId: "service-123",

            date: "2026-09-24",
            time: "17:00",

            customerName: "Jordi",
            customerPhone: "600123123",
            customerEmail: null,
            notes: null,
          },
        },
      },

      actionExecution: {
        action: "create_booking",
        result: booking,
      },

      finalResponse: "Perfecto, Jordi. Tu reserva para el corte a las 17:00 está confirmada.",
    });

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(agentActionExecutor.execute).toHaveBeenCalledWith({
      action: "create_booking",
      businessId: "business-123",
      conversationId: "conversation-123",

      data: {
        serviceId: "service-123",

        date: "2026-09-24",
        time: "17:00",

        customerName: "Jordi",
        customerPhone: "600123123",
        customerEmail: null,
        notes: null,
      },
    });

    expect(aiService.generateFinalResponse).toHaveBeenCalledWith({
      businessContext,
      messages,
      action: "create_booking",

      /*
       * El booking interno está en UTC,
       * pero Groq recibe hora LOCAL.
       */
      actionResult: {
        success: true,

        result: {
          serviceName: "Corte",
          date: "2026-09-24",
          startTime: "17:00",
          endTime: "18:00",
          price: null,
          status: "confirmed",
        },
      },
    });

    expect(messageRepository.create).toHaveBeenCalledTimes(1);

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "Perfecto, Jordi. Tu reserva para el corte a las 17:00 está confirmada.",
    });

    expect(messageRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Tu reserva está confirmada.",
      }),
    );
  });

  it("should not save a false booking confirmation when booking fails with an AppError", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        /*
         * Esta confirmación provisional
         * jamás debe llegar a BD.
         */
        content: "Perfecto, tu reserva está confirmada.",

        action: {
          type: "create_booking",

          data: {
            serviceId: "service-123",

            date: "2026-09-24",
            time: "17:00",

            customerName: "Jordi",
            customerPhone: "600123123",
            customerEmail: null,
            notes: null,
          },
        },
      },

      finalResponse: "Lo siento, ese horario ya no está disponible. Podemos elegir otro.",
    });

    agentActionExecutor.execute.mockRejectedValue(new AppError("The selected time is not available", 409));

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(aiService.generateFinalResponse).toHaveBeenCalledWith({
      businessContext,
      messages,
      action: "create_booking",

      actionResult: {
        success: false,

        error: {
          message: "The selected time is not available",

          statusCode: 409,
        },
      },
    });

    /*
     * Solo debe existir UN mensaje del
     * asistente: el generado después
     * del fallo real.
     */
    expect(messageRepository.create).toHaveBeenCalledTimes(1);

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "Lo siento, ese horario ya no está disponible. Podemos elegir otro.",
    });

    expect(messageRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Perfecto, tu reserva está confirmada.",
      }),
    );
  });

  it("should propagate AppError 500 and not expose it to the final AI response", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        content: "Voy a crear la reserva.",

        action: {
          type: "create_booking",

          data: {
            serviceId: "service-123",
            date: "2026-09-24",
            time: "17:00",

            customerName: "Jordi",
            customerPhone: "600123123",
            customerEmail: null,
            notes: null,
          },
        },
      },
    });

    agentActionExecutor.execute.mockRejectedValue(new AppError("Internal booking failure", 500));

    await expect(
      useCase.execute({
        conversationId: "conversation-123",

        messages,
        businessContext,
      }),
    ).rejects.toMatchObject({
      message: "Internal booking failure",

      statusCode: 500,
    });

    /*
     * Un error interno NO se pasa a Groq
     * para que intente explicarlo.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).not.toHaveBeenCalled();
  });

  it("should propagate unexpected action errors and not save an assistant message", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        content: "Voy a crear la reserva.",

        action: {
          type: "create_booking",

          data: {
            serviceId: "service-123",

            date: "2026-09-24",
            time: "17:00",

            customerName: "Jordi",
            customerPhone: "600123123",
            customerEmail: null,
            notes: null,
          },
        },
      },
    });

    agentActionExecutor.execute.mockRejectedValue(new Error("Unexpected database failure"));

    await expect(
      useCase.execute({
        conversationId: "conversation-123",

        messages,
        businessContext,
      }),
    ).rejects.toThrow("Unexpected database failure");

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).not.toHaveBeenCalled();
  });

  it("should not call AI when conversation is handled by a human", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      conversation: {
        id: "conversation-123",
        status: "human",
      },
    });

    await expect(
      useCase.execute({
        conversationId: "conversation-123",

        messages,
        businessContext,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(aiService.generateResponse).not.toHaveBeenCalled();

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).not.toHaveBeenCalled();

    expect(agentActionExecutor.execute).not.toHaveBeenCalled();
  });

  it("should not call AI when conversation is closed", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      conversation: {
        id: "conversation-123",
        status: "closed",
      },
    });

    await expect(
      useCase.execute({
        conversationId: "conversation-123",

        messages,
        businessContext,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(aiService.generateResponse).not.toHaveBeenCalled();

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).not.toHaveBeenCalled();

    expect(agentActionExecutor.execute).not.toHaveBeenCalled();
  });

  it("should reject when conversation does not exist", async () => {
    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      conversation: null,
    });

    await expect(
      useCase.execute({
        conversationId: "conversation-123",

        messages,
        businessContext,
      }),
    ).rejects.toMatchObject({
      message: "Conversation not found",

      statusCode: 404,
    });

    expect(aiService.generateResponse).not.toHaveBeenCalled();

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).not.toHaveBeenCalled();

    expect(agentActionExecutor.execute).not.toHaveBeenCalled();
  });

  it("detects a requested time as available even when it is not included in the representative slots", async () => {
    /*
     * Creamos disponibilidad cada 15 minutos
     * desde las 09:00 hasta las 17:00.
     *
     * Son 33 slots en total.
     */
    const slots = Array.from({ length: 33 }, (_, index) => {
      const totalMinutes = 9 * 60 + index * 15;

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const localTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      return {
        startsAt: "2026-09-24T00:00:00.000Z",
        endsAt: "2026-09-24T00:00:00.000Z",
        localTime,
      };
    });

    /*
     * IMPORTANTE:
     *
     * El usuario pregunta específicamente por las 17:00.
     *
     * Aunque selectRepresentativeSlots() no incluyese
     * las 17:00 entre los 8 slots enviados como muestra,
     * debemos comprobar la hora contra TODOS los slots
     * reales antes de reducir la información.
     */
    const { useCase, aiService, agentActionExecutor, messageRepository } = createDependencies({
      aiResponse: {
        content: "Voy a comprobar esa hora.",

        action: {
          type: "check_availability",

          data: {
            serviceId: "service-123",
            date: "2026-09-24",
            time: "17:00",
          },
        },
      },

      actionExecution: {
        action: "check_availability",

        result: {
          serviceId: "service-123",
          date: "2026-09-24",
          slots,
        },
      },

      finalResponse: "Sí, hay disponibilidad a las 17:00.",
    });

    const specificMessages = [
      {
        role: "user",
        content: "¿A las 17 hay?",
      },
    ];

    await useCase.execute({
      conversationId: "conversation-123",
      messages: specificMessages,
      businessContext,
    });

    /*
     * Primero comprobamos que la hora concreta
     * sí se envía al executor.
     */
    expect(agentActionExecutor.execute).toHaveBeenCalledWith({
      action: "check_availability",
      businessId: "business-123",
      conversationId: "conversation-123",

      data: {
        serviceId: "service-123",
        date: "2026-09-24",
        time: "17:00",
      },
    });

    /*
     * La segunda llamada debe saber inequívocamente
     * que las 17:00 existen entre TODOS los slots reales.
     */
    expect(aiService.generateFinalResponse).toHaveBeenCalledWith({
      businessContext,
      messages: specificMessages,
      action: "check_availability",

      actionResult: {
        success: true,

        result: expect.objectContaining({
          date: "2026-09-24",

          requestedTime: "17:00",

          requestedTimeAvailable: true,

          totalAvailableSlots: 33,
        }),
      },
    });

    /*
     * Seguimos limitando las alternativas a 8.
     */
    const finalCall = aiService.generateFinalResponse.mock.calls[0][0];

    expect(finalCall.actionResult.result.slots).toHaveLength(8);

    /*
     * Y comprobamos que no filtramos timestamps
     * internos hacia Groq.
     */
    for (const slot of finalCall.actionResult.result.slots) {
      expect(slot).toEqual({
        time: expect.any(String),
      });
    }

    /*
     * Finalmente se guarda la respuesta final,
     * no la provisional.
     */
    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "Sí, hay disponibilidad a las 17:00.",
    });
  });
});
