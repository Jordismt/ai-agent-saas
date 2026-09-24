import { AppError } from "../../../shared/errors/AppError.js";

export class CancelManagedBooking {
  constructor({ getManagedBooking, bookingRepository, businessRepository, sendBookingCancellation = null }) {
    this.getManagedBooking = getManagedBooking;

    this.bookingRepository = bookingRepository;

    this.businessRepository = businessRepository;

    this.sendBookingCancellation = sendBookingCancellation;
  }

  async execute({ token, reason = null }) {
    const booking = await this.getManagedBooking.execute(token);

    if (booking.status === "cancelled") {
      return booking;
    }

    if (booking.status === "completed" || booking.status === "no_show") {
      throw new AppError("This booking can no longer be cancelled", 409);
    }

    const startsAt = new Date(booking.starts_at);

    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      throw new AppError("Past bookings cannot be cancelled", 409);
    }

    const normalizedReason = typeof reason === "string" ? reason.trim().slice(0, 1000) || null : null;

    const business = await this.businessRepository.findById(booking.business_id);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    /*
     * Primero cancelamos.
     *
     * El email nunca debe determinar si la
     * cancelación es válida o no.
     */
    const cancelledBooking = await this.bookingRepository.cancelById(booking.id, normalizedReason);

    if (this.sendBookingCancellation) {
      try {
        await this.sendBookingCancellation.execute({
          booking: cancelledBooking,
          business,
          cancellationReason: normalizedReason,
        });
      } catch (error) {
        console.error("Failed to send booking cancellation email:", {
          bookingId: cancelledBooking.id,
          error,
        });
      }
    }

    return cancelledBooking;
  }
}
