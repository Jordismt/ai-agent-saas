import { describe, it, expect, vi } from "vitest";

import { CreateBooking } from "../src/modules/bookings/application/CreateBooking.js";

describe("CreateBooking", () => {
  function createDependencies({
    business = {
      id: "business-123",
      timezone: "Europe/Madrid",
    },

    service = {
      id: "service-123",
      business_id: "business-123",
      name: "Corte",
      price: 20,
      duration_minutes: 30,
    },

    conversation = {
      id: "conversation-123",
      business_id: "business-123",
    },

    lead = {
      id: "lead-123",
      business_id: "business-123",
    },

    availableSlots = [
      {
        startsAt: "2026-09-25T15:00:00.000Z",
        endsAt: "2026-09-25T15:30:00.000Z",
        localTime: "17:00",
      employees: [
        {
          id: "employee-123",
          name: "Laura",
        },
      ],
},
    ],

    conflicts = [],
  } = {}) {
    return {
      bookingRepository: {
        findConflictingBookings: vi.fn(async () => conflicts),
        create: vi.fn(async (booking) => booking),
      },

      businessRepository: {
        findById: vi.fn(async () => business),
      },

      businessServiceRepository: {
        findById: vi.fn(async () => service),
      },

      conversationRepository: {
        findById: vi.fn(async () => conversation),
      },

      leadRepository: {
        findById: vi.fn(async () => lead),
      },

      employeeRepository: {
        findById: vi.fn(async () => ({
          id: "employee-123",
          business_id: "business-123",
          name: "Laura",
          active: true,
        })),

        getServices: vi.fn(async () => [
          {
            id: "service-123",
            business_id: "business-123",
            name: "Corte",
            duration_minutes: 30,
            price: 20,
          },
        ]),
      },

      getAvailableSlots: {
        execute: vi.fn(async () => availableSlots),
      },
    };
  }

  it("should create a booking using service data and local business time", async () => {
    const dependencies = createDependencies();

    const createBooking = new CreateBooking(dependencies);

    const booking = await createBooking.execute({
      businessId: "business-123",
      serviceId: "service-123",

      customerName: "Jordi",
      customerPhone: "600000000",

      date: "2026-09-25",
      time: "17:00",
    });

    expect(booking.serviceName).toBe("Corte");
    expect(booking.durationMinutes).toBe(30);
    expect(booking.price).toBe(20);

    /*
     * 17:00 Europe/Madrid =
     * 15:00 UTC en esta fecha.
     *
     * El cliente trabaja siempre con hora local.
     * El booking utiliza el slot real devuelto
     * por GetAvailableSlots.
     */
    expect(booking.startsAt).toBe("2026-09-25T15:00:00.000Z");

    expect(booking.endsAt).toBe("2026-09-25T15:30:00.000Z");

    expect(booking.status).toBe("confirmed");

    expect(dependencies.businessRepository.findById).toHaveBeenCalledWith("business-123");

    expect(dependencies.businessServiceRepository.findById).toHaveBeenCalledWith(
      "business-123",
      "service-123",
    );

    expect(dependencies.getAvailableSlots.execute).toHaveBeenCalledWith({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      employeeId: null,
    });

    expect(dependencies.bookingRepository.findConflictingBookings).toHaveBeenCalledWith(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      "employee-123",
    );

    expect(dependencies.bookingRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should reject a time outside available slots", async () => {
    const dependencies = createDependencies({
      availableSlots: [],
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "03:00",
      }),
    ).rejects.toMatchObject({
      message: "The selected time is not available",
      statusCode: 409,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should reject an exact local time that was not returned as an available slot", async () => {
    const dependencies = createDependencies({
      service: {
        id: "service-123",
        business_id: "business-123",
        name: "Corte",
        price: 20,
        duration_minutes: 60,
      },

      availableSlots: [
        {
          startsAt: "2026-09-25T14:00:00.000Z",
          endsAt: "2026-09-25T15:00:00.000Z",
          localTime: "16:00",
        employees: [
          {
            id: "employee-123",
            name: "Laura",
          },
        ],
},
      ],
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "The selected time is not available",
      statusCode: 409,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should never treat the end of a slot as another available start time", async () => {
    const dependencies = createDependencies({
      service: {
        id: "service-123",
        business_id: "business-123",
        name: "Corte",
        price: 20,
        duration_minutes: 60,
      },

      availableSlots: [
        {
          startsAt: "2026-09-25T14:00:00.000Z",
          endsAt: "2026-09-25T15:00:00.000Z",
          localTime: "16:00",
        employees: [
          {
            id: "employee-123",
            name: "Laura",
          },
        ],
},
      ],
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "The selected time is not available",
      statusCode: 409,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should recheck conflicts immediately before creating", async () => {
    const dependencies = createDependencies({
      conflicts: [
        {
          id: "booking-existing",
        },
      ],
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "The selected time is not available",
      statusCode: 409,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a missing business", async () => {
    const dependencies = createDependencies({
      business: null,
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Business not found",
      statusCode: 404,
    });

    expect(dependencies.businessServiceRepository.findById).not.toHaveBeenCalled();

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should reject an invalid business timezone", async () => {
    const dependencies = createDependencies({
      business: {
        id: "business-123",
        timezone: "Invalid/Timezone",
      },
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Business timezone is invalid",
      statusCode: 400,
    });
  });

  it("should reject a missing service", async () => {
    const dependencies = createDependencies({
      service: null,
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "missing-service",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Business service not found",
      statusCode: 404,
    });
  });

  it("should reject a service without duration", async () => {
    const dependencies = createDependencies({
      service: {
        id: "service-123",
        business_id: "business-123",
        name: "Corte",
        price: 20,
        duration_minutes: null,
      },
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Business service requires a valid duration",
      statusCode: 400,
    });
  });

  it("should reject a booking without customer contact", async () => {
    const dependencies = createDependencies();

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",

        customerName: "Jordi",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Booking requires a phone or email",
      statusCode: 400,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("should use the requested business local date and time", async () => {
    const dependencies = createDependencies({
      availableSlots: [
        {
          startsAt: "2026-09-24T22:30:00.000Z",
          endsAt: "2026-09-24T23:00:00.000Z",
          localTime: "00:30",
        employees: [
          {
            id: "employee-123",
            name: "Laura",
          },
        ],
},
      ],
    });

    const createBooking = new CreateBooking(dependencies);

    const booking = await createBooking.execute({
      businessId: "business-123",
      serviceId: "service-123",

      customerName: "Jordi",
      customerPhone: "600000000",

      date: "2026-09-25",
      time: "00:30",
    });

    expect(dependencies.getAvailableSlots.execute).toHaveBeenCalledWith({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      employeeId: null,
    });

    /*
     * El usuario pidió:
     *
     * 25/09/2026 00:30 Europe/Madrid
     *
     * El slot real almacenado puede ser:
     *
     * 24/09/2026 22:30 UTC
     */
    expect(booking.startsAt).toBe("2026-09-24T22:30:00.000Z");

    expect(booking.endsAt).toBe("2026-09-24T23:00:00.000Z");
  });

  it("should create a booking linked to a conversation from the same business", async () => {
    const dependencies = createDependencies();

    const createBooking = new CreateBooking(dependencies);

    const booking = await createBooking.execute({
      businessId: "business-123",
      serviceId: "service-123",
      conversationId: "conversation-123",

      customerName: "Jordi",
      customerPhone: "600000000",

      date: "2026-09-25",
      time: "17:00",
    });

    expect(dependencies.conversationRepository.findById).toHaveBeenCalledWith("conversation-123");

    expect(booking.conversationId).toBe("conversation-123");

    expect(dependencies.bookingRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should reject a missing conversation", async () => {
    const dependencies = createDependencies({
      conversation: null,
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",
        conversationId: "missing-conversation",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Conversation not found",
      statusCode: 404,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();

    expect(dependencies.getAvailableSlots.execute).not.toHaveBeenCalled();
  });

  it("should reject a conversation from another business", async () => {
    const dependencies = createDependencies({
      conversation: {
        id: "conversation-456",
        business_id: "business-other",
      },
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",
        conversationId: "conversation-456",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Conversation does not belong to this business",
      statusCode: 403,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();

    expect(dependencies.getAvailableSlots.execute).not.toHaveBeenCalled();
  });

  it("should create a booking linked to a lead from the same business", async () => {
    const dependencies = createDependencies();

    const createBooking = new CreateBooking(dependencies);

    const booking = await createBooking.execute({
      businessId: "business-123",
      serviceId: "service-123",
      leadId: "lead-123",

      customerName: "Jordi",
      customerPhone: "600000000",

      date: "2026-09-25",
      time: "17:00",
    });

    expect(dependencies.leadRepository.findById).toHaveBeenCalledWith("lead-123");

    expect(booking.leadId).toBe("lead-123");

    expect(dependencies.bookingRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should reject a missing lead", async () => {
    const dependencies = createDependencies({
      lead: null,
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",
        leadId: "missing-lead",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Lead not found",
      statusCode: 404,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();

    expect(dependencies.getAvailableSlots.execute).not.toHaveBeenCalled();
  });

  it("should reject a lead from another business", async () => {
    const dependencies = createDependencies({
      lead: {
        id: "lead-456",
        business_id: "business-other",
      },
    });

    const createBooking = new CreateBooking(dependencies);

    await expect(
      createBooking.execute({
        businessId: "business-123",
        serviceId: "service-123",
        leadId: "lead-456",

        customerName: "Jordi",
        customerPhone: "600000000",

        date: "2026-09-25",
        time: "17:00",
      }),
    ).rejects.toMatchObject({
      message: "Lead does not belong to this business",
      statusCode: 403,
    });

    expect(dependencies.bookingRepository.create).not.toHaveBeenCalled();

    expect(dependencies.getAvailableSlots.execute).not.toHaveBeenCalled();
  });
});
