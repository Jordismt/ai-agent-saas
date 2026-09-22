import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class BusinessAgentConfigService {
  async getConfig(businessId) {
    return apiFetch(`/businesses/${businessId}/agent-config`);
  }

  async updateConfig(businessId, config) {
    return apiFetch(`/businesses/${businessId}/agent-config`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }
}
