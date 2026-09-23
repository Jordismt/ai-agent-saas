import { DateTime } from "luxon";

import { Booking, BOOKING_STATUSES } from "../domain/Booking.js";

import { AppError } from "../../../shared/errors/AppError.js";

export class CreateBooking {
  constructor({
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    conversationRepository,
    leadRepository,
    getAvailableSlots,
  }) {
    this.bookingRepository = bookingRepository;
    this.businessRepository = businessRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.conversationRepository = conversationRepository;
    this.leadRepository = leadRepository;
    this.getAvailableSlots = getAvailableSlots;
  }

  async execute({
    businessId,
    serviceId,
    conversationId = null,
    leadId = null,
    customerName,
    customerPhone = null,
    customerEmail = null,
    date,
    time,
    notes = null,
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

    if (!customerPhone && !customerEmail) {
      throw new AppError("Booking requires a phone or email", 400);
    }

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
     * Si la reserva pertenece a una conversación,
     * comprobamos que realmente pertenece al negocio.
     */
    if (conversationId) {
      const conversation = await this.conversationRepository.findById(conversationId);

      if (!conversation) {
        throw new AppError("Conversation not found", 404);
      }

      if (conversation.business_id !== businessId) {
        throw new AppError("Conversation does not belong to this business", 403);
      }
    }

    /*
     * Igual para el lead.
     */
    if (leadId) {
      const lead = await this.leadRepository.findById(leadId);

      if (!lead) {
        throw new AppError("Lead not found", 404);
      }

      if (lead.business_id !== businessId) {
        throw new AppError("Lead does not belong to this business", 403);
      }
    }

    /*
     * Construimos nosotros la fecha/hora local.
     *
     * La IA solamente proporciona:
     *
     * date = 2026-09-24
     * time = 17:00
     *
     * Luxon se encarga de Europe/Madrid y del offset
     * correcto para esa fecha.
     */
    const requestedLocalStart = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd HH:mm", {
      zone: timezone,
      setZone: true,
    });

    if (!requestedLocalStart.isValid) {
      throw new AppError("Invalid booking date or time", 400);
    }

    /*
     * Protección adicional:
     * no permitimos crear reservas en el pasado.
     */
    const now = DateTime.now().setZone(timezone);

    if (requestedLocalStart <= now) {
      throw new AppError("The selected time is in the past", 409);
    }

    /*
     * Pedimos al motor de disponibilidad los slots
     * REALES para ese servicio y esa fecha.
     */
    const availableSlots = await this.getAvailableSlots.execute({
      businessId,
      serviceId,
      date,
    });

    /*
     * No comparamos strings ni dejamos que la IA
     * decida el timestamp.
     *
     * Convertimos cada slot real a la timezone del
     * negocio y comprobamos fecha + hora local.
     */
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
     * Segunda comprobación inmediatamente antes
     * de insertar.
     *
     * La exclusion constraint de PostgreSQL sigue
     * siendo la última protección contra carreras.
     */
    const conflicts = await this.bookingRepository.findConflictingBookings(
      businessId,
      selectedSlot.startsAt,
      selectedSlot.endsAt,
    );

    if (conflicts.length > 0) {
      throw new AppError("The selected time is not available", 409);
    }

    const booking = new Booking({
      businessId,
      serviceId,
      conversationId,
      leadId,

      customerName: customerName.trim(),
      customerPhone,
      customerEmail,

      /*
       * Snapshot real del servicio.
       */
      serviceName: service.name,
      durationMinutes: service.duration_minutes,
      price: service.price,

      /*
       * Guardamos exactamente los timestamps del
       * slot generado por nuestro backend.
       */
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,

      status: BOOKING_STATUSES.CONFIRMED,

      notes,
    });

    return this.bookingRepository.create(booking);
  }
}
