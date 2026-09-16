import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class BusinessService {
  async createBusiness(businessData) {
    return apiFetch("/businesses", {
      method: "POST",
      body: JSON.stringify(businessData),
    });
  }

  async getBusinesses() {
    return apiFetch("/businesses", {
      method: "GET",
    });
  }

  async getBusinessById(id) {
    return apiFetch(`/businesses/${id}`, {
      method: "GET",
    });
  }

  async getBusinessServices(businessId) {
    return apiFetch(`/businesses/${businessId}/services`, {
      method: "GET",
    });
  }

  async createBusinessService(businessId, serviceData) {
    return apiFetch(`/businesses/${businessId}/services`, {
      method: "POST",
      body: JSON.stringify(serviceData),
    });
  }

  async deleteBusinessService(businessId, serviceId) {
    return apiFetch(`/businesses/${businessId}/services/${serviceId}`, {
      method: "DELETE",
    });
  }

  async updateBusinessService(businessId, serviceId, serviceData) {
    return apiFetch(`/businesses/${businessId}/services/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify(serviceData),
    });
  }
}
