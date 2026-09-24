export class SendBookingConfirmation {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async execute({ booking, business, managementToken }) {
    if (!booking?.customer_email) {
      return null;
    }

    return this.emailService.sendBookingConfirmation({
      to: booking.customer_email,
      customerName: booking.customer_name,
      businessName: business.name,
      serviceName: booking.service_name,
      employeeName: booking.employee?.name || null,
      startsAt: booking.starts_at,
      timezone: business.timezone || "Europe/Madrid",
      price: booking.price,
      managementToken,
    });
  }
}
