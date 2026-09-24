import { DateTime } from "luxon";

import { AppError } from "../../../shared/errors/AppError.js";

export class RescheduleManagedBooking {
  constructor({
    getManagedBooking,
    getAvailableSlots,
    bookingRepository,
    businessRepository,
    sendBookingRescheduled = null,
  }) {
    this.getManagedBooking = getManagedBooking;

    this.getAvailableSlots = getAvailableSlots;

    this.bookingRepository = bookingRepository;

    this.businessRepository = businessRepository;

    this.sendBookingRescheduled = sendBookingRescheduled;
  }

  async execute({ token, date, time, employeeId = null }) {
    if (!date) {
      throw new AppError("Date is required", 400);
    }

    if (!time) {
      throw new AppError("Time is required", 400);
    }

    const booking = await this.getManagedBooking.execute(token);

    if (booking.status === "cancelled") {
      throw new AppError("Cancelled bookings cannot be rescheduled", 409);
    }

    if (booking.status === "completed" || booking.status === "no_show") {
      throw new AppError("This booking can no longer be rescheduled", 409);
    }

    const currentStartsAt = new Date(booking.starts_at);

    if (Number.isNaN(currentStartsAt.getTime()) || currentStartsAt.getTime() <= Date.now()) {
      throw new AppError("Past bookings cannot be rescheduled", 409);
    }

    const previousStartsAt = booking.starts_at;

    const business = await this.businessRepository.findById(booking.business_id);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    const timezone = business.timezone || "Europe/Madrid";

    const requestedLocalStart = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd HH:mm", {
      zone: timezone,
      setZone: true,
    });

    if (!requestedLocalStart.isValid) {
      throw new AppError("Invalid booking date or time", 400);
    }

    if (requestedLocalStart <= DateTime.now().setZone(timezone)) {
      throw new AppError("The selected time is in the past", 409);
    }

    /*
     * Si employeeId es null:
     * buscamos disponibilidad de cualquier
     * profesional que pueda realizar el servicio.
     *
     * Si existe:
     * solo buscamos ese profesional.
     */
    const slots = await this.getAvailableSlots.execute({
      businessId: booking.business_id,

      serviceId: booking.service_id,

      date,

      employeeId: employeeId || null,
    });

    const selectedSlot = slots.find((slot) => {
      const slotStart = DateTime.fromISO(slot.startsAt, {
        setZone: true,
      }).setZone(timezone);

      return slotStart.isValid && slotStart.toISODate() === date && slotStart.toFormat("HH:mm") === time;
    });

    if (!selectedSlot) {
      throw new AppError("The selected time is not available", 409);
    }

    /*
     * Si el cliente eligió profesional:
     * usamos exactamente ese.
     *
     * Si eligió "cualquier profesional":
     * asignamos uno de los disponibles
     * para ese slot.
     */
    const selectedEmployee = employeeId
      ? selectedSlot.employees?.find((employee) => employee.id === employeeId)
      : selectedSlot.employees?.[0];

    if (!selectedEmployee) {
      throw new AppError("No employee is available for the selected time", 409);
    }

    const conflicts = await this.bookingRepository.findConflictingBookings(
      booking.business_id,
      selectedSlot.startsAt,
      selectedSlot.endsAt,
      selectedEmployee.id,
    );

    const realConflicts = conflicts.filter((conflict) => conflict.id !== booking.id);

    if (realConflicts.length > 0) {
      throw new AppError("The selected time is not available", 409);
    }

    const rescheduledBooking = await this.bookingRepository.reschedule(
      booking.id,
      selectedSlot.startsAt,
      selectedSlot.endsAt,
      selectedEmployee.id,
    );

    /*
     * El email se envía después.
     * Si falla, la modificación sigue siendo válida.
     */
    if (this.sendBookingRescheduled) {
      try {
        await this.sendBookingRescheduled.execute({
          booking: rescheduledBooking,

          business,

          managementToken: token,

          previousStartsAt,
        });
      } catch (error) {
        console.error("Failed to send booking rescheduled email:", {
          bookingId: rescheduledBooking.id,
          error,
        });
      }
    }

    return rescheduledBooking;
  }
}
