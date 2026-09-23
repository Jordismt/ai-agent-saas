import { DateTime } from "luxon";
import { AppError } from "../../../shared/errors/AppError.js";

export class GetAvailableSlots {
  constructor({ bookingRepository, businessServiceRepository, businessHoursRepository, businessRepository }) {
    this.bookingRepository = bookingRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.businessRepository = businessRepository;
  }

  async execute({ businessId, serviceId, date, slotIntervalMinutes = 15 }) {
    if (!businessId || !serviceId || !date) {
      throw new AppError("businessId, serviceId and date are required", 400);
    }

    if (!Number.isInteger(slotIntervalMinutes) || slotIntervalMinutes <= 0) {
      throw new AppError("slotIntervalMinutes must be a positive integer", 400);
    }

    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    const timezone = business.timezone || "Europe/Madrid";

    const now = DateTime.now().setZone(timezone);

    if (!now.isValid) {
      throw new AppError("Business timezone is invalid", 400);
    }

    const requestedDate = DateTime.fromISO(date, {
      zone: timezone,
    }).startOf("day");

    if (!requestedDate.isValid) {
      throw new AppError("Invalid booking date", 400);
    }

    /*
     * No devolvemos disponibilidad de días que ya han pasado
     * en la zona horaria del negocio.
     */
    const today = now.startOf("day");

    if (requestedDate < today) {
      return [];
    }

    const service = await this.businessServiceRepository.findById(businessId, serviceId);

    if (!service) {
      throw new AppError("Business service not found", 404);
    }

    if (!Number.isInteger(service.duration_minutes) || service.duration_minutes <= 0) {
      throw new AppError("Business service requires a valid duration", 400);
    }

    const hours = await this.businessHoursRepository.findByBusinessId(businessId);

    /*
     * Luxon:
     * Monday = 1
     * ...
     * Sunday = 7
     *
     * Nuestra BD:
     * Sunday = 0
     * Monday = 1
     * ...
     * Saturday = 6
     */
    const dayOfWeek = requestedDate.weekday === 7 ? 0 : requestedDate.weekday;

    const dayHours = hours.find((item) => Number(item.day_of_week) === dayOfWeek);
    console.log("\n========== BUSINESS HOURS DEBUG ==========");

    console.log("Requested date:", date);
    console.log("Luxon weekday:", requestedDate.weekday);
    console.log("DB weekday:", dayOfWeek);

    console.log("ALL HOURS:");
    console.dir(hours, {
      depth: null,
    });

    console.log("SELECTED DAY HOURS:");
    console.dir(dayHours, {
      depth: null,
    });

    console.log("SERVICE:");
    console.dir(
      {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes,
      },
      {
        depth: null,
      },
    );

    console.log("==========================================\n");
    if (!dayHours || dayHours.is_closed) {
      return [];
    }

    const dayStart = requestedDate.toUTC().toISO();

    const dayEnd = requestedDate.plus({ days: 1 }).toUTC().toISO();

    const bookings = await this.bookingRepository.findByBusinessIdAndDateRange(businessId, dayStart, dayEnd);

    const blockingBookings = bookings.filter(
      (booking) => booking.status === "pending" || booking.status === "confirmed",
    );
    console.log("\n========== BOOKINGS DEBUG ==========");

    console.log("TOTAL BOOKINGS:", bookings.length);
    console.log("BLOCKING BOOKINGS:", blockingBookings.length);

    console.dir(
      blockingBookings.map((booking) => ({
        id: booking.id,
        status: booking.status,
        starts_at: booking.starts_at,
        ends_at: booking.ends_at,
      })),
      {
        depth: null,
      },
    );

    console.log("====================================\n");
    const periods = [];

    if (dayHours.open_time && dayHours.close_time) {
      periods.push({
        open: dayHours.open_time,
        close: dayHours.close_time,
      });
    }

    if (dayHours.second_open_time && dayHours.second_close_time) {
      periods.push({
        open: dayHours.second_open_time,
        close: dayHours.second_close_time,
      });
    }

    const slots = [];

    for (const period of periods) {
      const periodStart = this.createLocalDateTime(requestedDate, period.open, timezone);

      const periodEnd = this.createLocalDateTime(requestedDate, period.close, timezone);
      console.log("\n========== PERIOD DEBUG ==========");

      console.log("period.open:", period.open);
      console.log("period.close:", period.close);

      console.log("periodStart:", periodStart.toISO());
      console.log("periodEnd:", periodEnd.toISO());

      console.log("periodStart local:", periodStart.toFormat("yyyy-MM-dd HH:mm:ss"));
      console.log("periodEnd local:", periodEnd.toFormat("yyyy-MM-dd HH:mm:ss"));

      console.log("timezone:", timezone);

      console.log("duration minutes:", periodEnd.diff(periodStart, "minutes").minutes);

      console.log("==================================\n");
      if (periodEnd <= periodStart) {
        throw new AppError("Invalid business hours", 400);
      }

      let slotStart = periodStart;

      while (true) {
        const slotEnd = slotStart.plus({
          minutes: service.duration_minutes,
        });

        if (slotEnd > periodEnd) {
          break;
        }

        /*
         * Si estamos consultando hoy, no permitimos
         * reservar una hora que ya haya pasado.
         *
         * También rechazamos exactamente "ahora":
         * la reserva siempre debe empezar en el futuro.
         */
        if (slotStart <= now) {
          slotStart = slotStart.plus({
            minutes: slotIntervalMinutes,
          });

          continue;
        }

        const slotStartUtc = slotStart.toUTC();
        const slotEndUtc = slotEnd.toUTC();

        const hasConflict = blockingBookings.some((booking) => {
          const existingStart = DateTime.fromISO(booking.starts_at, { setZone: true }).toUTC();

          const existingEnd = DateTime.fromISO(booking.ends_at, { setZone: true }).toUTC();

          return existingStart < slotEndUtc && existingEnd > slotStartUtc;
        });

        if (!hasConflict) {
          slots.push({
            startsAt: slotStartUtc.toISO(),
            endsAt: slotEndUtc.toISO(),
            localTime: slotStart.toFormat("HH:mm"),
          });
        }

        slotStart = slotStart.plus({
          minutes: slotIntervalMinutes,
        });
      }
    }

    return slots;
  }

  createLocalDateTime(date, time, timezone) {
    const [hours, minutes] = time.split(":").map(Number);

    const result = DateTime.fromObject(
      {
        year: date.year,
        month: date.month,
        day: date.day,
        hour: hours,
        minute: minutes,
      },
      {
        zone: timezone,
      },
    );

    if (!result.isValid) {
      throw new AppError("Invalid business hours", 400);
    }

    return result;
  }
}
