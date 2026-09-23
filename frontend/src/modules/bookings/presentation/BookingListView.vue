<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { BookingService } from "../infrastructure/BookingService.js";
import { BusinessService } from "../../businesses/infrastructure/BusinessService.js";

const route = useRoute();
const router = useRouter();

const bookingService = new BookingService();
const businessService = new BusinessService();

const bookings = ref([]);
const business = ref(null);

const loading = ref(false);
const error = ref("");
const updatingBookingId = ref(null);

const search = ref("");
const statusFilter = ref("all");
const dateFilter = ref("upcoming");

const businessId = computed(() => route.params.id);

const timezone = computed(() => {
  return business.value?.timezone || "Europe/Madrid";
});

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "no_show", label: "No presentado" },
];

const loadData = async () => {
  loading.value = true;
  error.value = "";

  try {
    const [businessData, bookingData] = await Promise.all([
      businessService.getBusinessById(businessId.value),
      bookingService.getByBusinessId(businessId.value),
    ]);

    business.value = businessData;
    bookings.value = Array.isArray(bookingData) ? bookingData : [];
  } catch (err) {
    console.error(err);
    error.value = err.message || "No se han podido cargar las reservas.";
  } finally {
    loading.value = false;
  }
};

const getDateParts = (date) => {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone.value,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(parsed);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

const getTodayKey = () => {
  return getDateParts(new Date());
};

const isToday = (booking) => {
  return getDateParts(booking.starts_at) === getTodayKey();
};

const isUpcoming = (booking) => {
  if (!booking?.starts_at) return false;

  return new Date(booking.starts_at).getTime() >= Date.now();
};

const isPast = (booking) => {
  if (!booking?.starts_at) return false;

  return new Date(booking.starts_at).getTime() < Date.now();
};

const matchesDateFilter = (booking) => {
  switch (dateFilter.value) {
    case "today":
      return isToday(booking);

    case "upcoming":
      return isUpcoming(booking);

    case "past":
      return isPast(booking);

    default:
      return true;
  }
};

const filteredBookings = computed(() => {
  const query = search.value.trim().toLowerCase();

  return bookings.value.filter((booking) => {
    const matchesStatus = statusFilter.value === "all" || booking.status === statusFilter.value;

    const matchesSearch =
      !query ||
      booking.customer_name?.toLowerCase().includes(query) ||
      booking.customer_email?.toLowerCase().includes(query) ||
      booking.customer_phone?.toLowerCase().includes(query) ||
      booking.service_name?.toLowerCase().includes(query) ||
      booking.notes?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch && matchesDateFilter(booking);
  });
});

const upcomingCount = computed(() => {
  return bookings.value.filter(
    (booking) => isUpcoming(booking) && !["cancelled", "completed", "no_show"].includes(booking.status),
  ).length;
});

const pendingCount = computed(() => {
  return bookings.value.filter((booking) => booking.status === "pending").length;
});

const confirmedCount = computed(() => {
  return bookings.value.filter((booking) => booking.status === "confirmed").length;
});

const completedCount = computed(() => {
  return bookings.value.filter((booking) => booking.status === "completed").length;
});

const cancelledCount = computed(() => {
  return bookings.value.filter((booking) => booking.status === "cancelled").length;
});

const noShowCount = computed(() => {
  return bookings.value.filter((booking) => booking.status === "no_show").length;
});

const formatDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone.value,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatTime = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone.value,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "-";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(numericPrice);
};

const getStatusLabel = (status) => {
  const option = statusOptions.find((item) => item.value === status);

  return option?.label || status;
};

