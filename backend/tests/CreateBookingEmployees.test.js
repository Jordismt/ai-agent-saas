import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CreateBooking } from "../src/modules/bookings/application/CreateBooking.js";

describe("CreateBooking - employees", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T12:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  const laura = { id: "employee-laura", business_id: "business-123", name: "Laura", active: true };
  const marta = { id: "employee-marta", business_id: "business-123", name: "Marta", active: true };

  function dependencies({
    employee = laura,
    employeeServices = [{ id: "service-123" }],
    availableSlots = [{
      startsAt: "2026-09-25T15:00:00.000Z",
      endsAt: "2026-09-25T15:30:00.000Z",
      localTime: "17:00",
      employees: [
        { id: "employee-laura", name: "Laura" },
        { id: "employee-marta", name: "Marta" },
      ],
    }],
    conflicts = [],
  } = {}) {
    return {
      bookingRepository: {
        findConflictingBookings: vi.fn(async () => conflicts),
        create: vi.fn(async (booking) => booking),
      },
      businessRepository: {
        findById: vi.fn(async () => ({ id: "business-123", timezone: "Europe/Madrid" })),
      },
      businessServiceRepository: {
        findById: vi.fn(async () => ({
          id: "service-123", business_id: "business-123",
          name: "Corte", price: 20, duration_minutes: 30,
        })),
      },
      conversationRepository: { findById: vi.fn(async () => null) },
      leadRepository: { findById: vi.fn(async () => null) },
      employeeRepository: {
        findById: vi.fn(async () => employee),
        getServices: vi.fn(async () => employeeServices),
      },
      getAvailableSlots: { execute: vi.fn(async () => availableSlots) },
    };
  }

  const input = {
    businessId: "business-123",
    serviceId: "service-123",
    customerName: "Jordi",
    customerPhone: "600000000",
    date: "2026-09-25",
    time: "17:00",
  };

  it("creates a booking for an explicitly selected employee", async () => {
    const deps = dependencies();
    const booking = await new CreateBooking(deps).execute({ ...input, employeeId: "employee-laura" });
    expect(booking.employeeId).toBe("employee-laura");
    expect(deps.employeeRepository.findById).toHaveBeenCalledWith("employee-laura");
    expect(deps.employeeRepository.getServices).toHaveBeenCalledWith("employee-laura");
    expect(deps.getAvailableSlots.execute).toHaveBeenCalledWith({
      businessId: "business-123", serviceId: "service-123",
      date: "2026-09-25", employeeId: "employee-laura",
    });
    expect(deps.bookingRepository.findConflictingBookings).toHaveBeenCalledWith(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      "employee-laura",
    );
  });

  it("automatically assigns the first available employee when none is requested", async () => {
    const deps = dependencies();
    const booking = await new CreateBooking(deps).execute(input);
    expect(booking.employeeId).toBe("employee-laura");
    expect(deps.employeeRepository.findById).not.toHaveBeenCalled();
    expect(deps.bookingRepository.findConflictingBookings).toHaveBeenCalledWith(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      "employee-laura",
    );
  });

  it("rejects an employee from another business", async () => {
    const deps = dependencies({
      employee: { ...laura, business_id: "business-other" },
    });
    await expect(new CreateBooking(deps).execute({ ...input, employeeId: "employee-laura" }))
      .rejects.toMatchObject({ message: "Employee not found", statusCode: 404 });
    expect(deps.getAvailableSlots.execute).not.toHaveBeenCalled();
  });

  it("rejects a missing employee", async () => {
    const deps = dependencies({ employee: null });
    await expect(new CreateBooking(deps).execute({ ...input, employeeId: "employee-laura" }))
      .rejects.toMatchObject({ message: "Employee not found", statusCode: 404 });
  });

  it("rejects an inactive employee", async () => {
    const deps = dependencies({ employee: { ...laura, active: false } });
    await expect(new CreateBooking(deps).execute({ ...input, employeeId: "employee-laura" }))
      .rejects.toMatchObject({ message: "Employee is not active", statusCode: 409 });
    expect(deps.getAvailableSlots.execute).not.toHaveBeenCalled();
  });

  it("rejects an employee that does not perform the service", async () => {
    const deps = dependencies({ employeeServices: [{ id: "service-other" }] });
    await expect(new CreateBooking(deps).execute({ ...input, employeeId: "employee-laura" }))
      .rejects.toMatchObject({ message: "Employee does not perform this service", statusCode: 409 });
    expect(deps.getAvailableSlots.execute).not.toHaveBeenCalled();
  });

  it("rejects a requested employee not present in the selected slot", async () => {
    const deps = dependencies({
      availableSlots: [{
        startsAt: "2026-09-25T15:00:00.000Z",
        endsAt: "2026-09-25T15:30:00.000Z",
        localTime: "17:00",
        employees: [{ id: "employee-marta", name: "Marta" }],
      }],
    });
    await expect(new CreateBooking(deps).execute({ ...input, employeeId: "employee-laura" }))
      .rejects.toMatchObject({
        message: "No employee is available for the selected time", statusCode: 409,
      });
  });

  it("rejects a slot with no available employees", async () => {
    const deps = dependencies({
      availableSlots: [{
        startsAt: "2026-09-25T15:00:00.000Z",
        endsAt: "2026-09-25T15:30:00.000Z",
        localTime: "17:00",
        employees: [],
      }],
    });
    await expect(new CreateBooking(deps).execute(input)).rejects.toMatchObject({
      message: "No employee is available for the selected time", statusCode: 409,
    });
  });

  it("rechecks conflicts for the selected employee before insert", async () => {
    const deps = dependencies({ conflicts: [{ id: "existing" }] });
    await expect(new CreateBooking(deps).execute(input)).rejects.toMatchObject({
      message: "The selected time is not available", statusCode: 409,
    });
    expect(deps.bookingRepository.create).not.toHaveBeenCalled();
  });

  it("can book Marta at the same time when Laura is not the selected resource", async () => {
    const deps = dependencies({
      availableSlots: [{
        startsAt: "2026-09-25T15:00:00.000Z",
        endsAt: "2026-09-25T15:30:00.000Z",
        localTime: "17:00",
        employees: [{ id: "employee-marta", name: "Marta" }],
      }],
    });
    const booking = await new CreateBooking(deps).execute(input);
    expect(booking.employeeId).toBe("employee-marta");
    expect(deps.bookingRepository.findConflictingBookings).toHaveBeenCalledWith(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      "employee-marta",
    );
  });
});
