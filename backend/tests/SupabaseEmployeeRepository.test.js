import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseEmployeeRepository } from "../src/modules/employees/infrastructure/SupabaseEmployeeRepository.js";

describe("SupabaseEmployeeRepository", () => {
  const supabase = { from: vi.fn() };
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseEmployeeRepository(supabase);
  });

  it("creates an employee using snake_case database fields", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "employee-1" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    supabase.from.mockReturnValue({ insert });

    await repository.create({
      businessId: "business-123", name: "Laura",
      email: "laura@example.com", phone: "600000000", active: true,
    });

    expect(insert).toHaveBeenCalledWith({
      business_id: "business-123",
      name: "Laura",
      email: "laura@example.com",
      phone: "600000000",
      active: true,
    });
  });

  it("maps joined employee services to business service objects", async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        { service_id: "service-1", business_services: { id: "service-1", name: "Corte", duration_minutes: 30, price: 20 } },
        { service_id: "service-2", business_services: null },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ eq });
    supabase.from.mockReturnValue({ select });

    const result = await repository.getServices("employee-1");
    expect(result).toEqual([{ id: "service-1", name: "Corte", duration_minutes: 30, price: 20 }]);
    expect(eq).toHaveBeenCalledWith("employee_id", "employee-1");
  });

  it("rejects assigning a service from another business", async () => {
    vi.spyOn(repository, "findById").mockResolvedValue({
      id: "employee-1", business_id: "business-123",
    });

    const inMock = vi.fn().mockResolvedValue({
      data: [{ id: "service-other", business_id: "business-other" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ in: inMock });
    supabase.from.mockReturnValue({ select });

    await expect(repository.replaceServices("employee-1", ["service-other"]))
      .rejects.toMatchObject({
        message: "All services must belong to the employee business",
        statusCode: 400,
      });
  });

  it("rejects assigning services that do not all exist", async () => {
    vi.spyOn(repository, "findById").mockResolvedValue({
      id: "employee-1", business_id: "business-123",
    });

    const inMock = vi.fn().mockResolvedValue({
      data: [{ id: "service-1", business_id: "business-123" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ in: inMock });
    supabase.from.mockReturnValue({ select });

    await expect(repository.replaceServices("employee-1", ["service-1", "service-missing"]))
      .rejects.toMatchObject({
        message: "One or more services do not exist",
        statusCode: 400,
      });
  });

  it("clears employee services when an empty list is supplied", async () => {
    vi.spyOn(repository, "findById").mockResolvedValue({
      id: "employee-1", business_id: "business-123",
    });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    supabase.from.mockReturnValue({ delete: deleteMock });

    expect(await repository.replaceServices("employee-1", [])).toEqual([]);
    expect(eq).toHaveBeenCalledWith("employee_id", "employee-1");
  });

  it("stores closed employee days with null times", async () => {
    vi.spyOn(repository, "findById").mockResolvedValue({ id: "employee-1" });
    vi.spyOn(repository, "getHours").mockResolvedValue([{ weekday: 1, is_closed: true }]);

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteEq });
    const insert = vi.fn().mockResolvedValue({ error: null });

    supabase.from.mockImplementation((table) => {
      if (table === "employee_hours") return { delete: deleteMock, insert };
      throw new Error(`Unexpected table ${table}`);
    });

    await repository.replaceHours("employee-1", [{
      weekday: 1, isClosed: true,
      startTime: "09:00", endTime: "17:00",
      secondStartTime: "18:00", secondEndTime: "20:00",
    }]);

    expect(insert).toHaveBeenCalledWith([{
      employee_id: "employee-1",
      weekday: 1,
      is_closed: true,
      start_time: null,
      end_time: null,
      second_start_time: null,
      second_end_time: null,
    }]);
  });

  it("creates employee time off with database field names", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "off-1" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    supabase.from.mockReturnValue({ insert });

    await repository.createTimeOff("employee-1", {
      startsAt: "2026-10-01T08:00:00Z",
      endsAt: "2026-10-02T08:00:00Z",
      type: "vacation",
      notes: "Viaje",
    });

    expect(insert).toHaveBeenCalledWith({
      employee_id: "employee-1",
      starts_at: "2026-10-01T08:00:00Z",
      ends_at: "2026-10-02T08:00:00Z",
      type: "vacation",
      notes: "Viaje",
    });
  });
});
