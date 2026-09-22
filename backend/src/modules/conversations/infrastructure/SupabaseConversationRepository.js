import { ConversationRepository } from "../domain/ConversationRepository.js";

import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseConversationRepository extends ConversationRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(conversation) {
    const { data, error } = await this.supabase
      .from("conversations")
      .insert({
        business_id: conversation.businessId,
        channel: conversation.channel,
        status: conversation.status,
        visitor_id: conversation.visitorId,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create conversation: ${error.message}`, 500);
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase.from("conversations").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw new AppError(`Failed to find conversation: ${error.message}`, 500);
    }

    return data;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(`Failed to find conversations: ${error.message}`, 500);
    }

    return data;
  }

  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from("conversations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update conversation: ${error.message}`, 500);
    }

    return data;
  }

  async findActiveByBusinessIdAndVisitorId(businessId, visitorId) {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .eq("visitor_id", visitorId)
      .in("status", ["active", "human"])
      .eq("channel", "web")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find active conversation: ${error.message}`, 500);
    }

    return data;
  }
}
