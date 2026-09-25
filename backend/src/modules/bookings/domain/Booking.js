import { AppError } from "../../../shared/errors/AppError.js";

export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

const VALID_BOOKING_STATUSES = Object.values(BOOKING_STATUSES);

function normalizeOptionalString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

export class Booking {
  constructor({
    id = null,
    businessId,
    serviceId,
    employeeId = null,
    conversationId = null,
    leadId = null,
    customerName,
    customerPhone = null,
    customerEmail = null,
    serviceName,
    durationMinutes,
    price = null,
    startsAt,
    endsAt,
    status = BOOKING_STATUSES.CONFIRMED,
    notes = null,
    createdAt = null,
    updatedAt = null,
    allowWithoutEmail = false,
  }) {
    if (!businessId) {
      throw new AppError("Booking businessId is required", 400);
    }

    if (!serviceId) {
      throw new AppError("Booking serviceId is required", 400);
    }

    const normalizedCustomerName = normalizeOptionalString(customerName);

    const normalizedCustomerPhone = normalizeOptionalString(customerPhone);

    const normalizedCustomerEmail = normalizeOptionalString(customerEmail);

    const normalizedServiceName = normalizeOptionalString(serviceName);

    const normalizedNotes = normalizeOptionalString(notes);

    if (!normalizedCustomerName) {
      throw new AppError("Booking customerName is required", 400);
    }

    if (!allowWithoutEmail && !normalizedCustomerEmail) {
      throw new AppError("Booking customerEmail is required", 400);
    }
    if (!normalizedServiceName) {
      throw new AppError("Booking serviceName is required", 400);
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new AppError("Booking durationMinutes must be a positive integer", 400);
    }

    if (!startsAt || !endsAt) {
      throw new AppError("Booking start and end dates are required", 400);
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new AppError("Invalid booking dates", 400);
    }

    if (endDate <= startDate) {
      throw new AppError("Booking end date must be after start date", 400);
    }

    if (!VALID_BOOKING_STATUSES.includes(status)) {
      throw new AppError(`Invalid booking status: ${status}`, 400);
    }

    this.id = id;
    this.businessId = businessId;
    this.serviceId = serviceId;
    this.employeeId = employeeId;
    this.conversationId = conversationId;
    this.leadId = leadId;

    this.customerName = normalizedCustomerName;

    this.customerPhone = normalizedCustomerPhone;

    this.customerEmail = normalizedCustomerEmail;

    this.serviceName = normalizedServiceName;

    this.durationMinutes = durationMinutes;

    this.price = price;

    this.startsAt = startDate.toISOString();

    this.endsAt = endDate.toISOString();

    this.status = status;
    this.notes = normalizedNotes;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
