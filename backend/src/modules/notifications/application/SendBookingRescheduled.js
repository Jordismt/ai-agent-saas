export class SendBookingRescheduled {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async execute({ booking, business, managementToken, previousStartsAt = null }) {
    if (!booking?.customer_email) {
      return null;
    }

    return this.emailService.sendBookingRescheduled({
      to: booking.customer_email,
      customerName: booking.customer_name,
      businessName: business.name,
      serviceName: booking.service_name,
      employeeName: booking.employee?.name || null,
      startsAt: booking.starts_at,
      previousStartsAt,
      timezone: business.timezone || "Europe/Madrid",
      price: booking.price,
      managementToken,
    });
  }
}
