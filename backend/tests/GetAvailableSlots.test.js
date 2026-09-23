import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { GetAvailableSlots } from "../src/modules/bookings/application/GetAvailableSlots.js";

describe("GetAvailableSlots", () => {
  /*
   * Fijamos el reloj en:
   *
   * 23/09/2026 12:00 UTC
   * 23/09/2026 14:00 Europe/Madrid
   *
   * Así los tests no dependen del día real
   * en el que se ejecuten.
   */
  beforeEach(() => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-09-23T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createDependencies({
    business = {
      id: "business-123",
      timezone: "Europe/Madrid",
    },

    service = {
      id: "service-123",
      business_id: "business-123",
      name: "Corte",
      duration_minutes: 30,
      price: 20,
    },

    hours = [
      {
        day_of_week: 5,
        open_time: "09:00:00",
        close_time: "11:00:00",
        second_open_time: null,
        second_close_time: null,
        is_closed: false,
      },
    ],

    bookings = [],
  } = {}) {
    return {
      businessRepository: {
        findById: vi.fn(async () => business),
      },

      businessServiceRepository: {
        findById: vi.fn(async () => service),
      },

      businessHoursRepository: {
        findByBusinessId: vi.fn(async () => hours),
      },

      bookingRepository: {
        findByBusinessIdAndDateRange: vi.fn(async () => bookings),
      },
    };
  }

  it("should generate available slots", async () => {
    const dependencies = createDependencies();

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("should remove slots that conflict with an existing booking", async () => {
    const dependencies = createDependencies({
      bookings: [
        {
          starts_at: "2026-09-25T07:30:00.000Z",
          ends_at: "2026-09-25T08:00:00.000Z",
          status: "confirmed",
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00", "10:00", "10:30"]);
  });

  it("should ignore cancelled bookings", async () => {
    const dependencies = createDependencies({
      bookings: [
        {
          starts_at: "2026-09-25T07:30:00.000Z",
          ends_at: "2026-09-25T08:00:00.000Z",
          status: "cancelled",
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("should return no slots when business is closed", async () => {
    const dependencies = createDependencies({
      hours: [
        {
          day_of_week: 5,
          open_time: null,
          close_time: null,
          second_open_time: null,
          second_close_time: null,
          is_closed: true,
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
    });

    expect(slots).toEqual([]);
  });

  it("should support split business hours", async () => {
    const dependencies = createDependencies({
      hours: [
        {
          day_of_week: 5,
          open_time: "09:00:00",
          close_time: "10:00:00",
          second_open_time: "16:00:00",
          second_close_time: "17:00:00",
          is_closed: false,
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00", "09:30", "16:00", "16:30"]);
  });

  it("should correctly map Sunday to day 0", async () => {
    const dependencies = createDependencies({
      hours: [
        {
          day_of_week: 0,
          open_time: "10:00:00",
          close_time: "11:00:00",
          second_open_time: null,
          second_close_time: null,
          is_closed: false,
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-27",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["10:00", "10:30"]);
  });

  it("should not create a slot that finishes after closing time", async () => {
    const dependencies = createDependencies({
      service: {
        id: "service-123",
        business_id: "business-123",
        name: "Servicio largo",
        duration_minutes: 45,
        price: 30,
      },

      hours: [
        {
          day_of_week: 5,
          open_time: "09:00:00",
          close_time: "10:00:00",
          second_open_time: null,
          second_close_time: null,
          is_closed: false,
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00"]);
  });

  it("should return no slots for a past date", async () => {
    const dependencies = createDependencies();

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-22",
      slotIntervalMinutes: 30,
    });

    expect(slots).toEqual([]);

    /*
     * Además, si el día ya ha pasado,
     * no necesitamos consultar servicios,
     * horarios ni reservas.
     */
    expect(dependencies.businessServiceRepository.findById).not.toHaveBeenCalled();

    expect(dependencies.businessHoursRepository.findByBusinessId).not.toHaveBeenCalled();

    expect(dependencies.bookingRepository.findByBusinessIdAndDateRange).not.toHaveBeenCalled();
  });

  it("should remove past slots when requesting availability for today", async () => {
    /*
     * El reloj está fijado en:
     * 14:00 Europe/Madrid.
     *
     * Con slotIntervalMinutes = 30:
     *
     * 13:00 ❌
     * 13:30 ❌
     * 14:00 ❌
     * 14:30 ✅
     * 15:00 ✅
     * 15:30 ✅
     */

    const dependencies = createDependencies({
      hours: [
        {
          day_of_week: 3,
          open_time: "13:00:00",
          close_time: "16:00:00",
          second_open_time: null,
          second_close_time: null,
          is_closed: false,
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-23",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["14:30", "15:00", "15:30"]);
  });

  it("should keep all valid slots for a future date", async () => {
    const dependencies = createDependencies({
      hours: [
        {
          day_of_week: 4,
          open_time: "09:00:00",
          close_time: "11:00:00",
          second_open_time: null,
          second_close_time: null,
          is_closed: false,
        },
      ],
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    const slots = await getAvailableSlots.execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-24",
      slotIntervalMinutes: 30,
    });

    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("should reject a missing business", async () => {
    const dependencies = createDependencies({
      business: null,
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    await expect(
      getAvailableSlots.execute({
        businessId: "business-123",
        serviceId: "service-123",
        date: "2026-09-25",
      }),
    ).rejects.toMatchObject({
      message: "Business not found",
      statusCode: 404,
    });
  });

  it("should reject a missing service", async () => {
    const dependencies = createDependencies({
      service: null,
    });

    const getAvailableSlots = new GetAvailableSlots(dependencies);

    await expect(
      getAvailableSlots.execute({
        businessId: "business-123",
        serviceId: "service-123",
        date: "2026-09-25",
      }),
    ).rejects.toMatchObject({
      message: "Business service not found",
      statusCode: 404,
    });
  });
});
