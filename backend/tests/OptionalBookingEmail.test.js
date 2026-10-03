import { describe, it, expect, vi } from "vitest";
import { createBookingSchema } from "../src/modules/bookings/application/createBookingSchema.js";
import { adminCreateBookingSchema, adminUpdateBookingSchema } from "../src/modules/bookings/application/adminBookingSchemas.js";
import { agentResponseSchema } from "../src/infrastructure/ai/agentResponseSchema.js";
import { Booking } from "../src/modules/bookings/domain/Booking.js";
import { SendBookingConfirmation } from "../src/modules/notifications/application/SendBookingConfirmation.js";
import { SendBookingReminder } from "../src/modules/notifications/application/SendBookingReminder.js";
import { SendBookingCancellation } from "../src/modules/notifications/application/SendBookingCancellation.js";
import { SendBookingRescheduled } from "../src/modules/notifications/application/SendBookingRescheduled.js";

const input = {
  businessId: "11111111-1111-4111-8111-111111111111",
  serviceId: "22222222-2222-4222-8222-222222222222",
  customerName: "Jordi", customerPhone: "600000000",
  date: "2099-09-25", time: "17:00",
};
const schemas = [createBookingSchema, adminCreateBookingSchema, adminUpdateBookingSchema];

describe("Optional booking email", () => {
  it.each([undefined, null, "", "jordi@example.com"])("accepts email %s in public, admin and agent schemas", (customerEmail) => {
    const data = { ...input, customerEmail };
    for (const schema of schemas) expect(schema.safeParse(data).success).toBe(true);
    expect(agentResponseSchema.safeParse({ content: "Perfecto", action: { type: "create_booking", data } }).success).toBe(true);
  });

  it.each([undefined, null, "", "   "])("rejects missing phone %s even with email", (customerPhone) => {
    const data = { ...input, customerPhone, customerEmail: "jordi@example.com" };
    for (const schema of schemas) expect(schema.safeParse(data).success).toBe(false);
    expect(agentResponseSchema.safeParse({ content: "Perfecto", action: { type: "create_booking", data } }).success).toBe(false);
  });

  it("still rejects invalid email and missing name", () => {
    for (const schema of schemas) {
      expect(schema.safeParse({ ...input, customerEmail: "invalid" }).success).toBe(false);
      expect(schema.safeParse({ ...input, customerName: " " }).success).toBe(false);
    }
    expect(agentResponseSchema.safeParse({ content: "Perfecto", action: {
      type: "create_booking", data: { ...input, customerEmail: "invalid" },
    } }).success).toBe(false);
  });

  it("normalizes absent email in the domain and requires phone", () => {
    const data = { ...input, serviceName: "Corte", durationMinutes: 30,
      startsAt: "2099-09-25T15:00:00Z", endsAt: "2099-09-25T15:30:00Z" };
    expect(new Booking(data).customerEmail).toBeNull();
    expect(() => new Booking({ ...data, customerPhone: null, customerEmail: "jordi@example.com" }))
      .toThrow("Booking customerPhone is required");
  });

  for (const [UseCase, method] of [
    [SendBookingConfirmation, "sendBookingConfirmation"],
    [SendBookingReminder, "sendBookingReminder"],
    [SendBookingCancellation, "sendBookingCancellation"],
    [SendBookingRescheduled, "sendBookingRescheduled"],
  ]) {
    it.each([undefined, null, ""])(`${method} skips absent email %s`, async (customer_email) => {
      const emailService = { [method]: vi.fn() };
      await new UseCase(emailService).execute({ booking: { customer_email }, business: {} });
      expect(emailService[method]).not.toHaveBeenCalled();
    });
    it(`${method} still sends with email`, async () => {
      const emailService = { [method]: vi.fn() };
      await new UseCase(emailService).execute({ booking: { customer_email: "jordi@example.com" }, business: {} });
      expect(emailService[method]).toHaveBeenCalledWith(expect.objectContaining({ to: "jordi@example.com" }));
    });
  }
});
