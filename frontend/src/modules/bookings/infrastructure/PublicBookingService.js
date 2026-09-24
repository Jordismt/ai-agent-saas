const API_URL = import.meta.env.VITE_API_URL;

export class PublicBookingService {
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(options.headers || {}),
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "No se ha podido completar la operación.");
    }

    return data;
  }

  async getBooking(token) {
    return this.request(`/public/bookings/manage/${encodeURIComponent(token)}`);
  }

  async getAvailability(token, date, employeeId = null) {
    const params = new URLSearchParams();

    params.set("date", date);

    if (employeeId) {
      params.set("employeeId", employeeId);
    }

    return this.request(
      `/public/bookings/manage/${encodeURIComponent(token)}/availability?${params.toString()}`,
    );
  }

  async reschedule(token, { date, time, employeeId = null }) {
    return this.request(`/public/bookings/manage/${encodeURIComponent(token)}/reschedule`, {
      method: "PATCH",

      body: JSON.stringify({
        date,
        time,
        employeeId,
      }),
    });
  }

  async cancel(token, reason = null) {
    return this.request(`/public/bookings/manage/${encodeURIComponent(token)}/cancel`, {
      method: "PATCH",

      body: JSON.stringify({
        reason,
      }),
    });
  }
}
