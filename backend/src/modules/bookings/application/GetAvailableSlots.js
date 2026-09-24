import { DateTime } from "luxon";

import { AppError } from "../../../shared/errors/AppError.js";

export class GetAvailableSlots {
  constructor({
    bookingRepository,
    businessServiceRepository,
    businessHoursRepository,
    businessRepository,
    employeeRepository,
  }) {
    this.bookingRepository = bookingRepository;
    this.businessServiceRepository = businessServiceRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.businessRepository = businessRepository;
    this.employeeRepository = employeeRepository;
  }

  async execute({ businessId, serviceId, date, employeeId = null, slotIntervalMinutes = 15 }) {
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

    if (requestedDate < now.startOf("day")) {
      return [];
    }

    const service = await this.businessServiceRepository.findById(businessId, serviceId);

    if (!service) {
      throw new AppError("Business service not found", 404);
    }

    if (!Number.isInteger(service.duration_minutes) || service.duration_minutes <= 0) {
      throw new AppError("Business service requires a valid duration", 400);
    }

    /*
     * -------------------------------------------------------
     * HORARIO DEL NEGOCIO
     * -------------------------------------------------------
     */

    const businessHours = await this.businessHoursRepository.findByBusinessId(businessId);

    const dayOfWeek = requestedDate.weekday === 7 ? 0 : requestedDate.weekday;

    const businessDayHours = businessHours.find((item) => Number(item.day_of_week) === dayOfWeek);

    if (!businessDayHours || businessDayHours.is_closed) {
      return [];
    }

    const businessPeriods = this.getBusinessPeriods(businessDayHours, requestedDate, timezone);

    if (!businessPeriods.length) {
      return [];
    }

    /*
     * -------------------------------------------------------
     * EMPLEADOS QUE REALIZAN EL SERVICIO
     * -------------------------------------------------------
     */

    const employees = await this.employeeRepository.findByBusinessId(businessId);

    const activeEmployees = employees.filter((employee) => employee.active);

    const eligibleEmployees = [];

    for (const employee of activeEmployees) {
      /*
       * Si se ha solicitado un empleado concreto,
       * ignoramos todos los demás.
       */
      if (employeeId && employee.id !== employeeId) {
        continue;
      }

      const services = await this.employeeRepository.getServices(employee.id);

      const canPerformService = services.some((employeeService) => employeeService.id === serviceId);

      if (!canPerformService) {
        continue;
      }

      eligibleEmployees.push(employee);
    }

    /*
     * Si nos han pedido explícitamente un empleado
     * pero no pertenece al negocio, está inactivo o
     * no realiza el servicio, no hay disponibilidad.
     */
    if (!eligibleEmployees.length) {
      return [];
    }

    /*
     * -------------------------------------------------------
     * RESERVAS DEL DÍA
     * -------------------------------------------------------
     */

    const dayStart = requestedDate.toUTC().toISO();

    const dayEnd = requestedDate.plus({ days: 1 }).toUTC().toISO();

    const bookings = await this.bookingRepository.findByBusinessIdAndDateRange(businessId, dayStart, dayEnd);

    const blockingBookings = bookings.filter(
      (booking) => booking.status === "pending" || booking.status === "confirmed",
    );

    /*
     * -------------------------------------------------------
     * DISPONIBILIDAD POR EMPLEADO
     * -------------------------------------------------------
     */

    const slotMap = new Map();

    for (const employee of eligibleEmployees) {
      const employeeHours = await this.employeeRepository.getHours(employee.id);

      const employeeDayHours = employeeHours.find((item) => Number(item.weekday) === dayOfWeek);

      /*
       * Si el empleado no tiene horario configurado
       * para ese día, no trabaja.
       */
      if (!employeeDayHours || employeeDayHours.is_closed) {
        continue;
      }

      const employeePeriods = this.getEmployeePeriods(employeeDayHours, requestedDate, timezone);

      /*
       * Calculamos la intersección:
       *
       * horario negocio ∩ horario empleado
       */
      const effectivePeriods = this.intersectPeriods(businessPeriods, employeePeriods);

      if (!effectivePeriods.length) {
        continue;
      }

      /*
       * Ausencias del empleado.
       *
       * Por ahora getTimeOff devuelve todas.
       * Después podemos optimizar el repositorio para
       * pedir únicamente las que intersecten este día.
       */
      const timeOff = await this.employeeRepository.getTimeOff(employee.id);

      const relevantTimeOff = timeOff.filter((absence) => {
        const absenceStart = DateTime.fromISO(absence.starts_at, { setZone: true }).toUTC();

        const absenceEnd = DateTime.fromISO(absence.ends_at, { setZone: true }).toUTC();

        const requestedDayStart = requestedDate.toUTC();

        const requestedDayEnd = requestedDate.plus({ days: 1 }).toUTC();

        return absenceStart < requestedDayEnd && absenceEnd > requestedDayStart;
      });

      /*
       * IMPORTANTE:
       *
       * Solo bloqueamos las reservas asignadas
       * a ESTE empleado.
       */
      const employeeBookings = blockingBookings.filter(
        (booking) => booking.employee_id === null || booking.employee_id === employee.id,
      );

      for (const period of effectivePeriods) {
        let slotStart = period.start;

        while (true) {
          const slotEnd = slotStart.plus({
            minutes: service.duration_minutes,
          });

          if (slotEnd > period.end) {
            break;
          }

          /*
           * Nunca ofrecemos un slot pasado
           * ni exactamente "ahora".
           */
          if (slotStart <= now) {
            slotStart = slotStart.plus({
              minutes: slotIntervalMinutes,
            });

            continue;
          }

          const slotStartUtc = slotStart.toUTC();

          const slotEndUtc = slotEnd.toUTC();

          /*
           * ¿Está ausente el empleado durante
           * alguna parte del slot?
           */
          const hasTimeOffConflict = relevantTimeOff.some((absence) => {
            const absenceStart = DateTime.fromISO(absence.starts_at, { setZone: true }).toUTC();

            const absenceEnd = DateTime.fromISO(absence.ends_at, { setZone: true }).toUTC();

            return absenceStart < slotEndUtc && absenceEnd > slotStartUtc;
          });

          if (hasTimeOffConflict) {
            slotStart = slotStart.plus({
              minutes: slotIntervalMinutes,
            });

            continue;
          }

          /*
           * ¿Tiene ESTE empleado otra reserva?
           */
          const hasBookingConflict = employeeBookings.some((booking) => {
            const existingStart = DateTime.fromISO(booking.starts_at, { setZone: true }).toUTC();

            const existingEnd = DateTime.fromISO(booking.ends_at, { setZone: true }).toUTC();

            return existingStart < slotEndUtc && existingEnd > slotStartUtc;
          });

          if (hasBookingConflict) {
            slotStart = slotStart.plus({
              minutes: slotIntervalMinutes,
            });

            continue;
          }

          /*
           * Puede ocurrir:
           *
           * Laura -> 17:00 disponible
           * Marta -> 17:00 disponible
           *
           * No queremos devolver dos slots 17:00.
           *
           * Devolvemos un slot con los empleados
           * disponibles dentro.
           */
          const key = slotStartUtc.toISO();

          if (!slotMap.has(key)) {
            slotMap.set(key, {
              startsAt: slotStartUtc.toISO(),

              endsAt: slotEndUtc.toISO(),

              localTime: slotStart.toFormat("HH:mm"),

              employees: [],
            });
          }

          slotMap.get(key).employees.push({
            id: employee.id,
            name: employee.name,
          });

          slotStart = slotStart.plus({
            minutes: slotIntervalMinutes,
          });
        }
      }
    }

    /*
     * Ordenamos por fecha por seguridad.
     */
    return Array.from(slotMap.values()).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }

