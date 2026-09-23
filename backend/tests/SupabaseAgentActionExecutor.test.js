import { describe, it, expect, vi } from "vitest";

import { SupabaseAgentActionExecutor } from "../src/modules/conversations/application/SupabaseAgentActionExecutor.js";

function createDependencies({
  existingLeads = [],
  conversation = null,
  business = null,
  service = null,
  hours = [],
  bookings = [],
} = {}) {
  const leadRepository = {
    findByConversationId: vi.fn(async () => existingLeads),

    findById: vi.fn(async (id) => {
      return existingLeads.find((lead) => lead.id === id) || null;
    }),

    create: vi.fn(async (lead) => ({
      id: "lead-created",
      ...lead,
    })),

    update: vi.fn(async (id, lead) => ({
      ...lead,
      id,
    })),
  };

  const conversationRepository = {
    findById: vi.fn(async () => conversation),

    updateStatus: vi.fn(async (id, status) => ({
      id,
      status,
    })),
  };

  const bookingRepository = {
    create: vi.fn(async (booking) => ({
      id: "booking-created",
      ...booking,
    })),

    findByBusinessIdAndDateRange: vi.fn(async () => bookings),

    findConflictingBookings: vi.fn(async (businessId, startsAt, endsAt) => {
      const start = new Date(startsAt);
      const end = new Date(endsAt);

      return bookings.filter((booking) => {
        if (booking.business_id !== businessId) {
          return false;
        }

        if (!["pending", "confirmed"].includes(booking.status)) {
          return false;
        }

        const existingStart = new Date(booking.starts_at);

        const existingEnd = new Date(booking.ends_at);

        return existingStart < end && existingEnd > start;
      });
    }),

    findById: vi.fn(),
    findByBusinessId: vi.fn(),
    updateStatus: vi.fn(),
  };

  const businessRepository = {
    findById: vi.fn(async () => business),
  };

  const businessServiceRepository = {
    findById: vi.fn(async (businessId, serviceId) => {
      if (!service) {
        return null;
      }

      if (service.business_id !== businessId) {
        return null;
      }

      if (service.id !== serviceId) {
        return null;
      }

      return service;
    }),
  };

  const businessHoursRepository = {
    findByBusinessId: vi.fn(async () => hours),
  };

  return {
    leadRepository,
    conversationRepository,
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
  };
}

function createExecutor(options = {}) {
  const dependencies = createDependencies(options);

  const executor = new SupabaseAgentActionExecutor(dependencies);

  return {
    executor,
    ...dependencies,
  };
}

