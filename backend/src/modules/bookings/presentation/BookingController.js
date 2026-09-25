import { CreateBooking } from "../application/CreateBooking.js";
import { GetAvailableSlots } from "../application/GetAvailableSlots.js";
import { GetBusinessBookings } from "../application/GetBusinessBookings.js";
import { UpdateBookingStatus } from "../application/UpdateBookingStatus.js";

import { GetOwnedBusiness } from "../../businesses/application/GetOwnedBusiness.js";
import { GetOwnedBusinessOrThrow } from "../../businesses/application/GetOwnedBusinessOrThrow.js";

import { createBookingSchema } from "../application/createBookingSchema.js";
import { getAvailableSlotsSchema } from "../application/getAvailableSlotsSchema.js";
import { updateBookingStatusSchema } from "../application/updateBookingStatusSchema.js";

import { ResendEmailService } from "../../notifications/infrastructure/ResendEmailService.js";
import { SendBookingConfirmation } from "../../notifications/application/SendBookingConfirmation.js";

import { z } from "zod";
import { AdminUpdateBooking } from "../application/AdminUpdateBooking.js";
import { adminCreateBookingSchema, adminUpdateBookingSchema } from "../application/adminBookingSchemas.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class BookingController {
  constructor({
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    conversationRepository,
    leadRepository,
    employeeRepository,
  }) {
    this.bookingRepository = bookingRepository;
    const emailService = new ResendEmailService();

    const sendBookingConfirmation = new SendBookingConfirmation(emailService);

    const getOwnedBusiness = new GetOwnedBusiness(businessRepository);

    this.getOwnedBusinessOrThrow = new GetOwnedBusinessOrThrow(getOwnedBusiness);

    this.getAvailableSlots = new GetAvailableSlots({
      bookingRepository,
      businessServiceRepository,
      businessHoursRepository,
      businessRepository,
      employeeRepository,
    });

    this.createBooking = new CreateBooking({
      bookingRepository,
      businessRepository,
      businessServiceRepository,
      conversationRepository,
      leadRepository,
      employeeRepository,
      getAvailableSlots: this.getAvailableSlots,
      sendBookingConfirmation,
    });

    this.adminUpdateBooking = new AdminUpdateBooking({
      bookingRepository, businessRepository, businessServiceRepository,
      employeeRepository, getAvailableSlots: this.getAvailableSlots,
    });

    this.getBusinessBookings = new GetBusinessBookings(bookingRepository);

    this.updateBookingStatus = new UpdateBookingStatus(bookingRepository);
  }

  async create(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const data = createBookingSchema.parse({
        ...req.body,
        businessId: req.params.businessId,
      });

      const booking = await this.createBooking.execute(data);

      return res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async adminCreate(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);
      const data = adminCreateBookingSchema.parse({ ...req.body, businessId: req.params.businessId });
      const booking = await this.createBooking.execute({ ...data, allowWithoutEmail: true });
      return res.status(201).json(booking);
    } catch (error) { next(error); }
  }

  async adminUpdate(req, res, next) {
    try {
      const booking = await this.bookingRepository.findById(req.params.id);
      if (!booking) throw new AppError("Booking not found", 404);
      await this.getOwnedBusinessOrThrow.execute(booking.business_id, req.user.id);
      const data = adminUpdateBookingSchema.parse(req.body);
      return res.json(await this.adminUpdateBooking.execute(booking, data));
    } catch (error) { next(error); }
  }

  async adminCancel(req, res, next) {
    try {
      const booking = await this.bookingRepository.findById(req.params.id);
      if (!booking) throw new AppError("Booking not found", 404);
      await this.getOwnedBusinessOrThrow.execute(booking.business_id, req.user.id);
      if (booking.status === "cancelled") throw new AppError("Booking already cancelled", 409);
      const { reason } = z.object({ reason: z.string().trim().max(500).nullable().optional() }).parse(req.body || {});
      return res.json(await this.bookingRepository.cancelById(booking.id, reason));
    } catch (error) { next(error); }
  }

  async getByBusinessId(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const bookings = await this.getBusinessBookings.execute(req.params.businessId);

      return res.json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const data = getAvailableSlotsSchema.parse({
        businessId: req.params.businessId,
        serviceId: req.query.serviceId,
        date: req.query.date,
        employeeId: req.query.employeeId || undefined,
      });

      const slots = await this.getAvailableSlots.execute(data);

      return res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = updateBookingStatusSchema.parse(req.body);

      const booking = await this.bookingRepository.findById(req.params.id);

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      await this.getOwnedBusinessOrThrow.execute(booking.business_id, req.user.id);

      const updatedBooking = await this.updateBookingStatus.execute(req.params.id, status);

      return res.json(updatedBooking);
    } catch (error) {
      next(error);
    }
  }
}
