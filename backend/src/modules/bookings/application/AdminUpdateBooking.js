import { DateTime } from "luxon";
import { AppError } from "../../../shared/errors/AppError.js";

export class AdminUpdateBooking {
  constructor({ bookingRepository, businessRepository, businessServiceRepository, employeeRepository, getAvailableSlots }) {
    Object.assign(this, { bookingRepository, businessRepository, businessServiceRepository, employeeRepository, getAvailableSlots });
  }

  async execute(booking, input) {
    if (["cancelled", "completed", "no_show"].includes(booking.status)) {
      throw new AppError("This booking cannot be edited", 409);
    }
    const business = await this.businessRepository.findById(booking.business_id);
    if (!business) throw new AppError("Business not found", 404);
    const service = await this.businessServiceRepository.findById(booking.business_id, input.serviceId);
    if (!service?.duration_minutes) throw new AppError("Service not found", 404);
    const zone = business.timezone || "Europe/Madrid";
    const start = DateTime.fromFormat(`${input.date} ${input.time}`, "yyyy-MM-dd HH:mm", { zone });
    if (!start.isValid || start <= DateTime.now().setZone(zone)) throw new AppError("Invalid or past booking time", 400);
    const end = start.plus({ minutes: service.duration_minutes });
    // The existing booking must not block its own slot. Filter it only for this availability check.
    const baseRepository = this.bookingRepository;
    const availabilityRepository = Object.create(baseRepository);
    availabilityRepository.findByBusinessIdAndDateRange = async (...args) =>
      (await baseRepository.findByBusinessIdAndDateRange(...args)).filter(row => row.id !== booking.id);
    const availability = Object.create(this.getAvailableSlots);
    availability.bookingRepository = availabilityRepository;
    const slots = await availability.execute({
      businessId: booking.business_id, serviceId: input.serviceId,
      date: input.date, employeeId: input.employeeId || null,
    });
    const slot = slots.find(s => DateTime.fromISO(s.startsAt).toMillis() === start.toMillis());
    if (!slot) throw new AppError("The selected time is not available", 409);
    const employee = input.employeeId
      ? slot.employees.find(e => e.id === input.employeeId)
      : slot.employees[0];
    if (!employee) throw new AppError("No employee available", 409);
    const conflicts = await baseRepository.findConflictingBookings(booking.business_id, start.toUTC().toISO(), end.toUTC().toISO(), employee.id);
    if (conflicts.some(row => row.id !== booking.id)) throw new AppError("The selected time is not available", 409);
    return baseRepository.adminUpdate(booking.id, {
      service_id: service.id, employee_id: employee.id, service_name: service.name,
      duration_minutes: service.duration_minutes, price: service.price,
      starts_at: start.toUTC().toISO(), ends_at: end.toUTC().toISO(),
      customer_name: input.customerName.trim(), customer_phone: input.customerPhone?.trim() || null,
      customer_email: input.customerEmail?.trim().toLowerCase() || null,
      notes: input.notes?.trim() || null,
      reminder_sent_at: null,
    });
  }
}
