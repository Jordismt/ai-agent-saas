import { describe, it, expect, vi } from "vitest";
import { CreateEmployee } from "../src/modules/employees/application/CreateEmployee.js";
import { GetBusinessEmployees } from "../src/modules/employees/application/GetBusinessEmployees.js";
import { GetEmployee } from "../src/modules/employees/application/GetEmployee.js";
import { UpdateEmployee } from "../src/modules/employees/application/UpdateEmployee.js";
import { DeactivateEmployee } from "../src/modules/employees/application/DeactivateEmployee.js";
import { GetEmployeeServices } from "../src/modules/employees/application/GetEmployeeServices.js";
import { UpdateEmployeeServices } from "../src/modules/employees/application/UpdateEmployeeServices.js";
import { GetEmployeeHours } from "../src/modules/employees/application/GetEmployeeHours.js";
import { UpdateEmployeeHours } from "../src/modules/employees/application/UpdateEmployeeHours.js";
import { GetEmployeeTimeOff } from "../src/modules/employees/application/GetEmployeeTimeOff.js";
import { CreateEmployeeTimeOff } from "../src/modules/employees/application/CreateEmployeeTimeOff.js";
import { UpdateEmployeeTimeOff } from "../src/modules/employees/application/UpdateEmployeeTimeOff.js";
import { DeleteEmployeeTimeOff } from "../src/modules/employees/application/DeleteEmployeeTimeOff.js";

