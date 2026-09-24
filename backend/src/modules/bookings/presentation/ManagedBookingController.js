export class ManagedBookingController {
  constructor({
    getManagedBooking,
    getManagedBookingAvailability,
    cancelManagedBooking,
    rescheduleManagedBooking,
  }) {
    this.getManagedBooking = getManagedBooking;

    this.getManagedBookingAvailability = getManagedBookingAvailability;

    this.cancelManagedBooking = cancelManagedBooking;

    this.rescheduleManagedBooking = rescheduleManagedBooking;
  }

  async get(req, res, next) {
    try {
      const booking = await this.getManagedBooking.execute(req.params.token);

      return res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const slots = await this.getManagedBookingAvailability.execute({
        token: req.params.token,
        date: req.query.date,

        employeeId: req.query.employeeId || null,
      });

      return res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const booking = await this.cancelManagedBooking.execute({
        token: req.params.token,

        reason: req.body?.reason || null,
      });

      return res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async reschedule(req, res, next) {
    try {
      const booking = await this.rescheduleManagedBooking.execute({
        token: req.params.token,
        date: req.body?.date,
        time: req.body?.time,

        employeeId: req.body?.employeeId || null,
      });

      return res.json(booking);
    } catch (error) {
      next(error);
    }
  }
}
