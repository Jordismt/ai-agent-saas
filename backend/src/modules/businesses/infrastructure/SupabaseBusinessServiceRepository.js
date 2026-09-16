import { supabase } from "../../../infrastructure/database/supabase.js";
import { BusinessServiceRepository } from "../domain/BusinessServiceRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseBusinessServiceRepository extends BusinessServiceRepository {
  async create(businessId, serviceData) {
    const { data, error } = await supabase
      .from("business_services")
      .insert({
        business_id: businessId,
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration_minutes: serviceData.duration_minutes,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create business service: ${error.message}`, 500);
    }

    return data;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await supabase
      .from("business_services")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new AppError(`Failed to find business services: ${error.message}`, 500);
    }

    return data;
  }

  async delete(businessId, serviceId) {
    const { data, error } = await supabase
      .from("business_services")
      .delete()
      .eq("id", serviceId)
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to delete business service: ${error.message}`, 500);
    }

    return data;
  }

  async update(businessId, serviceId, serviceData) {
    const { data, error } = await supabase
      .from("business_services")
      .update({
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration_minutes: serviceData.duration_minutes,
      })
      .eq("id", serviceId)
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update business service: ${error.message}`, 500);
    }

    return data;
  }
}