  /*
   * =======================================================
   * BUSINESS PERIODS
   * =======================================================
   */

  getBusinessPeriods(dayHours, requestedDate, timezone) {
    const periods = [];

    if (dayHours.open_time && dayHours.close_time) {
      periods.push({
        start: this.createLocalDateTime(requestedDate, dayHours.open_time, timezone),

        end: this.createLocalDateTime(requestedDate, dayHours.close_time, timezone),
      });
    }

    if (dayHours.second_open_time && dayHours.second_close_time) {
      periods.push({
        start: this.createLocalDateTime(requestedDate, dayHours.second_open_time, timezone),

        end: this.createLocalDateTime(requestedDate, dayHours.second_close_time, timezone),
      });
    }

    this.validatePeriods(periods, "Invalid business hours");

    return periods;
  }

  /*
   * =======================================================
   * EMPLOYEE PERIODS
   * =======================================================
   */

  getEmployeePeriods(dayHours, requestedDate, timezone) {
    const periods = [];

    if (dayHours.start_time && dayHours.end_time) {
      periods.push({
        start: this.createLocalDateTime(requestedDate, dayHours.start_time, timezone),

        end: this.createLocalDateTime(requestedDate, dayHours.end_time, timezone),
      });
    }

    if (dayHours.second_start_time && dayHours.second_end_time) {
      periods.push({
        start: this.createLocalDateTime(requestedDate, dayHours.second_start_time, timezone),

        end: this.createLocalDateTime(requestedDate, dayHours.second_end_time, timezone),
      });
    }

    this.validatePeriods(periods, "Invalid employee hours");

    return periods;
  }

  /*
   * =======================================================
   * BUSINESS ∩ EMPLOYEE
   * =======================================================
   */

  intersectPeriods(businessPeriods, employeePeriods) {
    const result = [];

    for (const businessPeriod of businessPeriods) {
      for (const employeePeriod of employeePeriods) {
        const start =
          businessPeriod.start > employeePeriod.start ? businessPeriod.start : employeePeriod.start;

        const end = businessPeriod.end < employeePeriod.end ? businessPeriod.end : employeePeriod.end;

        if (start < end) {
          result.push({
            start,
            end,
          });
        }
      }
    }

    return result;
  }

  validatePeriods(periods, errorMessage) {
    for (const period of periods) {
      if (period.end <= period.start) {
        throw new AppError(errorMessage, 400);
      }
    }
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
      throw new AppError("Invalid hours", 400);
    }

    return result;
  }
}
