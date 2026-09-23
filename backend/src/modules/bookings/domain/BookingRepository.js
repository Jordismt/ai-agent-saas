export class BookingRepository {
  async create(_booking) {
    throw new Error("Method not implemented");
  }

  async findById(_id) {
    throw new Error("Method not implemented");
  }

  async findByBusinessId(_businessId) {
    throw new Error("Method not implemented");
  }

  async findByBusinessIdAndDateRange(_businessId, _startDate, _endDate) {
    throw new Error("Method not implemented");
  }

  async findConflictingBookings(_businessId, _startsAt, _endsAt) {
    throw new Error("Method not implemented");
  }

  async updateStatus(_id, _status) {
    throw new Error("Method not implemented");
  }
}
