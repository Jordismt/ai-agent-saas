import { apiFetch } from "../../../infrastructure/http/apiClient.js";

const API_URL = import.meta.env.VITE_API_URL;

export class PublicPageService {
  async getByBusinessId(businessId) {
    return apiFetch(`/businesses/${businessId}/public-page`, {
      method: "GET",
    });
  }

  async save(businessId, data) {
    return apiFetch(`/businesses/${businessId}/public-page`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getPublishedBySlug(slug) {
    const response = await fetch(`${API_URL}/public/pages/${encodeURIComponent(slug)}`);

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.error || "No se ha podido cargar la web pública.");
    }

    return data;
  }
}