describe("Employee use cases", () => {
  const employee = {
    id: "employee-123",
    business_id: "business-123",
    name: "Laura",
    email: "laura@example.com",
    phone: "600000000",
    active: true,
  };

  function repository(overrides = {}) {
    return {
      create: vi.fn(async (value) => ({ id: "employee-123", ...value })),
      findById: vi.fn(async () => employee),
      findByBusinessId: vi.fn(async () => [employee]),
      update: vi.fn(async (id, data) => ({ id, ...data })),
      deactivate: vi.fn(async () => ({ ...employee, active: false })),
      getServices: vi.fn(async () => [{ id: "service-123", name: "Corte" }]),
      replaceServices: vi.fn(async (_, ids) => ids.map((id) => ({ id }))),
      getHours: vi.fn(async () => [{ weekday: 1, start_time: "09:00:00", end_time: "17:00:00" }]),
      replaceHours: vi.fn(async (_, hours) => hours),
      getTimeOff: vi.fn(async () => []),
      findTimeOffById: vi.fn(async () => ({
        id: "time-off-123", employee_id: "employee-123",
        starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-10-02T00:00:00Z",
      })),
      createTimeOff: vi.fn(async (employeeId, data) => ({ id: "time-off-123", employee_id: employeeId, ...data })),
      updateTimeOff: vi.fn(async (id, data) => ({ id, ...data })),
      deleteTimeOff: vi.fn(async () => undefined),
      ...overrides,
    };
  }

  it("creates an active employee", async () => {
    const repo = repository();
    await new CreateEmployee(repo).execute({
      businessId: "business-123", name: "Laura",
      email: "laura@example.com", phone: "600000000",
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      businessId: "business-123", name: "Laura", active: true,
    }));
  });

  it("lists employees by business", async () => {
    const repo = repository();
    expect(await new GetBusinessEmployees(repo).execute("business-123")).toEqual([employee]);
    expect(repo.findByBusinessId).toHaveBeenCalledWith("business-123");
  });

  it("gets an employee", async () => {
    expect(await new GetEmployee(repository()).execute("employee-123")).toEqual(employee);
  });

  it("rejects a missing employee", async () => {
    await expect(new GetEmployee(repository({ findById: vi.fn(async () => null) }))
      .execute("missing")).rejects.toMatchObject({ message: "Employee not found", statusCode: 404 });
  });

  it("updates only supplied employee fields and preserves the rest", async () => {
    const repo = repository();
    await new UpdateEmployee(repo).execute("employee-123", { name: "Laura Gómez", phone: null });
    expect(repo.update).toHaveBeenCalledWith("employee-123", {
      name: "Laura Gómez",
      email: "laura@example.com",
      phone: null,
      active: true,
    });
  });

  it("rejects update for missing employee", async () => {
    const repo = repository({ findById: vi.fn(async () => null) });
    await expect(new UpdateEmployee(repo).execute("missing", { name: "X" }))
      .rejects.toMatchObject({ message: "Employee not found", statusCode: 404 });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("deactivates an active employee", async () => {
    const repo = repository();
    const result = await new DeactivateEmployee(repo).execute("employee-123");
    expect(repo.deactivate).toHaveBeenCalledWith("employee-123");
    expect(result.active).toBe(false);
  });

  it("does not deactivate an already inactive employee again", async () => {
    const inactive = { ...employee, active: false };
    const repo = repository({ findById: vi.fn(async () => inactive) });
    expect(await new DeactivateEmployee(repo).execute("employee-123")).toEqual(inactive);
    expect(repo.deactivate).not.toHaveBeenCalled();
  });

  it("gets employee services", async () => {
    const repo = repository();
    await new GetEmployeeServices(repo).execute("employee-123");
    expect(repo.getServices).toHaveBeenCalledWith("employee-123");
  });

  it("replaces employee services", async () => {
    const repo = repository();
    await new UpdateEmployeeServices(repo).execute("employee-123", ["service-1", "service-2"]);
    expect(repo.replaceServices).toHaveBeenCalledWith("employee-123", ["service-1", "service-2"]);
  });

  it("allows removing all employee services", async () => {
    const repo = repository();
    await new UpdateEmployeeServices(repo).execute("employee-123", []);
    expect(repo.replaceServices).toHaveBeenCalledWith("employee-123", []);
  });

  it("gets employee hours", async () => {
    const repo = repository();
    await new GetEmployeeHours(repo).execute("employee-123");
    expect(repo.getHours).toHaveBeenCalledWith("employee-123");
  });

  it("replaces employee hours", async () => {
    const hours = [{ weekday: 1, isClosed: false, startTime: "09:00", endTime: "17:00" }];
    const repo = repository();
    await new UpdateEmployeeHours(repo).execute("employee-123", hours);
    expect(repo.replaceHours).toHaveBeenCalledWith("employee-123", hours);
  });

  it("gets employee time off", async () => {
    const repo = repository();
    await new GetEmployeeTimeOff(repo).execute("employee-123");
    expect(repo.getTimeOff).toHaveBeenCalledWith("employee-123");
  });

  it("creates employee time off", async () => {
    const data = {
      startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-10-02T00:00:00Z",
      type: "vacation", notes: null,
    };
    const repo = repository();
    await new CreateEmployeeTimeOff(repo).execute("employee-123", data);
    expect(repo.createTimeOff).toHaveBeenCalledWith("employee-123", data);
  });

  it("updates time off belonging to the employee", async () => {
    const data = {
      startsAt: "2026-10-03T00:00:00Z", endsAt: "2026-10-04T00:00:00Z",
      type: "personal", notes: "Asunto personal",
    };
    const repo = repository();
    await new UpdateEmployeeTimeOff(repo).execute("employee-123", "time-off-123", data);
    expect(repo.updateTimeOff).toHaveBeenCalledWith("time-off-123", data);
  });

  it("rejects updating another employee's time off", async () => {
    const repo = repository({
      findTimeOffById: vi.fn(async () => ({ id: "time-off-123", employee_id: "employee-other" })),
    });
    await expect(new UpdateEmployeeTimeOff(repo).execute("employee-123", "time-off-123", {}))
      .rejects.toMatchObject({ message: "Employee time off not found", statusCode: 404 });
    expect(repo.updateTimeOff).not.toHaveBeenCalled();
  });

  it("deletes time off belonging to the employee", async () => {
    const repo = repository();
    await new DeleteEmployeeTimeOff(repo).execute("employee-123", "time-off-123");
    expect(repo.deleteTimeOff).toHaveBeenCalledWith("time-off-123");
  });

  it("rejects deleting another employee's time off", async () => {
    const repo = repository({
      findTimeOffById: vi.fn(async () => ({ id: "time-off-123", employee_id: "employee-other" })),
    });
    await expect(new DeleteEmployeeTimeOff(repo).execute("employee-123", "time-off-123"))
      .rejects.toMatchObject({ message: "Employee time off not found", statusCode: 404 });
    expect(repo.deleteTimeOff).not.toHaveBeenCalled();
  });

  it.each([
    ["services", GetEmployeeServices, "execute", ["employee-123"]],
    ["hours", GetEmployeeHours, "execute", ["employee-123"]],
    ["time off", GetEmployeeTimeOff, "execute", ["employee-123"]],
  ])("rejects %s lookup for a missing employee", async (_, UseCase, method, args) => {
    const repo = repository({ findById: vi.fn(async () => null) });
    await expect(new UseCase(repo)[method](...args))
      .rejects.toMatchObject({ message: "Employee not found", statusCode: 404 });
  });
});
