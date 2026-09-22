import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class LeadService {
  async getByBusinessId(businessId) {
    return apiFetch(`/businesses/${businessId}/leads`);
  }

  async updateStatus(leadId, status) {
    return apiFetch(`/leads/${leadId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}
