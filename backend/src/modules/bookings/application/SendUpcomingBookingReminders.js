export class SendUpcomingBookingReminders {
  constructor({ bookingRepository, businessRepository, sendBookingReminder }) {
    this.bookingRepository = bookingRepository;
    this.businessRepository = businessRepository;
    this.sendBookingReminder = sendBookingReminder;
  }

  async execute() {
    const now = Date.now();

    // El cron se ejecutará cada 15 minutos.
    // Buscamos reservas alrededor de las 24h:
    // desde +23h45 hasta +24h15.
    const from = new Date(now + 23 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString();

    const to = new Date(now + 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString();

    const bookings = await this.bookingRepository.findBookingsNeedingReminder(from, to);

    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        const business = await this.businessRepository.findById(booking.business_id);

        if (!business) {
          console.error("[BookingReminder] Business not found", {
            bookingId: booking.id,
            businessId: booking.business_id,
          });

          failed += 1;
          continue;
        }

        await this.sendBookingReminder.execute({
          booking,
          business,
        });

        await this.bookingRepository.markReminderAsSent(booking.id);

        sent += 1;

        console.log(`[BookingReminder] Sent for booking ${booking.id}`);
      } catch (error) {
        failed += 1;

        console.error(`[BookingReminder] Failed for booking ${booking.id}`, error);
      }
    }

    return {
      checked: bookings.length,
      sent,
      failed,
      from,
      to,
    };
  }
}
