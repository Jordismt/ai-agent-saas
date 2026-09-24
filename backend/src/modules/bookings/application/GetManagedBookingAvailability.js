import { AppError } from "../../../shared/errors/AppError.js";

export class GetManagedBookingAvailability {
  constructor({ getManagedBooking, getAvailableSlots }) {
    this.getManagedBooking = getManagedBooking;

    this.getAvailableSlots = getAvailableSlots;
  }

  async execute({ token, date, employeeId = null }) {
    if (!date) {
      throw new AppError("Date is required", 400);
    }

    const booking = await this.getManagedBooking.execute(token);

    if (booking.status === "cancelled") {
      throw new AppError("Cancelled bookings cannot be rescheduled", 409);
    }

    if (booking.status === "completed" || booking.status === "no_show") {
      throw new AppError("This booking can no longer be rescheduled", 409);
    }

    if (new Date(booking.starts_at).getTime() <= Date.now()) {
      throw new AppError("Past bookings cannot be rescheduled", 409);
    }

    /*
     * Ya NO forzamos el profesional original.
     *
     * employeeId:
     * - null = cualquier profesional
     * - UUID = profesional concreto
     *
     * GetAvailableSlots ya se encarga de:
     * - empleados activos
     * - especialización por servicio
     * - horarios
     * - vacaciones/time off
     * - reservas existentes
     */
    return this.getAvailableSlots.execute({
      businessId: booking.business_id,

      serviceId: booking.service_id,

      date,

      employeeId: employeeId || null,
    });
  }
}
