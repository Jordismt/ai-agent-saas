import { BookingRepository } from "../domain/BookingRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseBookingRepository extends BookingRepository {
  constructor(supabase) {
    super();

    this.supabase = supabase;
  }

  async create(booking) {
    const { data, error } = await this.supabase
      .from("bookings")
      .insert({
        business_id: booking.businessId,
        service_id: booking.serviceId,
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
      })
      .select()
      .single();

    if (error) {
      /*
       * PostgreSQL:
       * 23P01 = exclusion_violation
       *
       * Nuestra constraint bookings_no_overlapping_active
       * utiliza una exclusion constraint para impedir
       * reservas activas solapadas.
       *
       * Esto también protege frente a race conditions:
       * aunque dos requests vean el slot libre,
       * PostgreSQL solo permitirá insertar uno.
       */
      if (error.code === "23P01") {
        throw new AppError("The selected time is not available", 409);
      }

      throw new AppError(`Failed to create booking: ${error.message}`, 500);
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase.from("bookings").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw new AppError(`Failed to find booking: ${error.message}`, 500);
    }

    return data;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
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
      .select("*")
      .eq("business_id", businessId)

      /*
       * Devuelve cualquier reserva que se solape
       * con el rango solicitado:
       *
       * booking.starts_at < range.end
       * booking.ends_at   > range.start
       */
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

  async findConflictingBookings(businessId, startsAt, endsAt) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("business_id", businessId)
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

  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      /*
       * También puede ocurrir al cambiar una reserva
       * de cancelled/completed a pending/confirmed
       * si ese hueco ya está ocupado.
       */
      if (error.code === "23P01") {
        throw new AppError("The selected time is not available", 409);
      }

      throw new AppError(`Failed to update booking status: ${error.message}`, 500);
    }

    return data;
  }
}
