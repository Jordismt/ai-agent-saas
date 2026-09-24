import { describe, it, expect, vi } from "vitest";

import { GeneratePublicAIResponse } from "../src/modules/public/application/GeneratePublicAIResponse.js";
import { AppError } from "../src/shared/errors/AppError.js";

describe("GeneratePublicAIResponse", () => {
  const businessContext = {
    id: "business-123",
    name: "Peluquería Test",
    timezone: "Europe/Madrid",
    services: [],
    employees: [],
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

    actionExecution = {
      action: "none",
      result: null,
    },
  } = {}) {
    const conversationRepository = {
      findById: vi.fn().mockResolvedValue(conversation),
    };

    /*
     * generateFinalResponse se mantiene mockeado
     * deliberadamente.
     *
     * La arquitectura optimizada NO debe utilizarlo
     * después de ejecutar una acción.
     */
    const aiService = {
      generateResponse: vi.fn().mockResolvedValue(aiResponse),
      generateFinalResponse: vi.fn(),
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
     * NONE no ejecuta ninguna acción.
     */
    expect(agentActionExecutor.execute).not.toHaveBeenCalled();

    /*
     * Tampoco existe segunda llamada a Groq.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledOnce();

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "¡Hola! ¿En qué puedo ayudarte?",
    });

    expect(result.content).toBe("¡Hola! ¿En qué puedo ayudarte?");
  });

  it("should execute create_lead and save a deterministic response without a second AI call", async () => {
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
         *
         * No debe guardarse porque todavía no
         * sabemos si create_lead ha funcionado.
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
     * OPTIMIZACIÓN:
     *
     * Después de guardar el lead NO hacemos
     * otra llamada a Groq.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledTimes(1);

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "Perfecto, he guardado tus datos. ¿En qué más puedo ayudarte?",
    });

    /*
     * La respuesta provisional del LLM
     * nunca se guarda.
     */
    expect(messageRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Perfecto, he guardado tus datos.",
      }),
    );
  });

  it("should execute human_handoff and save a deterministic response without a second AI call", async () => {
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

        result: {
          id: "conversation-123",
          status: "human",
        },
      },
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

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "Te paso con una persona del equipo para que pueda ayudarte.",
    });
  });

  it("should use real availability results and save a deterministic response", async () => {
    const slots = [
      {
        startsAt: "2026-09-24T07:00:00.000Z",
        endsAt: "2026-09-24T08:00:00.000Z",
        localTime: "09:00",
        employees: [],
      },

      {
        startsAt: "2026-09-24T07:15:00.000Z",
        endsAt: "2026-09-24T08:15:00.000Z",
        localTime: "09:15",
        employees: [],
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
     * El backend ya conoce la disponibilidad.
     * No necesitamos volver a llamar a Groq.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "Hay disponibilidad a las 09:00 y 09:15.",
    });
  });

  it("should limit representative availability to six slots without a second AI call", async () => {
    const slots = Array.from(
      {
        length: 20,
      },
      (_, index) => {
        const totalMinutes = 9 * 60 + index * 15;

        const hours = Math.floor(totalMinutes / 60);

        const minutes = totalMinutes % 60;

        const localTime = `${String(hours).padStart(2, "0")}:` + `${String(minutes).padStart(2, "0")}`;

        return {
          startsAt: `2026-09-24T${localTime}:00.000Z`,
          endsAt: `2026-09-24T${localTime}:00.000Z`,
          localTime,
          employees: [],
        };
      },
    );

    const { useCase, aiService, messageRepository } = createDependencies({
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
    });

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    const savedContent = messageRepository.create.mock.calls[0][0].content;

    /*
     * Los slots representativos se distribuyen
     * durante todo el rango.
     */
    expect(savedContent).toContain("09:00");

    expect(savedContent).toContain("13:45");

    /*
     * Debemos mostrar únicamente seis horas.
     */
    const timeMatches = savedContent.match(/\b\d{2}:\d{2}\b/g) || [];

    expect(timeMatches).toHaveLength(6);

    /*
     * Ningún timestamp interno puede aparecer
     * en la respuesta pública.
     */
    expect(savedContent).not.toContain("2026-09-24T");

    expect(savedContent).not.toContain(".000Z");
  });

  it("should preserve employeeId when checking availability for a specific employee", async () => {
    const employeeId = "11111111-1111-4111-8111-111111111111";

    const { useCase, aiService, messageRepository, agentActionExecutor } = createDependencies({
      aiResponse: {
        content: "Voy a comprobar si Laura está disponible.",

        action: {
          type: "check_availability",

          data: {
            serviceId: "service-123",
            employeeId,
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

          slots: [
            {
              startsAt: "2026-09-24T15:00:00.000Z",

              endsAt: "2026-09-24T16:00:00.000Z",

              localTime: "17:00",

              employees: [
                {
                  id: employeeId,
                  name: "Laura",
                },
              ],
            },
          ],
        },
      },
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
        employeeId,
        date: "2026-09-24",
        time: "17:00",
      },
    });

    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",
      content: "Sí, las 17:00 están disponibles con Laura.",
    });
  });

  it("should confirm a booking only after the booking action succeeds", async () => {
    const employeeId = "11111111-1111-4111-8111-111111111111";

    const booking = {
      id: "booking-123",
      business_id: "business-123",
      service_id: "service-123",
      employee_id: employeeId,
      conversation_id: "conversation-123",

      customer_name: "Jordi",
      customer_phone: "600123123",

      service_name: "Corte",
      employee_name: "Laura",

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
         * Aunque Groq intente confirmar la reserva
         * antes de ejecutarla, esta respuesta
         * provisional nunca se guarda.
         */
        content: "Tu reserva está confirmada.",

        action: {
          type: "create_booking",

          data: {
            serviceId: "service-123",
            employeeId,

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
        employeeId,

        date: "2026-09-24",
        time: "17:00",

        customerName: "Jordi",
        customerPhone: "600123123",
        customerEmail: null,
        notes: null,
      },
    });

    /*
     * La reserva ya está confirmada por backend.
     *
     * No gastamos otra llamada a Groq.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledTimes(1);

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "Perfecto, tu reserva para Corte el 2026-09-24 a las 17:00 con Laura está confirmada.",
    });

    /*
     * La confirmación provisional del LLM
     * nunca llega a BD.
     */
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
         * Confirmación provisional incorrecta.
         *
         * El backend todavía no ha reservado.
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
    });

    agentActionExecutor.execute.mockRejectedValue(new AppError("The selected time is not available", 409));

    await useCase.execute({
      conversationId: "conversation-123",
      messages,
      businessContext,
    });

    /*
     * Tampoco utilizamos Groq para explicar
     * un error controlado de disponibilidad.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    expect(messageRepository.create).toHaveBeenCalledTimes(1);

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",
      role: "assistant",

      content: "Ese horario ya no está disponible. Podemos probar con otra hora.",
    });

    /*
     * Nunca guardamos la falsa confirmación.
     */
    expect(messageRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Perfecto, tu reserva está confirmada.",
      }),
    );
  });

  it("should propagate AppError 500 and not expose or save it", async () => {
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
     * Los errores internos no llegan a una
     * segunda llamada de IA.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    /*
     * Tampoco guardamos ningún mensaje falso.
     */
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

  it("detects a requested time as available using all real slots, not only representative slots", async () => {
    /*
     * Disponibilidad cada 15 minutos
     * desde 09:00 hasta 17:00.
     *
     * 33 slots reales.
     */
    const slots = Array.from(
      {
        length: 33,
      },
      (_, index) => {
        const totalMinutes = 9 * 60 + index * 15;

        const hours = Math.floor(totalMinutes / 60);

        const minutes = totalMinutes % 60;

        const localTime = `${String(hours).padStart(2, "0")}:` + `${String(minutes).padStart(2, "0")}`;

        return {
          startsAt: "2026-09-24T00:00:00.000Z",

          endsAt: "2026-09-24T00:00:00.000Z",

          localTime,

          /*
           * Simulamos que Laura está disponible
           * específicamente a las 17:00.
           */
          employees:
            localTime === "17:00"
              ? [
                  {
                    id: "11111111-1111-4111-8111-111111111111",

                    name: "Laura",
                  },
                ]
              : [],
        };
      },
    );

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
     * La hora concreta debe llegar
     * correctamente al executor.
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
     * No existe segunda llamada al LLM.
     */
    expect(aiService.generateFinalResponse).not.toHaveBeenCalled();

    /*
     * IMPORTANTE:
     *
     * Las 17:00 se buscan contra TODOS
     * los slots reales ANTES de reducirlos
     * a slots representativos.
     *
     * Por eso debe detectarse correctamente.
     */
    expect(messageRepository.create).toHaveBeenCalledWith({
      conversationId: "conversation-123",

      role: "assistant",

      content: "Sí, las 17:00 están disponibles con Laura.",
    });

    /*
     * Tampoco exponemos timestamps UTC
     * en el mensaje al cliente.
     */
    const savedContent = messageRepository.create.mock.calls[0][0].content;

    expect(savedContent).not.toContain("2026-09-24T00:00:00.000Z");
  });
});
