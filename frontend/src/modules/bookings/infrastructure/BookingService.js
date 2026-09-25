import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class BookingService {
  async getByBusinessId(businessId) {
    return apiFetch(`/businesses/${businessId}/bookings`);
  }

  async updateStatus(bookingId, status) {
    return apiFetch(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getAvailability(businessId, serviceId, date) {
    const params = new URLSearchParams({
      serviceId,
      date,
    });

    return apiFetch(`/businesses/${businessId}/bookings/availability?${params.toString()}`);
  }

  async create(businessId, data) {
    return apiFetch(`/businesses/${businessId}/bookings`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async createManual(businessId, data) {
    return apiFetch(`/businesses/${businessId}/bookings/manual`, {
      method: "POST", body: JSON.stringify(data),
    });
  }

  async updateManual(bookingId, data) {
    return apiFetch(`/bookings/${bookingId}/manual`, {
      method: "PATCH", body: JSON.stringify(data),
    });
  }

  async cancelManual(bookingId, reason = null) {
    return apiFetch(`/bookings/${bookingId}/manual/cancel`, {
      method: "PATCH", body: JSON.stringify({ reason }),
    });
  }

}
