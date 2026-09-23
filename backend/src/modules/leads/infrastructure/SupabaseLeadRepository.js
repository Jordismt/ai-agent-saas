import { LeadRepository } from "../domain/LeadRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseLeadRepository extends LeadRepository {
  constructor(supabase) {
    super();

    this.supabase = supabase;
  }

  async create(lead) {
    const { data, error } = await this.supabase
      .from("leads")
      .insert({
        business_id: lead.businessId,
        conversation_id: lead.conversationId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        notes: lead.notes,
        status: lead.status,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create lead: ${error.message}`, 500);
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase.from("leads").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw new AppError(`Failed to find lead: ${error.message}`, 500);
    }

    return data;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("leads")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new AppError(`Failed to find business leads: ${error.message}`, 500);
    }

    return data || [];
  }

  async findByConversationId(conversationId) {
    const { data, error } = await this.supabase
      .from("leads")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new AppError(`Failed to find conversation leads: ${error.message}`, 500);
    }

    return data || [];
  }

  async update(id, lead) {
    const { data, error } = await this.supabase
      .from("leads")
      .update({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        notes: lead.notes,
        status: lead.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update lead: ${error.message}`, 500);
    }

    return data;
  }

  async delete(id) {
    const { error } = await this.supabase.from("leads").delete().eq("id", id);

    if (error) {
      throw new AppError(`Failed to delete lead: ${error.message}`, 500);
    }
  }
}
