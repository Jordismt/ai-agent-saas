import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseDashboardRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getBusinessesByOwnerId(ownerId) {
    const { data, error } = await this.supabase
      .from("businesses")
      .select("id, name, description, phone, address, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(`Failed to get dashboard businesses: ${error.message}`, 500);
    }

    return data || [];
  }

  async getConversationsByBusinessIds(businessIds) {
    if (!businessIds.length) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("conversations")
      .select("id, business_id, status, channel, created_at, updated_at")
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(`Failed to get dashboard conversations: ${error.message}`, 500);
    }

    return data || [];
  }

  async getLeadsByBusinessIds(businessIds) {
    if (!businessIds.length) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("leads")
      .select("id, business_id, conversation_id, name, phone, email, status, created_at, updated_at")
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(`Failed to get dashboard leads: ${error.message}`, 500);
    }

    return data || [];
  }

  async getBookingsByBusinessIds(businessIds) {
    if (!businessIds.length) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("bookings")
      .select(
        `
          id,
          business_id,
          conversation_id,
          lead_id,
          customer_name,
          service_name,
          starts_at,
          ends_at,
          status,
          created_at,
          updated_at
        `,
      )
      .in("business_id", businessIds)
      .order("starts_at", { ascending: true });

    if (error) {
      throw new AppError(`Failed to get dashboard bookings: ${error.message}`, 500);
    }

    return data || [];
  }
}
