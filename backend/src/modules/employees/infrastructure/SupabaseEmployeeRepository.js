import { EmployeeRepository } from "../domain/EmployeeRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseEmployeeRepository extends EmployeeRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(employee) {
    const { data, error } = await this.supabase
      .from("employees")
      .insert({
        business_id: employee.businessId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        active: employee.active,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create employee: ${error.message}`, 500);
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase.from("employees").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw new AppError(`Failed to find employee: ${error.message}`, 500);
    }

    return data;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("employees")
      .select("*")
      .eq("business_id", businessId)
      .order("active", {
        ascending: false,
      })
      .order("name", {
        ascending: true,
      });

    if (error) {
      throw new AppError(`Failed to find business employees: ${error.message}`, 500);
    }

    return data || [];
  }

  async update(id, employee) {
    const { data, error } = await this.supabase
      .from("employees")
      .update({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        active: employee.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update employee: ${error.message}`, 500);
    }

    return data;
  }

  async deactivate(id) {
    const { data, error } = await this.supabase
      .from("employees")
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to deactivate employee: ${error.message}`, 500);
    }

    return data;
  }

  async getServices(employeeId) {
    const { data, error } = await this.supabase
      .from("employee_services")
      .select(
        `
      service_id,
      business_services (
        id,
        name,
        duration_minutes,
        price
      )
    `,
      )
      .eq("employee_id", employeeId);

    if (error) {
      throw new AppError(`Failed to get employee services: ${error.message}`, 500);
    }

    return (data || []).map((item) => item.business_services).filter(Boolean);
  }

  async replaceServices(employeeId, serviceIds) {
    /*
     * Primero comprobamos que TODOS los servicios pertenecen
     * al mismo negocio que el empleado.
     */
    const employee = await this.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (serviceIds.length > 0) {
      const { data: services, error: servicesError } = await this.supabase
        .from("business_services")
        .select("id, business_id")
        .in("id", serviceIds);

      if (servicesError) {
        throw new AppError(`Failed to validate services: ${servicesError.message}`, 500);
      }

      if (services.length !== serviceIds.length) {
        throw new AppError("One or more services do not exist", 400);
      }

      const invalidService = services.some((service) => service.business_id !== employee.business_id);

      if (invalidService) {
        throw new AppError("All services must belong to the employee business", 400);
      }
    }

    const { error: deleteError } = await this.supabase
      .from("employee_services")
      .delete()
      .eq("employee_id", employeeId);

    if (deleteError) {
      throw new AppError(`Failed to update employee services: ${deleteError.message}`, 500);
    }

    if (serviceIds.length === 0) {
      return [];
    }

    const rows = serviceIds.map((serviceId) => ({
      employee_id: employeeId,
      service_id: serviceId,
    }));

    const { error: insertError } = await this.supabase.from("employee_services").insert(rows);

    if (insertError) {
      throw new AppError(`Failed to update employee services: ${insertError.message}`, 500);
    }

    return this.getServices(employeeId);
  }

  async getHours(employeeId) {
    const { data, error } = await this.supabase
      .from("employee_hours")
      .select(
        `
      id,
      employee_id,
      weekday,
      is_closed,
      start_time,
      end_time,
      second_start_time,
      second_end_time
    `,
      )
      .eq("employee_id", employeeId)
      .order("weekday", { ascending: true });

    if (error) {
      throw new AppError(`Failed to get employee hours: ${error.message}`, 500);
    }

    return data || [];
  }

  async replaceHours(employeeId, hours) {
    const employee = await this.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const { error: deleteError } = await this.supabase
      .from("employee_hours")
      .delete()
      .eq("employee_id", employeeId);

    if (deleteError) {
      throw new AppError(`Failed to update employee hours: ${deleteError.message}`, 500);
    }

    if (!hours.length) {
      return [];
    }

    const rows = hours.map((day) => ({
      employee_id: employeeId,
      weekday: day.weekday,
      is_closed: day.isClosed,

      start_time: day.isClosed ? null : day.startTime,

      end_time: day.isClosed ? null : day.endTime,

      second_start_time: day.isClosed ? null : (day.secondStartTime ?? null),

      second_end_time: day.isClosed ? null : (day.secondEndTime ?? null),
    }));

    const { error: insertError } = await this.supabase.from("employee_hours").insert(rows);

    if (insertError) {
      throw new AppError(`Failed to update employee hours: ${insertError.message}`, 500);
    }

    return this.getHours(employeeId);
  }

  async getTimeOff(employeeId) {
    const { data, error } = await this.supabase
      .from("employee_time_off")
      .select(
        `
      id,
      employee_id,
      starts_at,
      ends_at,
      type,
      notes,
      created_at,
      updated_at
    `,
      )
      .eq("employee_id", employeeId)
      .order("starts_at", { ascending: true });

    if (error) {
      throw new AppError(`Failed to get employee time off: ${error.message}`, 500);
    }

    return data || [];
  }

  async findTimeOffById(timeOffId) {
    const { data, error } = await this.supabase
      .from("employee_time_off")
      .select(
        `
      id,
      employee_id,
      starts_at,
      ends_at,
      type,
      notes,
      created_at,
      updated_at
    `,
      )
      .eq("id", timeOffId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find employee time off: ${error.message}`, 500);
    }

    return data;
  }

  async createTimeOff(employeeId, timeOff) {
    const { data, error } = await this.supabase
      .from("employee_time_off")
      .insert({
        employee_id: employeeId,
        starts_at: timeOff.startsAt,
        ends_at: timeOff.endsAt,
        type: timeOff.type,
        notes: timeOff.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create employee time off: ${error.message}`, 500);
    }

    return data;
  }

  async updateTimeOff(timeOffId, timeOff) {
    const { data, error } = await this.supabase
      .from("employee_time_off")
      .update({
        starts_at: timeOff.startsAt,
        ends_at: timeOff.endsAt,
        type: timeOff.type,
        notes: timeOff.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", timeOffId)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update employee time off: ${error.message}`, 500);
    }

    return data;
  }

  async deleteTimeOff(timeOffId) {
    const { error } = await this.supabase.from("employee_time_off").delete().eq("id", timeOffId);

    if (error) {
      throw new AppError(`Failed to delete employee time off: ${error.message}`, 500);
    }
  }
}
