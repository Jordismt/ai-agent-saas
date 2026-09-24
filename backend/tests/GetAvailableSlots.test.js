import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GetAvailableSlots } from "../src/modules/bookings/application/GetAvailableSlots.js";

describe("GetAvailableSlots - employees", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T12:00:00.000Z")); // 14:00 Europe/Madrid
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const laura = { id: "employee-laura", business_id: "business-123", name: "Laura", active: true };
  const marta = { id: "employee-marta", business_id: "business-123", name: "Marta", active: true };

  function createDependencies({
    business = { id: "business-123", timezone: "Europe/Madrid" },
    service = {
      id: "service-123",
      business_id: "business-123",
      name: "Corte",
      duration_minutes: 30,
      price: 20,
    },
    hours = [{
      day_of_week: 5,
      open_time: "09:00:00",
      close_time: "11:00:00",
      second_open_time: null,
      second_close_time: null,
      is_closed: false,
    }],
    bookings = [],
    employees = [laura],
    servicesByEmployee = {
      "employee-laura": [{ id: "service-123" }],
      "employee-marta": [{ id: "service-123" }],
    },
    hoursByEmployee = {
      "employee-laura": [{
        weekday: 5, is_closed: false,
        start_time: "09:00:00", end_time: "11:00:00",
        second_start_time: null, second_end_time: null,
      }],
      "employee-marta": [{
        weekday: 5, is_closed: false,
        start_time: "09:00:00", end_time: "11:00:00",
        second_start_time: null, second_end_time: null,
      }],
    },
    timeOffByEmployee = {},
  } = {}) {
    return {
      businessRepository: { findById: vi.fn(async () => business) },
      businessServiceRepository: { findById: vi.fn(async () => service) },
      businessHoursRepository: { findByBusinessId: vi.fn(async () => hours) },
      bookingRepository: {
        findByBusinessIdAndDateRange: vi.fn(async () => bookings),
      },
      employeeRepository: {
        findByBusinessId: vi.fn(async () => employees),
        getServices: vi.fn(async (employeeId) => servicesByEmployee[employeeId] ?? []),
        getHours: vi.fn(async (employeeId) => hoursByEmployee[employeeId] ?? []),
        getTimeOff: vi.fn(async (employeeId) => timeOffByEmployee[employeeId] ?? []),
      },
    };
  }

  const execute = (dependencies, overrides = {}) =>
    new GetAvailableSlots(dependencies).execute({
      businessId: "business-123",
      serviceId: "service-123",
      date: "2026-09-25",
      slotIntervalMinutes: 30,
      ...overrides,
    });

  it("generates slots and exposes the available employee", async () => {
    const slots = await execute(createDependencies());
    expect(slots.map((slot) => slot.localTime)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(slots[0].employees).toEqual([{ id: "employee-laura", name: "Laura" }]);
  });

  it("groups two available employees inside the same slot", async () => {
    const slots = await execute(createDependencies({ employees: [laura, marta] }));
    expect(slots).toHaveLength(4);
    expect(slots[0].employees).toEqual([
      { id: "employee-laura", name: "Laura" },
      { id: "employee-marta", name: "Marta" },
    ]);
  });

  it("filters inactive employees", async () => {
    const dependencies = createDependencies({
      employees: [{ ...laura, active: false }, marta],
    });
    const slots = await execute(dependencies);
    expect(slots.every((slot) => slot.employees.map((e) => e.id).join(",") === "employee-marta")).toBe(true);
    expect(dependencies.employeeRepository.getServices).not.toHaveBeenCalledWith("employee-laura");
  });

  it("filters employees that do not perform the service", async () => {
    const dependencies = createDependencies({
      employees: [laura, marta],
      servicesByEmployee: {
        "employee-laura": [],
        "employee-marta": [{ id: "service-123" }],
      },
    });
    const slots = await execute(dependencies);
    expect(slots[0].employees).toEqual([{ id: "employee-marta", name: "Marta" }]);
  });

  it("returns no slots when no employee can perform the service", async () => {
    const slots = await execute(createDependencies({
      servicesByEmployee: { "employee-laura": [] },
    }));
    expect(slots).toEqual([]);
  });

  it("filters availability by requested employeeId", async () => {
    const slots = await execute(
      createDependencies({ employees: [laura, marta] }),
      { employeeId: "employee-marta" },
    );
    expect(slots[0].employees).toEqual([{ id: "employee-marta", name: "Marta" }]);
  });

  it("returns no slots for an unknown requested employeeId", async () => {
    const slots = await execute(createDependencies(), { employeeId: "missing" });
    expect(slots).toEqual([]);
  });

  it("returns no slots when the employee has no schedule for that day", async () => {
    const slots = await execute(createDependencies({
      hoursByEmployee: { "employee-laura": [] },
    }));
    expect(slots).toEqual([]);
  });

  it("returns no slots when the employee is closed that day", async () => {
    const slots = await execute(createDependencies({
      hoursByEmployee: {
        "employee-laura": [{ weekday: 5, is_closed: true }],
      },
    }));
    expect(slots).toEqual([]);
  });

  it("uses the intersection between business and employee hours", async () => {
    const slots = await execute(createDependencies({
      hours: [{
        day_of_week: 5, open_time: "09:00:00", close_time: "18:00:00",
        second_open_time: null, second_close_time: null, is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 5, is_closed: false,
          start_time: "10:00:00", end_time: "12:00:00",
          second_start_time: null, second_end_time: null,
        }],
      },
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });

  it("supports split business hours", async () => {
    const slots = await execute(createDependencies({
      hours: [{
        day_of_week: 5, open_time: "09:00:00", close_time: "10:00:00",
        second_open_time: "16:00:00", second_close_time: "17:00:00", is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 5, is_closed: false,
          start_time: "09:00:00", end_time: "10:00:00",
          second_start_time: "16:00:00", second_end_time: "17:00:00",
        }],
      },
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00", "09:30", "16:00", "16:30"]);
  });

  it("supports split employee hours", async () => {
    const slots = await execute(createDependencies({
      hours: [{
        day_of_week: 5, open_time: "09:00:00", close_time: "18:00:00",
        second_open_time: null, second_close_time: null, is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 5, is_closed: false,
          start_time: "09:00:00", end_time: "10:00:00",
          second_start_time: "16:00:00", second_end_time: "17:00:00",
        }],
      },
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00", "09:30", "16:00", "16:30"]);
  });

  it("removes all employee slots during a full-day absence", async () => {
    const slots = await execute(createDependencies({
      timeOffByEmployee: {
        "employee-laura": [{
          starts_at: "2026-09-24T22:00:00.000Z",
          ends_at: "2026-09-25T22:00:00.000Z",
        }],
      },
    }));
    expect(slots).toEqual([]);
  });

  it("removes only slots overlapping a partial absence", async () => {
    const slots = await execute(createDependencies({
      timeOffByEmployee: {
        "employee-laura": [{
          starts_at: "2026-09-25T07:30:00.000Z", // 09:30 Madrid
          ends_at: "2026-09-25T08:30:00.000Z",   // 10:30 Madrid
        }],
      },
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00", "10:30"]);
  });

  it("a Laura booking blocks Laura but not Marta", async () => {
    const slots = await execute(createDependencies({
      employees: [laura, marta],
      bookings: [{
        employee_id: "employee-laura",
        starts_at: "2026-09-25T07:30:00.000Z",
        ends_at: "2026-09-25T08:00:00.000Z",
        status: "confirmed",
      }],
    }));
    const slot0930 = slots.find((s) => s.localTime === "09:30");
    expect(slot0930.employees).toEqual([{ id: "employee-marta", name: "Marta" }]);
  });

  it("a legacy booking without employee blocks every employee", async () => {
    const slots = await execute(createDependencies({
      employees: [laura, marta],
      bookings: [{
        employee_id: null,
        starts_at: "2026-09-25T07:30:00.000Z",
        ends_at: "2026-09-25T08:00:00.000Z",
        status: "confirmed",
      }],
    }));
    expect(slots.find((s) => s.localTime === "09:30")).toBeUndefined();
  });

  it.each(["pending", "confirmed"])("%s bookings block availability", async (status) => {
    const slots = await execute(createDependencies({
      bookings: [{
        employee_id: "employee-laura",
        starts_at: "2026-09-25T07:30:00.000Z",
        ends_at: "2026-09-25T08:00:00.000Z",
        status,
      }],
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00", "10:00", "10:30"]);
  });

  it.each(["cancelled", "completed", "no_show"])("%s bookings do not block availability", async (status) => {
    const slots = await execute(createDependencies({
      bookings: [{
        employee_id: "employee-laura",
        starts_at: "2026-09-25T07:30:00.000Z",
        ends_at: "2026-09-25T08:00:00.000Z",
        status,
      }],
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("correctly maps Sunday to weekday 0 for business and employee", async () => {
    const slots = await execute(createDependencies({
      hours: [{
        day_of_week: 0, open_time: "10:00:00", close_time: "11:00:00",
        second_open_time: null, second_close_time: null, is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 0, is_closed: false,
          start_time: "10:00:00", end_time: "11:00:00",
          second_start_time: null, second_end_time: null,
        }],
      },
    }), { date: "2026-09-27" });
    expect(slots.map((s) => s.localTime)).toEqual(["10:00", "10:30"]);
  });

  it("allows a slot that finishes exactly at closing time", async () => {
    const slots = await execute(createDependencies({
      service: {
        id: "service-123", business_id: "business-123",
        name: "Largo", duration_minutes: 60, price: 30,
      },
      hours: [{
        day_of_week: 5, open_time: "09:00:00", close_time: "10:00:00",
        second_open_time: null, second_close_time: null, is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 5, is_closed: false,
          start_time: "09:00:00", end_time: "10:00:00",
          second_start_time: null, second_end_time: null,
        }],
      },
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00"]);
  });

  it("does not create a slot that finishes after closing time", async () => {
    const slots = await execute(createDependencies({
      service: {
        id: "service-123", business_id: "business-123",
        name: "Largo", duration_minutes: 45, price: 30,
      },
      hours: [{
        day_of_week: 5, open_time: "09:00:00", close_time: "10:00:00",
        second_open_time: null, second_close_time: null, is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 5, is_closed: false,
          start_time: "09:00:00", end_time: "10:00:00",
          second_start_time: null, second_end_time: null,
        }],
      },
    }));
    expect(slots.map((s) => s.localTime)).toEqual(["09:00"]);
  });

  it("returns no slots for a past date without querying downstream repositories", async () => {
    const dependencies = createDependencies();
    const slots = await execute(dependencies, { date: "2026-09-22" });
    expect(slots).toEqual([]);
    expect(dependencies.businessServiceRepository.findById).not.toHaveBeenCalled();
    expect(dependencies.businessHoursRepository.findByBusinessId).not.toHaveBeenCalled();
    expect(dependencies.employeeRepository.findByBusinessId).not.toHaveBeenCalled();
    expect(dependencies.bookingRepository.findByBusinessIdAndDateRange).not.toHaveBeenCalled();
  });

  it("removes past and current slots when availability is requested for today", async () => {
    const slots = await execute(createDependencies({
      hours: [{
        day_of_week: 3, open_time: "13:00:00", close_time: "16:00:00",
        second_open_time: null, second_close_time: null, is_closed: false,
      }],
      hoursByEmployee: {
        "employee-laura": [{
          weekday: 3, is_closed: false,
          start_time: "13:00:00", end_time: "16:00:00",
          second_start_time: null, second_end_time: null,
        }],
      },
    }), { date: "2026-09-23" });
    expect(slots.map((s) => s.localTime)).toEqual(["14:30", "15:00", "15:30"]);
  });

  it("returns no slots when the business is closed", async () => {
    const slots = await execute(createDependencies({
      hours: [{
        day_of_week: 5, open_time: null, close_time: null,
        second_open_time: null, second_close_time: null, is_closed: true,
      }],
    }));
    expect(slots).toEqual([]);
  });

  it("rejects a missing business", async () => {
    await expect(execute(createDependencies({ business: null }))).rejects.toMatchObject({
      message: "Business not found", statusCode: 404,
    });
  });

  it("rejects a missing service", async () => {
    await expect(execute(createDependencies({ service: null }))).rejects.toMatchObject({
      message: "Business service not found", statusCode: 404,
    });
  });

  it("rejects an invalid service duration", async () => {
    await expect(execute(createDependencies({
      service: {
        id: "service-123", business_id: "business-123",
        name: "Corte", duration_minutes: 0, price: 20,
      },
    }))).rejects.toMatchObject({
      message: "Business service requires a valid duration", statusCode: 400,
    });
  });

  it("rejects an invalid timezone", async () => {
    await expect(execute(createDependencies({
      business: { id: "business-123", timezone: "Invalid/Timezone" },
    }))).rejects.toMatchObject({
      message: "Business timezone is invalid", statusCode: 400,
    });
  });

  it("rejects an invalid slot interval", async () => {
    await expect(execute(createDependencies(), { slotIntervalMinutes: 0 })).rejects.toMatchObject({
      message: "slotIntervalMinutes must be a positive integer", statusCode: 400,
    });
  });
});
