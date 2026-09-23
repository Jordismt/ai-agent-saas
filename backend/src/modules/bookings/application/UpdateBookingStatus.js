import { BOOKING_STATUSES } from "../domain/Booking.js";

import { AppError } from "../../../shared/errors/AppError.js";

const VALID_STATUSES = Object.values(BOOKING_STATUSES);

export class UpdateBookingStatus {
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(id, status) {
    if (!id) {
      throw new AppError("Booking id is required", 400);
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid booking status: ${status}`, 400);
    }

    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    return this.bookingRepository.updateStatus(id, status);
  }
}
