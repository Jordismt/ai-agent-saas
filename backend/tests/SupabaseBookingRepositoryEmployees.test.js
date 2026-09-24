import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseBookingRepository } from "../src/modules/bookings/infrastructure/SupabaseBookingRepository.js";

describe("SupabaseBookingRepository - employees", () => {
  const mockSupabase = { from: vi.fn() };
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseBookingRepository(mockSupabase);
  });

  it("persists employee_id when creating a booking", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "booking-1" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mockSupabase.from.mockReturnValue({ insert });

    await repository.create({
      businessId: "business-123",
      serviceId: "service-123",
      employeeId: "employee-laura",
      conversationId: null,
      leadId: null,
      customerName: "Jordi",
      customerPhone: "600000000",
      customerEmail: null,
      serviceName: "Corte",
      durationMinutes: 30,
      price: 20,
      startsAt: "2026-09-25T15:00:00.000Z",
      endsAt: "2026-09-25T15:30:00.000Z",
      status: "confirmed",
      notes: null,
    });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      business_id: "business-123",
      employee_id: "employee-laura",
    }));
  });

  it("checks conflicts for the requested employee only", async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: "booking-existing" }], error: null });
    const gt = vi.fn().mockReturnValue({ order });
    const lt = vi.fn().mockReturnValue({ gt });
    const inMock = vi.fn().mockReturnValue({ lt });
    const eqEmployee = vi.fn().mockReturnValue({ in: inMock });
    const eqBusiness = vi.fn().mockReturnValue({ eq: eqEmployee });
    const select = vi.fn().mockReturnValue({ eq: eqBusiness });
    mockSupabase.from.mockReturnValue({ select });

    const result = await repository.findConflictingBookings(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      "employee-laura",
    );

    expect(result).toEqual([{ id: "booking-existing" }]);
    expect(eqBusiness).toHaveBeenCalledWith("business_id", "business-123");
    expect(eqEmployee).toHaveBeenCalledWith("employee_id", "employee-laura");
    expect(inMock).toHaveBeenCalledWith("status", ["pending", "confirmed"]);
    expect(lt).toHaveBeenCalledWith("starts_at", "2026-09-25T15:30:00.000Z");
    expect(gt).toHaveBeenCalledWith("ends_at", "2026-09-25T15:00:00.000Z");
  });

  it("rejects conflict checks without employeeId", async () => {
    await expect(repository.findConflictingBookings(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      null,
    )).rejects.toMatchObject({
      message: "employeeId is required to check booking conflicts",
      statusCode: 400,
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("wraps database errors from employee conflict query", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } });
    const gt = vi.fn().mockReturnValue({ order });
    const lt = vi.fn().mockReturnValue({ gt });
    const inMock = vi.fn().mockReturnValue({ lt });
    const eqEmployee = vi.fn().mockReturnValue({ in: inMock });
    const eqBusiness = vi.fn().mockReturnValue({ eq: eqEmployee });
    const select = vi.fn().mockReturnValue({ eq: eqBusiness });
    mockSupabase.from.mockReturnValue({ select });

    await expect(repository.findConflictingBookings(
      "business-123",
      "2026-09-25T15:00:00.000Z",
      "2026-09-25T15:30:00.000Z",
      "employee-laura",
    )).rejects.toMatchObject({
      message: "Failed to find conflicting bookings: Database error",
      statusCode: 500,
    });
  });
});
