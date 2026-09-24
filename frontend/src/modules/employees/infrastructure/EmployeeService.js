import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class EmployeeService {
  async getByBusinessId(businessId) {
    return apiFetch(`/businesses/${businessId}/employees`);
  }

  async getById(employeeId) {
    return apiFetch(`/employees/${employeeId}`);
  }

  async create(businessId, data) {
    return apiFetch(`/businesses/${businessId}/employees`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(employeeId, data) {
    return apiFetch(`/employees/${employeeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deactivate(employeeId) {
    return apiFetch(`/employees/${employeeId}/deactivate`, {
      method: "PATCH",
    });
  }

  async getServices(employeeId) {
    return apiFetch(`/employees/${employeeId}/services`);
  }

  async updateServices(employeeId, serviceIds) {
    return apiFetch(`/employees/${employeeId}/services`, {
      method: "PUT",
      body: JSON.stringify({ serviceIds }),
    });
  }

  async getHours(employeeId) {
    return apiFetch(`/employees/${employeeId}/hours`);
  }

  async updateHours(employeeId, hours) {
    return apiFetch(`/employees/${employeeId}/hours`, {
      method: "PUT",
      body: JSON.stringify({ hours }),
    });
  }

  async getTimeOff(employeeId) {
    return apiFetch(`/employees/${employeeId}/time-off`);
  }

  async createTimeOff(employeeId, data) {
    return apiFetch(`/employees/${employeeId}/time-off`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTimeOff(employeeId, timeOffId, data) {
    return apiFetch(`/employees/${employeeId}/time-off/${timeOffId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTimeOff(employeeId, timeOffId) {
    return apiFetch(`/employees/${employeeId}/time-off/${timeOffId}`, {
      method: "DELETE",
    });
  }
}
