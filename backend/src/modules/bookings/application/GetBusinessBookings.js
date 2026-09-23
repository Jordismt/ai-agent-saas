import { AppError } from "../../../shared/errors/AppError.js";

export class GetBusinessBookings {
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(businessId) {
    if (!businessId) {
      throw new AppError("Business id is required", 400);
    }

    return this.bookingRepository.findByBusinessId(businessId);
  }
}