const getInitials = (name) => {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const goBack = () => {
  router.push(`/businesses/${businessId.value}`);
};

const openConversation = (booking) => {
  if (!booking.conversation_id) return;

  router.push(`/businesses/${businessId.value}/conversations/${booking.conversation_id}`);
};

const setStatusFilter = (status) => {
  statusFilter.value = status;
  dateFilter.value = "all";
};

const showUpcoming = () => {
  statusFilter.value = "all";
  dateFilter.value = "upcoming";
};

const clearFilters = () => {
  search.value = "";
  statusFilter.value = "all";
  dateFilter.value = "upcoming";
};

const handleStatusChange = async (booking, event) => {
  const previousStatus = booking.status;
  const newStatus = event.target.value;

  if (newStatus === previousStatus) return;

  updatingBookingId.value = booking.id;
  error.value = "";

  try {
    const updatedBooking = await bookingService.updateStatus(booking.id, newStatus);

    const index = bookings.value.findIndex((item) => item.id === booking.id);

    if (index !== -1) {
      bookings.value[index] = updatedBooking;
    }
  } catch (err) {
    console.error(err);

    event.target.value = previousStatus;

    error.value = err.message || "No se ha podido actualizar el estado de la reserva.";
  } finally {
    updatingBookingId.value = null;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="bookings-page">
    <div class="page-container">
      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <button type="button" @click="goBack">
          {{ business?.name || "Negocio" }}
        </button>

        <span>/</span>

        <span>Reservas</span>
      </nav>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8" />

              <path
                d="M16 3v4M8 3v4M3 10h18"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round" />

              <path
                d="m9 15 2 2 4-4"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>

          <div>
            <p class="eyebrow">Agenda</p>

            <h1>Reservas</h1>

            <p class="page-description">Gestiona las citas captadas automáticamente por tu agente.</p>
          </div>
        </div>

        <button type="button" class="refresh-button" :disabled="loading" @click="loadData">
          <svg :class="{ rotating: loading }" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>

          {{ loading ? "Actualizando..." : "Actualizar" }}
        </button>
      </header>

      <section class="stats-grid">
        <button
          type="button"
          class="stat-card"
          :class="{
            selected: dateFilter === 'upcoming' && statusFilter === 'all',
          }"
          @click="showUpcoming">
          <div class="stat-icon upcoming">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />

              <path
                d="M12 7v5l3 2"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>

          <strong>{{ upcomingCount }}</strong>
          <span>Próximas</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'pending' }"
          @click="setStatusFilter('pending')">
          <div class="stat-icon pending">◷</div>

          <strong>{{ pendingCount }}</strong>
          <span>Pendientes</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'confirmed' }"
          @click="setStatusFilter('confirmed')">
          <div class="stat-icon confirmed">✓</div>

          <strong>{{ confirmedCount }}</strong>
          <span>Confirmadas</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'completed' }"
          @click="setStatusFilter('completed')">
          <div class="stat-icon completed">↑</div>

          <strong>{{ completedCount }}</strong>
          <span>Completadas</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'cancelled' }"
          @click="setStatusFilter('cancelled')">
          <div class="stat-icon cancelled">×</div>

          <strong>{{ cancelledCount }}</strong>
          <span>Canceladas</span>
        </button>
      </section>

      <div v-if="error" class="error-banner">
        <div class="error-icon">!</div>

        <div>
          <strong>Ha ocurrido un error</strong>
          <span>{{ error }}</span>
        </div>

        <button type="button" @click="loadData">Reintentar</button>
      </div>

      <section class="bookings-card">
        <div class="bookings-toolbar">
          <div>
            <div class="bookings-title">
              <h2>Agenda de reservas</h2>

              <span>
                {{ filteredBookings.length }}
              </span>
            </div>

            <p>Consulta y gestiona las citas registradas para este negocio.</p>
          </div>

          <div class="toolbar-actions">
            <div class="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />

                <path d="m20 20-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>

              <input v-model="search" type="search" placeholder="Buscar reserva..." />
            </div>

            <select v-model="dateFilter" class="filter-select">
              <option value="today">Hoy</option>

              <option value="upcoming">Próximas</option>

              <option value="past">Pasadas</option>

              <option value="all">Todas las fechas</option>
            </select>

            <select v-model="statusFilter" class="filter-select">
              <option value="all">Todos los estados</option>

              <option value="pending">Pendientes</option>

              <option value="confirmed">Confirmadas</option>

              <option value="completed">Completadas</option>

              <option value="cancelled">Canceladas</option>

              <option value="no_show">No presentados</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>

          <div>
            <strong>Cargando reservas</strong>
            <span>Obteniendo la agenda del negocio...</span>
          </div>
        </div>

        <div v-else-if="bookings.length === 0" class="empty-state">
          <div class="empty-visual">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.7" />

              <path
                d="M16 3v4M8 3v4M3 10h18"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round" />
            </svg>
          </div>

          <h3>Todavía no tienes reservas</h3>

          <p>
            Cuando un cliente reserve una cita mediante el agente, aparecerá automáticamente en esta sección.
          </p>

          <div class="empty-info">
            <span>✦</span>

            <p>
              AgentFlow registra el servicio, los datos del cliente, la fecha, la hora y el estado de cada
              cita.
            </p>
          </div>
        </div>

        <div v-else-if="filteredBookings.length === 0" class="empty-state compact">
          <div class="empty-visual">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />

              <path d="m20 20-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </div>

          <h3>No hay reservas</h3>

          <p>No encontramos citas que coincidan con los filtros actuales.</p>

          <button type="button" class="clear-filter" @click="clearFilters">Limpiar filtros</button>
        </div>

        <div v-else class="table-wrapper">
          <table class="bookings-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha y hora</th>
                <th>Contacto</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="booking in filteredBookings" :key="booking.id">
                <td>
                  <div class="customer-profile">
                    <div class="customer-avatar">
                      {{ getInitials(booking.customer_name) }}
                    </div>

                    <div>
                      <strong>
                        {{ booking.customer_name || "Sin nombre" }}
                      </strong>

                      <span> ID {{ booking.id?.slice(0, 8) }} </span>
                    </div>
                  </div>
                </td>

                <td>
                  <div class="service-info">
                    <strong>
                      {{ booking.service_name || "Servicio" }}
                    </strong>

                    <span v-if="booking.duration_minutes"> {{ booking.duration_minutes }} min </span>
                  </div>
                </td>

                <td>
                  <div class="booking-date">
                    <strong>
                      {{ formatDate(booking.starts_at) }}
                    </strong>

                    <span>
                      {{ formatTime(booking.starts_at) }}
                      –
                      {{ formatTime(booking.ends_at) }}
                    </span>
                  </div>
                </td>

                <td>
                  <div class="contact-info">
                    <a v-if="booking.customer_phone" :href="`tel:${booking.customer_phone}`">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"
                          stroke="currentColor"
                          stroke-width="1.6"
                          stroke-linecap="round" />
                      </svg>

                      {{ booking.customer_phone }}
                    </a>

                    <a v-if="booking.customer_email" :href="`mailto:${booking.customer_email}`">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          stroke-width="1.7" />

                        <path d="m3 7 9 6 9-6" stroke="currentColor" stroke-width="1.7" />
                      </svg>

                      {{ booking.customer_email }}
                    </a>

                    <span v-if="!booking.customer_phone && !booking.customer_email" class="no-data">
                      Sin contacto
                    </span>
                  </div>
                </td>

                <td>
                  <span class="booking-price">
                    {{ formatPrice(booking.price) }}
                  </span>
                </td>

                <td>
                  <div class="status-control">
                    <span class="status-dot" :class="`dot-${booking.status}`"></span>

                    <select
                      :value="booking.status"
                      :class="`status-${booking.status}`"
                      :disabled="updatingBookingId === booking.id"
                      :aria-label="`Estado: ${getStatusLabel(booking.status)}`"
                      @change="handleStatusChange(booking, $event)">
                      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>

                    <div v-if="updatingBookingId === booking.id" class="mini-spinner"></div>
                  </div>
                </td>

                <td>
                  <button
                    v-if="booking.conversation_id"
                    type="button"
                    class="conversation-button"
                    title="Abrir conversación"
                    @click="openConversation(booking)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linejoin="round" />
                    </svg>
                  </button>

                  <span v-else class="no-conversation" title="Sin conversación asociada"> — </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!loading && bookings.length > 0" class="table-footer">
          <span>
            Mostrando
            <strong>{{ filteredBookings.length }}</strong>
            de
            <strong>{{ bookings.length }}</strong>
            reservas
          </span>

          <span>
            <strong>{{ upcomingCount }}</strong>
            próximas ·
            <strong>{{ noShowCount }}</strong>
            no presentados
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bookings-page {
  min-height: 100vh;
  padding: 34px 48px 80px;
}

