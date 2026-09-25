import { requireActiveBusiness } from "../../../shared/billing/requireActiveBusiness.js";
import { DateTime } from "luxon";

import { Booking, BOOKING_STATUSES } from "../domain/Booking.js";

import { AppError } from "../../../shared/errors/AppError.js";

import crypto from "node:crypto";

export class CreateBooking {
  constructor({
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    conversationRepository,
    leadRepository,
    employeeRepository,
    getAvailableSlots,
    sendBookingConfirmation = null,
  }) {
    this.bookingRepository = bookingRepository;
    this.businessRepository = businessRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.conversationRepository = conversationRepository;
    this.leadRepository = leadRepository;
    this.employeeRepository = employeeRepository;
    this.getAvailableSlots = getAvailableSlots;

    this.sendBookingConfirmation = sendBookingConfirmation;
  }

  async execute({
    businessId,
    serviceId,
    employeeId = null,
    conversationId = null,
    leadId = null,
    customerName,
    customerPhone = null,
    customerEmail = null,
    date,
    time,
    notes = null,
    allowWithoutEmail = false,
  }) {
    if (!businessId) {
      throw new AppError("Booking businessId is required", 400);
    }

    if (!serviceId) {
      throw new AppError("Booking serviceId is required", 400);
    }

    if (!date) {
      throw new AppError("Booking date is required", 400);
    }

    if (!time) {
      throw new AppError("Booking time is required", 400);
    }

    if (!customerName?.trim()) {
      throw new AppError("Booking customerName is required", 400);
    }

    if (!allowWithoutEmail && !customerEmail?.trim()) {
      throw new AppError("Booking customerEmail is required", 400);
    }

    await requireActiveBusiness(businessId);

    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    const timezone = business.timezone || "Europe/Madrid";

    const timezoneCheck = DateTime.now().setZone(timezone);

    if (!timezoneCheck.isValid) {
      throw new AppError("Business timezone is invalid", 400);
    }

    const service = await this.businessServiceRepository.findById(businessId, serviceId);

    if (!service) {
      throw new AppError("Business service not found", 404);
    }

    if (!Number.isInteger(service.duration_minutes) || service.duration_minutes <= 0) {
      throw new AppError("Business service requires a valid duration", 400);
    }

    /*
     * Si se ha solicitado un empleado concreto,
     * validamos que:
     *
     * - existe
     * - pertenece al negocio
     * - está activo
     * - realiza el servicio
     */
    if (employeeId) {
      const employee = await this.employeeRepository.findById(employeeId);

      if (!employee || employee.business_id !== businessId) {
        throw new AppError("Employee not found", 404);
      }

      if (!employee.active) {
        throw new AppError("Employee is not active", 409);
      }

      const employeeServices = await this.employeeRepository.getServices(employeeId);

      const canPerformService = employeeServices.some((item) => item.id === serviceId);

      if (!canPerformService) {
        throw new AppError("Employee does not perform this service", 409);
      }
    }

    if (conversationId) {
      const conversation = await this.conversationRepository.findById(conversationId);

      if (!conversation) {
        throw new AppError("Conversation not found", 404);
      }

      if (conversation.business_id !== businessId) {
        throw new AppError("Conversation does not belong to this business", 403);
      }
    }

    if (leadId) {
      const lead = await this.leadRepository.findById(leadId);

      if (!lead) {
        throw new AppError("Lead not found", 404);
      }

      if (lead.business_id !== businessId) {
        throw new AppError("Lead does not belong to this business", 403);
      }
    }

    const requestedLocalStart = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd HH:mm", {
      zone: timezone,
      setZone: true,
    });

    if (!requestedLocalStart.isValid) {
      throw new AppError("Invalid booking date or time", 400);
    }

    const now = DateTime.now().setZone(timezone);

    if (requestedLocalStart <= now) {
      throw new AppError("The selected time is in the past", 409);
    }

    /*
     * Si employeeId existe, disponibilidad solamente
     * para ese empleado.
     *
     * Si no existe, disponibilidad de cualquiera que
     * pueda realizar el servicio.
     */
    const availableSlots = await this.getAvailableSlots.execute({
      businessId,
      serviceId,
      date,
      employeeId,
    });

    const selectedSlot = availableSlots.find((slot) => {
      const slotStart = DateTime.fromISO(slot.startsAt, {
        setZone: true,
      }).setZone(timezone);

      if (!slotStart.isValid) {
        return false;
      }

      return slotStart.toISODate() === date && slotStart.toFormat("HH:mm") === time;
    });

    if (!selectedSlot) {
      throw new AppError("The selected time is not available", 409);
    }

    /*
     * Si el cliente eligió empleado, ese será
     * necesariamente el empleado del slot.
     *
     * Si dijo "me da igual", escogemos uno de
     * los disponibles.
     */
    const selectedEmployee = employeeId
      ? selectedSlot.employees.find((employee) => employee.id === employeeId)
      : selectedSlot.employees[0];

    if (!selectedEmployee) {
      throw new AppError("No employee is available for the selected time", 409);
    }

    /*
     * Segunda comprobación de conflicto.
     *
     * IMPORTANTE:
     * ahora tiene que comprobar por EMPLEADO.
     */
    const conflicts = await this.bookingRepository.findConflictingBookings(
      businessId,
      selectedSlot.startsAt,
      selectedSlot.endsAt,
      selectedEmployee.id,
    );

    if (conflicts.length > 0) {
      throw new AppError("The selected time is not available", 409);
    }

    const booking = new Booking({
      businessId,
      serviceId,
      employeeId: selectedEmployee.id,
      conversationId,
      leadId,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || null,
      customerEmail: customerEmail?.trim().toLowerCase() || null,
      serviceName: service.name,
      durationMinutes: service.duration_minutes,
      price: service.price,
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,
      status: BOOKING_STATUSES.CONFIRMED,
      notes,
      allowWithoutEmail,
    });

    /*
     * Generamos un token secreto para que el cliente pueda gestionar
     * únicamente esta reserva desde el enlace recibido por email.
     */
    const managementToken = crypto.randomBytes(32).toString("hex");

    /*
     * Nunca guardamos el token real en la base de datos.
     * Solo almacenamos su SHA-256.
     */
    const managementTokenHash = crypto.createHash("sha256").update(managementToken).digest("hex");

    /*
     * Primero creamos la reserva.
     *
     * Si esto falla, no se envía ningún email porque realmente
     * no existe ninguna reserva.
     */
    const createdBooking = await this.bookingRepository.create(booking, managementTokenHash);

    /*
     * La reserva ya está creada.
     *
     * El email es un efecto secundario: si Resend falla,
     * NO hacemos fallar toda la operación porque provocaríamos
     * que el cliente creyera que la reserva no existe.
     */
    if (this.sendBookingConfirmation && createdBooking.customer_email) {
      try {
        await this.sendBookingConfirmation.execute({
          booking: createdBooking,
          business,
          managementToken,
        });
      } catch (error) {
        console.error("Failed to send booking confirmation email:", {
          bookingId: createdBooking.id,
          error,
        });
      }
    }

    return createdBooking;
  }
}
