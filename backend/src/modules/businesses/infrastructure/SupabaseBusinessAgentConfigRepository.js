import { BusinessAgentConfigRepository } from "../domain/BusinessAgentConfigRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseBusinessAgentConfigRepository extends BusinessAgentConfigRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("business_agent_configs")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find business agent config: ${error.message}`, 500);
    }

    return data;
  }

  async create(businessId, config) {
    const { data, error } = await this.supabase
      .from("business_agent_configs")
      .insert({
        business_id: businessId,
        system_instructions: config.systemInstructions,
        welcome_message: config.welcomeMessage,
        tone: config.tone,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create business agent config: ${error.message}`, 500);
    }

    return data;
  }

  async update(businessId, config) {
    const { data, error } = await this.supabase
      .from("business_agent_configs")
      .update({
        system_instructions: config.systemInstructions,
        welcome_message: config.welcomeMessage,
        tone: config.tone,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update business agent config: ${error.message}`, 500);
    }

    return data;
  }

  async upsert(config) {
    const { data, error } = await this.supabase
      .from("business_agent_configs")
      .upsert(
        {
          business_id: config.businessId,
          system_instructions: config.systemInstructions,
          welcome_message: config.welcomeMessage,
          tone: config.tone,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "business_id",
        },
      )
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to save business agent config: ${error.message}`, 500);
    }

    return data;
  }
}