.page-container {
  width: min(1220px, 100%);
  margin: 0 auto;
}

/* BREADCRUMB */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-bottom: 25px;

  color: var(--text-muted);

  font-size: 13px;
}

.breadcrumb a,
.breadcrumb button {
  padding: 0;

  border: 0;

  background: transparent;
  color: var(--text-secondary);

  font: inherit;
  font-weight: 500;

  text-decoration: none;

  cursor: pointer;
}

.breadcrumb a:hover,
.breadcrumb button:hover {
  color: var(--primary);
}

/* HEADER */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;

  margin-bottom: 26px;
}

.header-content {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  width: 48px;
  height: 48px;

  flex: 0 0 48px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 12px;

  background: #0f172a;
  color: #93c5fd;

  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.13);
}

.eyebrow {
  margin: 0 0 4px;

  color: var(--primary);

  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 0;

  color: var(--text);

  font-size: 30px;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.page-description {
  max-width: 650px;

  margin: 5px 0 0;

  color: var(--text-secondary);

  font-size: 15px;
  line-height: 1.6;
}

.refresh-button {
  min-height: 40px;

  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 14px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  border-color: #cbd5e1;
  background: var(--surface-soft);
  color: var(--text);
}

.refresh-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rotating {
  animation: spin 0.8s linear infinite;
}

/* STATS */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 9px;

  margin-bottom: 18px;
}

