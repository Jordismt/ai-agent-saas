import { BusinessHoursRepository } from "../domain/BusinessHoursRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseBusinessHoursRepository extends BusinessHoursRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("business_hours")
      .select("*")
      .eq("business_id", businessId)
      .order("day_of_week", { ascending: true });

    if (error) {
      throw new AppError(`Failed to find business hours: ${error.message}`, 500);
    }

    return data;
  }

  async create(businessId, hours) {
    const { data, error } = await this.supabase
      .from("business_hours")
      .insert({
        business_id: businessId,
        day_of_week: hours.dayOfWeek,
        open_time: hours.openTime,
        close_time: hours.closeTime,
        second_open_time: hours.secondOpenTime,
        second_close_time: hours.secondCloseTime,
        is_closed: hours.isClosed,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create business hours: ${error.message}`, 500);
    }

    return data;
  }

  async update(businessId, dayOfWeek, hours) {
    const { data, error } = await this.supabase
      .from("business_hours")
      .upsert(
        {
          business_id: businessId,
          day_of_week: dayOfWeek,
          open_time: hours.openTime,
          close_time: hours.closeTime,
          second_open_time: hours.secondOpenTime,
          second_close_time: hours.secondCloseTime,
          is_closed: hours.isClosed,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "business_id,day_of_week",
        },
      )
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update business hours: ${error.message}`, 500);
    }

    return data;
  }

  async delete(businessId, dayOfWeek) {
    const { data, error } = await this.supabase
      .from("business_hours")
      .delete()
      .eq("business_id", businessId)
      .eq("day_of_week", dayOfWeek)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to delete business hours: ${error.message}`, 500);
    }

    return data;
  }
}
