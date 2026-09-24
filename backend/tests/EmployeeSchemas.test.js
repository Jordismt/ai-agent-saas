import { describe, it, expect } from "vitest";
import { createEmployeeSchema } from "../src/modules/employees/presentation/schemas/createEmployeeSchema.js";
import { updateEmployeeSchema } from "../src/modules/employees/presentation/schemas/updateEmployeeSchema.js";
import { updateEmployeeServicesSchema } from "../src/modules/employees/presentation/schemas/updateEmployeeServicesSchema.js";
import { updateEmployeeHoursSchema } from "../src/modules/employees/presentation/schemas/updateEmployeeHoursSchema.js";
import { createEmployeeTimeOffSchema } from "../src/modules/employees/presentation/schemas/createEmployeeTimeOffSchema.js";

describe("Employee schemas", () => {
  it("accepts a valid employee", () => {
    expect(createEmployeeSchema.parse({
      name: " Laura ", email: "laura@example.com", phone: "600000000",
    })).toEqual({ name: "Laura", email: "laura@example.com", phone: "600000000" });
  });

  it("rejects an empty employee name", () => {
    expect(() => createEmployeeSchema.parse({ name: "   " })).toThrow();
  });

  it("rejects invalid employee email", () => {
    expect(() => createEmployeeSchema.parse({ name: "Laura", email: "bad" })).toThrow();
  });

  it("requires at least one update field", () => {
    expect(() => updateEmployeeSchema.parse({})).toThrow();
  });

  it("accepts activation changes", () => {
    expect(updateEmployeeSchema.parse({ active: false })).toEqual({ active: false });
  });

  it("accepts an empty service list", () => {
    expect(updateEmployeeServicesSchema.parse({ serviceIds: [] })).toEqual({ serviceIds: [] });
  });

  it("rejects duplicate service ids", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(() => updateEmployeeServicesSchema.parse({ serviceIds: [id, id] })).toThrow();
  });

  it("rejects invalid service ids", () => {
    expect(() => updateEmployeeServicesSchema.parse({ serviceIds: ["service-1"] })).toThrow();
  });

  it("accepts normal employee hours", () => {
    expect(updateEmployeeHoursSchema.parse({
      hours: [{ weekday: 1, isClosed: false, startTime: "09:00", endTime: "17:00" }],
    }).hours).toHaveLength(1);
  });

  it("accepts split employee hours", () => {
    expect(updateEmployeeHoursSchema.parse({
      hours: [{
        weekday: 1, isClosed: false,
        startTime: "09:00", endTime: "14:00",
        secondStartTime: "16:00", secondEndTime: "20:00",
      }],
    }).hours).toHaveLength(1);
  });

  it("accepts a closed day without times", () => {
    expect(updateEmployeeHoursSchema.parse({
      hours: [{ weekday: 0, isClosed: true }],
    }).hours[0].isClosed).toBe(true);
  });

  it("rejects open days without first period", () => {
    expect(() => updateEmployeeHoursSchema.parse({
      hours: [{ weekday: 1, isClosed: false }],
    })).toThrow();
  });

  it("rejects start >= end", () => {
    expect(() => updateEmployeeHoursSchema.parse({
      hours: [{ weekday: 1, isClosed: false, startTime: "17:00", endTime: "09:00" }],
    })).toThrow();
  });

  it("rejects an incomplete second period", () => {
    expect(() => updateEmployeeHoursSchema.parse({
      hours: [{
        weekday: 1, isClosed: false,
        startTime: "09:00", endTime: "14:00",
        secondStartTime: "16:00",
      }],
    })).toThrow();
  });

  it("rejects overlapping periods", () => {
    expect(() => updateEmployeeHoursSchema.parse({
      hours: [{
        weekday: 1, isClosed: false,
        startTime: "09:00", endTime: "14:00",
        secondStartTime: "13:00", secondEndTime: "18:00",
      }],
    })).toThrow();
  });

  it("rejects duplicated weekdays", () => {
    expect(() => updateEmployeeHoursSchema.parse({
      hours: [
        { weekday: 1, isClosed: true },
        { weekday: 1, isClosed: true },
      ],
    })).toThrow();
  });

  it("accepts valid time off and defaults type to other", () => {
    const parsed = createEmployeeTimeOffSchema.parse({
      startsAt: "2026-10-01T08:00:00+02:00",
      endsAt: "2026-10-01T10:00:00+02:00",
    });
    expect(parsed.type).toBe("other");
  });

  it("rejects time off whose end is not after its start", () => {
    expect(() => createEmployeeTimeOffSchema.parse({
      startsAt: "2026-10-01T10:00:00+02:00",
      endsAt: "2026-10-01T08:00:00+02:00",
      type: "vacation",
    })).toThrow();
  });

  it("rejects unsupported time-off types", () => {
    expect(() => createEmployeeTimeOffSchema.parse({
      startsAt: "2026-10-01T08:00:00+02:00",
      endsAt: "2026-10-01T10:00:00+02:00",
      type: "holiday",
    })).toThrow();
  });
});
