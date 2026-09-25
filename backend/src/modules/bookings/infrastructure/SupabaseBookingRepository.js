import { BookingRepository } from "../domain/BookingRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

const BOOKING_SELECT = `
  *,
  employee:employees (
    id,
    name
  )
`;

export class SupabaseBookingRepository extends BookingRepository {
  constructor(supabase) {
    super();

    this.supabase = supabase;
  }

  async create(booking, managementTokenHash = null) {
    const { data, error } = await this.supabase
      .from("bookings")
      .insert({
        business_id: booking.businessId,
        service_id: booking.serviceId,
        employee_id: booking.employeeId,
        conversation_id: booking.conversationId,
        lead_id: booking.leadId,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail,
        service_name: booking.serviceName,
        duration_minutes: booking.durationMinutes,
        price: booking.price,
        starts_at: booking.startsAt,
        ends_at: booking.endsAt,
        status: booking.status,
        notes: booking.notes,
        management_token_hash: managementTokenHash,
      })
      .select(BOOKING_SELECT)
      .single();

    if (error) {
      if (error.code === "23P01") {
        throw new AppError("The selected time is not available", 409);
      }

      throw new AppError(`Failed to create booking: ${error.message}`, 500);
    }

    return data;
  }

  async findByManagementTokenHash(tokenHash) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("management_token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find booking by management token: ${error.message}`, 500);
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find booking: ${error.message}`, 500);
    }

    return data;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("business_id", businessId)
      .order("starts_at", {
        ascending: true,
      });

    if (error) {
      throw new AppError(`Failed to find business bookings: ${error.message}`, 500);
    }

    return data || [];
  }

  async findByBusinessIdAndDateRange(businessId, startDate, endDate) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("business_id", businessId)
      .lt("starts_at", endDate)
      .gt("ends_at", startDate)
      .order("starts_at", {
        ascending: true,
      });

    if (error) {
      throw new AppError(`Failed to find bookings by date range: ${error.message}`, 500);
    }

    return data || [];
  }

  async findConflictingBookings(businessId, startsAt, endsAt, employeeId) {
    if (!employeeId) {
      throw new AppError("employeeId is required to check booking conflicts", 400);
    }

    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("business_id", businessId)
      .eq("employee_id", employeeId)
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", endsAt)
      .gt("ends_at", startsAt)
      .order("starts_at", {
        ascending: true,
      });

    if (error) {
      throw new AppError(`Failed to find conflicting bookings: ${error.message}`, 500);
    }

    return data || [];
  }

  async findBookingsNeedingReminder(from, to) {
    console.log("[REMINDER QUERY]", {
      from,
      to,
    });

    const { data, error } = await this.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .in("status", ["pending", "confirmed"])
      .is("reminder_sent_at", null)
      .not("customer_email", "is", null)
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at", {
        ascending: true,
      });

    console.log("[REMINDER RESULT]", {
      data,
      error,
    });

    if (error) {
      throw new AppError(`Failed to find bookings needing reminder: ${error.message}`, 500);
    }

    return data || [];
  }

  async markReminderAsSent(id) {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("reminder_sent_at", null)
      .select(BOOKING_SELECT)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to mark booking reminder as sent: ${error.message}`, 500);
    }

    return data;
  }

  async adminUpdate(id, fields) {
    const { data, error } = await this.supabase.from("bookings")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id).select(BOOKING_SELECT).single();
    if (error) {
      if (error.code === "23P01") throw new AppError("The selected time is not available", 409);
      throw new AppError(`Failed to update booking: ${error.message}`, 500);
    }
    return data;
  }

  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(BOOKING_SELECT)
      .single();

    if (error) {
      if (error.code === "23P01") {
        throw new AppError("The selected time is not available", 409);
      }

      throw new AppError(`Failed to update booking status: ${error.message}`, 500);
    }

    return data;
  }

  async cancelById(id, reason = null) {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancellation_reason: reason || null,
        updated_at: now,
      })
      .eq("id", id)
      .select(BOOKING_SELECT)
      .single();

    if (error) {
      throw new AppError(`Failed to cancel booking: ${error.message}`, 500);
    }

    return data;
  }

  async reschedule(id, startsAt, endsAt, employeeId) {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        starts_at: startsAt,
        ends_at: endsAt,
        employee_id: employeeId,

        // Al modificar la cita permitimos un nuevo recordatorio
        // para la nueva fecha/hora.
        reminder_sent_at: null,

        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(BOOKING_SELECT)
      .single();

    if (error) {
      if (error.code === "23P01") {
        throw new AppError("The selected time is not available", 409);
      }

      throw new AppError(`Failed to reschedule booking: ${error.message}`, 500);
    }

    return data;
  }
}
