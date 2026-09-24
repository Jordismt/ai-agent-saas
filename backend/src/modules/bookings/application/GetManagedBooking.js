import crypto from "node:crypto";

import { AppError } from "../../../shared/errors/AppError.js";

export class GetManagedBooking {
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(token) {
    if (!token || typeof token !== "string") {
      throw new AppError("Invalid booking management token", 400);
    }

    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new AppError("Invalid booking management token", 400);
    }

    const tokenHash = crypto.createHash("sha256").update(normalizedToken).digest("hex");

    const booking = await this.bookingRepository.findByManagementTokenHash(tokenHash);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    return booking;
  }
}
