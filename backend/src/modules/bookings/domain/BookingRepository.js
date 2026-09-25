export class BookingRepository {
  async create(_booking, _managementTokenHash = null) {
    throw new Error("Method not implemented");
  }

  async findById(_id) {
    throw new Error("Method not implemented");
  }

  async findByManagementTokenHash(_tokenHash) {
    throw new Error("Method not implemented");
  }

  async findByBusinessId(_businessId) {
    throw new Error("Method not implemented");
  }

  async findByBusinessIdAndDateRange(_businessId, _startDate, _endDate) {
    throw new Error("Method not implemented");
  }

  async findConflictingBookings(_businessId, _startsAt, _endsAt, _employeeId) {
    throw new Error("Method not implemented");
  }

  async findBookingsNeedingReminder(_from, _to) {
    throw new Error("Method not implemented");
  }

  async markReminderAsSent(_id) {
    throw new Error("Method not implemented");
  }

  async adminUpdate(_id, _fields) { throw new Error("Method not implemented"); }

  async updateStatus(_id, _status) {
    throw new Error("Method not implemented");
  }

  async cancelById(_id, _reason = null) {
    throw new Error("Method not implemented");
  }

  async reschedule(_id, _startsAt, _endsAt, _employeeId) {
    throw new Error("Method not implemented");
  }
}
