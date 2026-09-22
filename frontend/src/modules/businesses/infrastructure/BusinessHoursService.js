import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class BusinessHoursService {
  async getByBusinessId(businessId) {
    return apiFetch(`/business-hours/businesses/${businessId}/hours`);
  }

  async update(businessId, hours) {
    return apiFetch(`/business-hours/businesses/${businessId}/hours`, {
      method: "PUT",
      body: JSON.stringify({
        hours,
      }),
    });
  }
}