.stat-card {
  min-height: 116px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  padding: 14px;

  border: 1px solid var(--border);
  border-radius: 10px;

  background: var(--surface);

  font: inherit;
  text-align: left;

  box-shadow: var(--shadow-sm);

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.stat-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.stat-card.selected {
  border-color: #93c5fd;

  box-shadow:
    var(--shadow-sm),
    0 0 0 2px rgba(37, 99, 235, 0.05);
}

.stat-icon {
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 10px;

  border-radius: 7px;

  font-size: 11px;
  font-weight: 700;
}

.stat-icon.upcoming {
  background: var(--primary-soft);
  color: var(--primary);
}

.stat-icon.pending {
  background: #fff7ed;
  color: #c2410c;
}

.stat-icon.confirmed {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.completed {
  background: #ecfdf3;
  color: #16a34a;
}

.stat-icon.cancelled {
  background: #fef2f2;
  color: #dc2626;
}

.stat-card > strong {
  color: var(--text);

  font-size: 23px;
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-card > span {
  margin-top: 6px;

  color: var(--text-muted);

  font-size: 12px;
  line-height: 1.4;
}

/* MAIN CARD */

.bookings-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.bookings-toolbar {
  min-height: 76px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 14px 15px;

  border-bottom: 1px solid var(--border);
}

.bookings-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.bookings-title h2 {
  margin: 0;

  color: var(--text);

  font-size: 16px;
}

.bookings-title > span {
  min-width: 22px;
  height: 22px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 6px;

  border-radius: 999px;

  background: var(--surface-soft);
  color: var(--text-secondary);

  font-size: 10px;
  font-weight: 600;
}

.bookings-toolbar p {
  margin: 4px 0 0;

  color: var(--text-muted);

  font-size: 12px;
  line-height: 1.45;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.search-box {
  width: 190px;
  min-height: 40px;

  display: flex;
  align-items: center;
  gap: 7px;

  padding: 0 11px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text-muted);
}

.search-box:focus-within {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.06);
}

.search-box input {
  width: 100%;

  border: 0;
  outline: 0;

  background: transparent;
  color: var(--text);

  font: inherit;
  font-size: 13px;
}

.search-box input::placeholder {
  color: #98a2b3;
}

.filter-select {
  min-height: 40px;

  padding: 0 28px 0 11px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 13px;

  outline: none;

  cursor: pointer;
}

/* TABLE */

.table-wrapper {
  width: 100%;

  overflow-x: auto;
}

.bookings-table {
  width: 100%;

  border-collapse: collapse;
}

.bookings-table th {
  padding: 11px 12px;

  border-bottom: 1px solid var(--border);

  background: #fafbfc;
  color: var(--text-muted);

  font-size: 10px;
  font-weight: 600;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  white-space: nowrap;
}

.bookings-table td {
  padding: 14px 12px;

  border-bottom: 1px solid var(--border);

  vertical-align: middle;
}

.bookings-table tbody tr {
  transition: background 0.15s ease;
}

.bookings-table tbody tr:hover {
  background: #fafbfc;
}

.bookings-table tbody tr:last-child td {
  border-bottom: 0;
}

/* CUSTOMER */

.customer-profile {
  min-width: 155px;

  display: flex;
  align-items: center;
  gap: 9px;
}

.customer-avatar {
  width: 35px;
  height: 35px;

  flex: 0 0 35px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: #eef2ff;
  color: #4f46e5;

  font-size: 11px;
  font-weight: 700;
}

.customer-profile > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-profile strong {
  overflow: hidden;

  max-width: 160px;

  color: var(--text);

  font-size: 13px;
  font-weight: 600;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-profile span {
  color: var(--text-muted);

  font-family: monospace;
  font-size: 10px;
}

/* SERVICE */

.service-info {
  min-width: 110px;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.service-info strong {
  color: var(--text);

  font-size: 12px;
  font-weight: 600;
}

.service-info span {
  color: var(--text-muted);

  font-size: 11px;
}

/* DATE */

.booking-date {
  min-width: 135px;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.booking-date strong {
  color: var(--text-secondary);

  font-size: 12px;
  font-weight: 600;

  text-transform: capitalize;
}

.booking-date span {
  color: var(--text-muted);

  font-size: 11px;
}

/* CONTACT */

.contact-info {
  min-width: 135px;

  display: flex;
  flex-direction: column;
  gap: 5px;
}

.contact-info a {
  max-width: 190px;

  display: flex;
  align-items: center;
  gap: 5px;

  overflow: hidden;

  color: var(--text-secondary);

  font-size: 12px;
  line-height: 1.4;

  text-decoration: none;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-info a:hover {
  color: var(--primary);
}

.no-data {
  color: var(--text-muted);

  font-size: 11px;
}

/* PRICE */

.booking-price {
  color: var(--text);

  font-size: 12px;
  font-weight: 600;

  white-space: nowrap;
}

/* STATUS */

.status-control {
  position: relative;

  min-width: 138px;

  display: flex;
  align-items: center;
}

.status-dot {
  position: absolute;
  left: 9px;
  z-index: 2;

  width: 6px;
  height: 6px;

  border-radius: 50%;

  pointer-events: none;
}

.status-control select {
  width: 100%;
  min-height: 36px;

  padding: 0 27px 0 21px;

  border: 1px solid transparent;
  border-radius: 7px;

  font: inherit;
  font-size: 11px;
  font-weight: 600;

  outline: none;

  cursor: pointer;
}

.status-control select:disabled {
  opacity: 0.55;
  cursor: wait;
}

.status-pending {
  background: #fff7ed;
  color: #9a3412;
}

.status-confirmed {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-completed {
  background: #ecfdf3;
  color: #15803d;
}

.status-cancelled {
  background: #fef2f2;
  color: #b42318;
}

.status-no_show {
  background: #f5f3ff;
  color: #6d28d9;
}

.dot-pending {
  background: #f97316;
}

.dot-confirmed {
  background: #3b82f6;
}

.dot-completed {
  background: #22c55e;
}

.dot-cancelled {
  background: #ef4444;
}

.dot-no_show {
  background: #8b5cf6;
}

.mini-spinner {
  position: absolute;
  right: -18px;

  width: 10px;
  height: 10px;

  border: 1.5px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

/* CONVERSATION */

.conversation-button {
  width: 34px;
  height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: white;
  color: var(--text-secondary);

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.conversation-button:hover {
  border-color: #bfdbfe;

  background: var(--primary-soft);
  color: var(--primary);
}

.no-conversation {
  display: inline-flex;

  width: 34px;

  justify-content: center;

  color: var(--text-muted);

  font-size: 12px;
}

/* FOOTER */

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 11px 12px;

  border-top: 1px solid var(--border);

  background: #fafbfc;
  color: var(--text-muted);

  font-size: 11px;
  line-height: 1.45;
}

.table-footer strong {
  color: var(--text-secondary);
}

/* ERROR */

.error-banner {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 12px;
  padding: 10px;

  border: 1px solid #fecaca;
  border-radius: 9px;

  background: var(--danger-soft);
  color: var(--danger);
}

.error-icon {
  width: 23px;
  height: 23px;

  flex: 0 0 23px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #fee2e2;

  font-size: 10px;
  font-weight: 700;
}

.error-banner > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.error-banner strong {
  font-size: 13px;
}

.error-banner span {
  font-size: 12px;
  line-height: 1.45;
}

.error-banner button {
  margin-left: auto;

  padding: 6px 9px;

  border: 1px solid currentColor;
  border-radius: 6px;

  background: transparent;
  color: inherit;

  font: inherit;
  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

/* EMPTY */

.empty-state {
  min-height: 320px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 35px;

  text-align: center;
}

.empty-state.compact {
  min-height: 270px;
}

.empty-visual {
  width: 45px;
  height: 45px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 12px;

  border-radius: 12px;

  background: var(--surface-soft);
  color: var(--text-muted);
}

.empty-state h3 {
  margin: 0;

  color: var(--text);

  font-size: 16px;
}

.empty-state > p {
  max-width: 430px;

  margin: 5px 0 0;

  color: var(--text-muted);

  font-size: 13px;
  line-height: 1.6;
}

.empty-info {
  max-width: 430px;

  display: flex;
  align-items: flex-start;
  gap: 7px;

  margin-top: 15px;
  padding: 10px 12px;

  border-radius: 8px;

  background: #f8fbff;

  color: var(--text-secondary);

  text-align: left;
}

.empty-info > span {
  color: var(--primary);

  font-size: 11px;
}

.empty-info p {
  margin: 0;

  font-size: 12px;
  line-height: 1.55;
}

.clear-filter {
  min-height: 38px;

  margin-top: 13px;
  padding: 0 12px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
}

/* LOADING */

.loading-state {
  min-height: 300px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-state > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loading-state strong {
  color: var(--text);

  font-size: 13px;
}

.loading-state span {
  color: var(--text-muted);

  font-size: 11px;
}

.spinner {
  width: 20px;
  height: 20px;

  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .bookings-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
  }

  .search-box {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 850px) {
  .bookings-page {
    padding: 30px 32px 60px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }

  .search-box {
    min-width: 220px;
  }
}

@media (max-width: 700px) {
  .bookings-page {
    padding: 24px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
    min-height: 44px;

    font-size: 14px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
    min-width: 0;
    min-height: 44px;

    box-sizing: border-box;
  }

  .filter-select {
    width: 100%;
    min-height: 44px;
  }

  .search-box input,
  .filter-select {
    font-size: 16px;
  }

  .table-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .eyebrow {
    font-size: 11px;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .page-description {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .header-content {
    align-items: flex-start;
  }

  .header-icon {
    width: 43px;
    height: 43px;

    flex-basis: 43px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .stats-grid {
    gap: 7px;
  }

  .stat-card {
    min-height: 108px;
  }

  .stat-card > strong {
    font-size: 22px;
  }
}
</style>
