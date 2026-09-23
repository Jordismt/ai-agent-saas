import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class DashboardService {
  async getSummary() {
    return apiFetch("/dashboard/summary", {
      method: "GET",
    });
  }
}
