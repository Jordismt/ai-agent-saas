import { BusinessRepository } from "../domain/BusinessRepository.js";

import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseBusinessRepository extends BusinessRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(business) {
    const { data, error } = await this.supabase
      .from("businesses")
      .insert({
        owner_id: business.ownerId,
        name: business.name,
        description: business.description,
        phone: business.phone,
        address: business.address,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create business: ${error.message}`, 500);
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase.from("businesses").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw new AppError(`Failed to find business: ${error.message}`, 500);
    }

    return data;
  }

  async findByOwnerId(ownerId) {
    const { data, error } = await this.supabase.from("businesses").select("*").eq("owner_id", ownerId);

    if (error) {
      throw new AppError(`Failed to find businesses: ${error.message}`, 500);
    }

    return data;
  }

  async update(id, business) {
    const { data, error } = await this.supabase
      .from("businesses")
      .update({
        name: business.name,
        description: business.description,
        phone: business.phone,
        address: business.address,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update business: ${error.message}`, 500);
    }

    return data;
  }
}