describe("SupabaseAgentActionExecutor", () => {
  it("should do nothing for none action", async () => {
    const { executor } = createExecutor();

    const result = await executor.execute({
      action: "none",
      businessId: "business-123",
      conversationId: "conversation-123",
    });

    expect(result).toEqual({
      action: "none",
      result: null,
    });
  });

  it("should create a new lead", async () => {
    const { executor, leadRepository } = createExecutor();

    const result = await executor.execute({
      action: "create_lead",

      businessId: "business-123",

      conversationId: "conversation-123",

      data: {
        name: "Jordi",
        phone: "600000000",
      },
    });

    expect(leadRepository.create).toHaveBeenCalledOnce();

    expect(result.action).toBe("create_lead");

    expect(result.result.name).toBe("Jordi");

    expect(result.result.phone).toBe("600000000");
  });

  it("should update an existing lead instead of creating another one", async () => {
    const existingLead = {
      id: "lead-123",

      business_id: "business-123",

      conversation_id: "conversation-123",

      name: "Jordi",

      phone: "600000000",

      email: null,

      notes: null,

      status: "new",
    };

    const { executor, leadRepository } = createExecutor({
      existingLeads: [existingLead],
    });

    const result = await executor.execute({
      action: "create_lead",

      businessId: "business-123",

      conversationId: "conversation-123",

      data: {
        email: "jordi@example.com",
      },
    });

    expect(leadRepository.create).not.toHaveBeenCalled();

    expect(leadRepository.update).toHaveBeenCalledOnce();

    expect(result.result.phone).toBe("600000000");

    expect(result.result.email).toBe("jordi@example.com");
  });

  it("should not erase existing lead data with empty values", async () => {
    const existingLead = {
      id: "lead-123",

      business_id: "business-123",

      conversation_id: "conversation-123",

      name: "Jordi",

      phone: "600000000",

      email: "jordi@example.com",

      notes: "Cliente interesado",

      status: "new",
    };

    const { executor } = createExecutor({
      existingLeads: [existingLead],
    });

    const result = await executor.execute({
      action: "create_lead",

      businessId: "business-123",

      conversationId: "conversation-123",

      data: {
        name: "",
        phone: "",
        email: "",
        notes: "",
      },
    });

    expect(result.result.name).toBe("Jordi");

    expect(result.result.phone).toBe("600000000");

    expect(result.result.email).toBe("jordi@example.com");

    expect(result.result.notes).toBe("Cliente interesado");
  });

  it("should reject an existing lead from another business", async () => {
    const existingLead = {
      id: "lead-123",

      business_id: "other-business",

      conversation_id: "conversation-123",

      phone: "600000000",

      status: "new",
    };

    const { executor, leadRepository } = createExecutor({
      existingLeads: [existingLead],
    });

    await expect(
      executor.execute({
        action: "create_lead",

        businessId: "business-123",

        conversationId: "conversation-123",

        data: {
          email: "jordi@example.com",
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(leadRepository.update).not.toHaveBeenCalled();
  });

  it("should reject creating a lead without phone or email", async () => {
    const { executor, leadRepository } = createExecutor();

    await expect(
      executor.execute({
        action: "create_lead",

        businessId: "business-123",

        conversationId: "conversation-123",

        data: {
          name: "Jordi",
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(leadRepository.create).not.toHaveBeenCalled();
  });

  it("should hand off an active conversation to a human", async () => {
    const { executor, conversationRepository } = createExecutor({
      conversation: {
        id: "conversation-123",
        status: "active",
      },
    });

    const result = await executor.execute({
      action: "human_handoff",

      businessId: "business-123",

      conversationId: "conversation-123",
    });

    expect(conversationRepository.updateStatus).toHaveBeenCalledWith("conversation-123", "human");

    expect(result.result.status).toBe("human");
  });

  it("should not update a conversation already handled by a human", async () => {
    const conversation = {
      id: "conversation-123",
      status: "human",
    };

    const { executor, conversationRepository } = createExecutor({
      conversation,
    });

    const result = await executor.execute({
      action: "human_handoff",

      businessId: "business-123",

      conversationId: "conversation-123",
    });

    expect(conversationRepository.updateStatus).not.toHaveBeenCalled();

    expect(result.result).toBe(conversation);
  });

  it("should reject human handoff for a closed conversation", async () => {
    const { executor, conversationRepository } = createExecutor({
      conversation: {
        id: "conversation-123",
        status: "closed",
      },
    });

    await expect(
      executor.execute({
        action: "human_handoff",

        businessId: "business-123",

        conversationId: "conversation-123",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(conversationRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("should check real availability", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-09-23T06:00:00.000Z"));

    try {
      const { executor, bookingRepository } = createExecutor({
        business: {
          id: "business-123",
          timezone: "Europe/Madrid",
        },

        service: {
          id: "service-123",

          business_id: "business-123",

          name: "Corte",

          duration_minutes: 60,

          price: 15,
        },

        hours: [
          {
            day_of_week: 4,

            open_time: "09:00:00",

            close_time: "12:00:00",

            second_open_time: null,

            second_close_time: null,

            is_closed: false,
          },
        ],
      });

      const result = await executor.execute({
        action: "check_availability",

        businessId: "business-123",

        conversationId: "conversation-123",

        data: {
          serviceId: "service-123",

          date: "2026-09-24",
        },
      });

      expect(result.action).toBe("check_availability");

      expect(result.result.serviceId).toBe("service-123");

      expect(result.result.date).toBe("2026-09-24");

      expect(result.result.slots.length).toBeGreaterThan(0);

      expect(bookingRepository.findByBusinessIdAndDateRange).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should return no availability for a closed day", async () => {
    const { executor } = createExecutor({
      business: {
        id: "business-123",
        timezone: "Europe/Madrid",
      },

      service: {
        id: "service-123",

        business_id: "business-123",

        name: "Corte",

        duration_minutes: 60,

        price: 15,
      },

      hours: [
        {
          day_of_week: 4,

          open_time: null,

          close_time: null,

          second_open_time: null,

          second_close_time: null,

          is_closed: true,
        },
      ],
    });

    const result = await executor.execute({
      action: "check_availability",

      businessId: "business-123",

      conversationId: "conversation-123",

      data: {
        serviceId: "service-123",

        date: "2099-09-24",
      },
    });

    expect(result.result.slots).toEqual([]);
  });

  it("should create a booking using the real conversation id and local business time", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-09-23T06:00:00.000Z"));

    try {
      const { executor, bookingRepository } = createExecutor({
        conversation: {
          id: "conversation-123",
          business_id: "business-123",
          status: "active",
        },

        business: {
          id: "business-123",
          timezone: "Europe/Madrid",
        },

        service: {
          id: "service-123",
          business_id: "business-123",
          name: "Corte",
          duration_minutes: 60,
          price: 15,
        },

        hours: [
          {
            day_of_week: 4,
            open_time: "09:00:00",
            close_time: "12:00:00",
            second_open_time: null,
            second_close_time: null,
            is_closed: false,
          },
        ],
      });

      const result = await executor.execute({
        action: "create_booking",

        businessId: "business-123",

        conversationId: "conversation-123",

        data: {
          serviceId: "service-123",

          date: "2026-09-24",
          time: "09:00",

          customerName: "Jordi",
          customerPhone: "600000000",
        },
      });

      expect(result.action).toBe("create_booking");

      expect(bookingRepository.create).toHaveBeenCalledOnce();

      const bookingInput = bookingRepository.create.mock.calls[0][0];

      expect(bookingInput.businessId).toBe("business-123");

      expect(bookingInput.conversationId).toBe("conversation-123");

      expect(bookingInput.customerName).toBe("Jordi");

      expect(bookingInput.customerPhone).toBe("600000000");

      expect(bookingInput.serviceId).toBe("service-123");

      /*
       * 09:00 Europe/Madrid
       * corresponde a 07:00 UTC.
       */
      expect(bookingInput.startsAt).toBe("2026-09-24T07:00:00.000Z");

      expect(bookingInput.endsAt).toBe("2026-09-24T08:00:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should automatically associate the lead from the conversation", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-09-23T06:00:00.000Z"));

    try {
      const existingLead = {
        id: "lead-123",
        business_id: "business-123",
        conversation_id: "conversation-123",
        name: "Jordi",
        phone: "600000000",
        email: null,
        notes: null,
        status: "new",
      };

      const { executor, bookingRepository } = createExecutor({
        existingLeads: [existingLead],

        conversation: {
          id: "conversation-123",
          business_id: "business-123",
          status: "active",
        },

        business: {
          id: "business-123",
          timezone: "Europe/Madrid",
        },

        service: {
          id: "service-123",
          business_id: "business-123",
          name: "Corte",
          duration_minutes: 60,
          price: 15,
        },

        hours: [
          {
            day_of_week: 4,
            open_time: "09:00:00",
            close_time: "12:00:00",
            second_open_time: null,
            second_close_time: null,
            is_closed: false,
          },
        ],
      });

      await executor.execute({
        action: "create_booking",

        businessId: "business-123",

        conversationId: "conversation-123",

        data: {
          serviceId: "service-123",

          date: "2026-09-24",
          time: "09:00",

          customerName: "Jordi",
          customerPhone: "600000000",
        },
      });

      const bookingInput = bookingRepository.create.mock.calls[0][0];

      expect(bookingInput.leadId).toBe("lead-123");

      expect(bookingInput.conversationId).toBe("conversation-123");

      expect(bookingInput.startsAt).toBe("2026-09-24T07:00:00.000Z");

      expect(bookingInput.endsAt).toBe("2026-09-24T08:00:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reject a lead from another business when creating a booking", async () => {
    const existingLead = {
      id: "lead-evil",
      business_id: "other-business",
      conversation_id: "conversation-123",
      phone: "600000000",
      status: "new",
    };

    const { executor, bookingRepository } = createExecutor({
      existingLeads: [existingLead],
    });

    await expect(
      executor.execute({
        action: "create_booking",

        businessId: "business-123",

        conversationId: "conversation-123",

        data: {
          serviceId: "service-123",

          date: "2099-09-24",
          time: "09:00",

          customerName: "Jordi",
          customerPhone: "600000000",
        },
      }),
    ).rejects.toMatchObject({
      message: "Lead does not belong to this business",
      statusCode: 403,
    });

    expect(bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should reject an unavailable booking slot", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-09-23T06:00:00.000Z"));

    try {
      const { executor, bookingRepository } = createExecutor({
        conversation: {
          id: "conversation-123",
          business_id: "business-123",
          status: "active",
        },

        business: {
          id: "business-123",
          timezone: "Europe/Madrid",
        },

        service: {
          id: "service-123",
          business_id: "business-123",
          name: "Corte",
          duration_minutes: 60,
          price: 15,
        },

        hours: [
          {
            day_of_week: 4,
            open_time: "09:00:00",
            close_time: "12:00:00",
            second_open_time: null,
            second_close_time: null,
            is_closed: false,
          },
        ],

        bookings: [
          {
            id: "existing-booking",
            business_id: "business-123",

            /*
             * 07:00Z = 09:00 Europe/Madrid
             * 08:00Z = 10:00 Europe/Madrid
             */
            starts_at: "2026-09-24T07:00:00.000Z",

            ends_at: "2026-09-24T08:00:00.000Z",

            status: "confirmed",
          },
        ],
      });

      await expect(
        executor.execute({
          action: "create_booking",

          businessId: "business-123",

          conversationId: "conversation-123",

          data: {
            serviceId: "service-123",

            date: "2026-09-24",
            time: "09:00",

            customerName: "Jordi",
            customerPhone: "600000000",
          },
        }),
      ).rejects.toMatchObject({
        message: "The selected time is not available",
        statusCode: 409,
      });

      expect(bookingRepository.create).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reject an unsupported action", async () => {
    const { executor } = createExecutor();

    await expect(
      executor.execute({
        action: "destroy_everything",

        businessId: "business-123",

        conversationId: "conversation-123",
      }),
    ).rejects.toMatchObject({
      message: "Unsupported agent action: destroy_everything",

      statusCode: 400,
    });
  });
});
