<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { PublicBookingService } from "../infrastructure/PublicBookingService.js";

const route = useRoute();
const bookingService = new PublicBookingService();

const booking = ref(null);

const loading = ref(true);
const error = ref("");

const mode = ref("details");

const selectedDate = ref("");
const selectedEmployeeId = ref("");
const slots = ref([]);
const loadingSlots = ref(false);
const slotsError = ref("");

const rescheduling = ref(false);
const rescheduleError = ref("");

const cancelling = ref(false);
const cancelError = ref("");
const cancellationReason = ref("");

const successMessage = ref("");

const token = computed(() => String(route.params.token || ""));

const isCancelled = computed(() => {
  return booking.value?.status === "cancelled";
});

const isPast = computed(() => {
  if (!booking.value?.starts_at) return false;

  return new Date(booking.value.starts_at).getTime() <= Date.now();
});

const canManage = computed(() => {
  if (!booking.value) return false;

  return !isCancelled.value && !isPast.value && !["completed", "no_show"].includes(booking.value.status);
});

const statusConfig = computed(() => {
  switch (booking.value?.status) {
    case "confirmed":
      return {
        label: "Confirmada",
        title: "Tu reserva está confirmada",
        description: "Todo listo. Te esperamos.",
        type: "success",
      };

    case "pending":
      return {
        label: "Pendiente",
        title: "Reserva pendiente",
        description: "Tu reserva está pendiente de confirmación.",
        type: "pending",
      };

    case "cancelled":
      return {
        label: "Cancelada",
        title: "Reserva cancelada",
        description: "Esta reserva ya no está activa.",
        type: "cancelled",
      };

    case "completed":
      return {
        label: "Completada",
        title: "Reserva completada",
        description: "Esta reserva ya ha finalizado.",
        type: "neutral",
      };

    case "no_show":
      return {
        label: "Finalizada",
        title: "Reserva finalizada",
        description: "Esta reserva ya no puede modificarse.",
        type: "neutral",
      };

    default:
      return {
        label: "Reserva",
        title: "Tu reserva",
        description: "",
        type: "neutral",
      };
  }
});

const formattedDate = computed(() => {
  if (!booking.value?.starts_at) return "—";

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(booking.value.starts_at));
});

const formattedTime = computed(() => {
  if (!booking.value?.starts_at) return "—";

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(booking.value.starts_at));
});

const formattedPrice = computed(() => {
  const price = Number(booking.value?.price);

  if (!Number.isFinite(price)) return null;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(price);
});

const availableEmployees = computed(() => {
  const employees = new Map();

  for (const slot of slots.value) {
    for (const employee of slot?.employees || []) {
      if (employee?.id && employee?.name) {
        employees.set(employee.id, employee);
      }
    }
  }

  return [...employees.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
});

const visibleSlots = computed(() => {
  if (!selectedEmployeeId.value) {
    return slots.value;
  }

  return slots.value.filter((slot) =>
    slot?.employees?.some((employee) => employee.id === selectedEmployeeId.value),
  );
});

const minimumDate = computed(() => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
});

const formatSlotTime = (slot) => {
  if (slot?.localTime) {
    return slot.localTime;
  }

  if (slot?.startsAt) {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(slot.startsAt));
  }

  return "—";
};

const loadBooking = async () => {
  loading.value = true;
  error.value = "";

  try {
    booking.value = await bookingService.getBooking(token.value);
  } catch (err) {
    console.error(err);

    error.value = err.message || "No hemos podido encontrar esta reserva.";
  } finally {
    loading.value = false;
  }
};

const openReschedule = () => {
  mode.value = "reschedule";
  selectedDate.value = "";
  selectedEmployeeId.value = "";
  slots.value = [];
  slotsError.value = "";
  rescheduleError.value = "";
  successMessage.value = "";
};

const closeReschedule = () => {
  mode.value = "details";
  selectedDate.value = "";
  selectedEmployeeId.value = "";
  slots.value = [];
  slotsError.value = "";
  rescheduleError.value = "";
};

const loadAvailability = async () => {
  if (!selectedDate.value) {
    slots.value = [];
    return;
  }

  loadingSlots.value = true;
  slotsError.value = "";
  slots.value = [];
  selectedEmployeeId.value = "";

  try {
    const result = await bookingService.getAvailability(token.value, selectedDate.value, null);

    slots.value = Array.isArray(result) ? result : [];
  } catch (err) {
    console.error(err);

    slotsError.value = err.message || "No hemos podido consultar la disponibilidad.";
  } finally {
    loadingSlots.value = false;
  }
};

const selectSlot = async (slot) => {
  const time = slot?.localTime || formatSlotTime(slot);

  if (!time || time === "—" || !selectedDate.value || rescheduling.value) {
    return;
  }

  rescheduling.value = true;
  rescheduleError.value = "";

  try {
    booking.value = await bookingService.reschedule(token.value, {
      date: selectedDate.value,
      time,
      employeeId: selectedEmployeeId.value || null,
    });

    mode.value = "details";
    selectedDate.value = "";
    slots.value = [];

    successMessage.value = "Tu reserva se ha modificado correctamente.";
  } catch (err) {
    console.error(err);

    rescheduleError.value = err.message || "No hemos podido modificar la reserva.";

    await loadAvailability();
  } finally {
    rescheduling.value = false;
  }
};

const openCancel = () => {
  mode.value = "cancel";
  cancellationReason.value = "";
  cancelError.value = "";
  successMessage.value = "";
};

const closeCancel = () => {
  mode.value = "details";
  cancellationReason.value = "";
  cancelError.value = "";
};

const confirmCancellation = async () => {
  if (cancelling.value) return;

  cancelling.value = true;
  cancelError.value = "";

  try {
    booking.value = await bookingService.cancel(token.value, cancellationReason.value);

    mode.value = "details";
    successMessage.value = "Tu reserva ha sido cancelada correctamente.";
  } catch (err) {
    console.error(err);

    cancelError.value = err.message || "No hemos podido cancelar la reserva.";
  } finally {
    cancelling.value = false;
  }
};

onMounted(loadBooking);
</script>

<template>
  <div class="manage-page">
    <div class="background-glow background-glow-one"></div>
    <div class="background-glow background-glow-two"></div>

    <header class="topbar">
      <div class="topbar-inner">
        <a href="/" class="brand">
          <div class="brand-logo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7.5 5.5h7.2c2.5 0 4.3 1.35 4.3 3.55 0 1.52-.85 2.65-2.25 3.18 1.82.42 2.85 1.72 2.85 3.58 0 2.65-2.1 4.19-5.15 4.19H7.5V5.5Zm3.1 2.45v3.2h3.55c1.12 0 1.78-.58 1.78-1.6 0-1.03-.66-1.6-1.78-1.6H10.6Zm0 5.55v4.05h3.85c1.28 0 2.03-.7 2.03-2.03 0-1.3-.75-2.02-2.03-2.02H10.6Z"
                fill="currentColor" />
            </svg>
          </div>

          <span>Resbix</span>
        </a>

        <div class="secure-label">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8" />
            <path
              d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round" />
          </svg>

          Enlace privado
        </div>
      </div>
    </header>

    <main class="page-content">
      <!-- Loading -->
      <section v-if="loading" class="booking-card loading-card">
        <div class="skeleton skeleton-circle"></div>

        <div class="skeleton-content">
          <div class="skeleton skeleton-small"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-subtitle"></div>
        </div>

        <div class="skeleton-panel">
          <div v-for="index in 4" :key="index" class="skeleton-row">
            <div class="skeleton skeleton-icon"></div>
            <div>
              <div class="skeleton skeleton-label"></div>
              <div class="skeleton skeleton-value"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Error -->
      <section v-else-if="error" class="booking-card error-state">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path
              d="M12 7.5v5.2M12 16.5v.1"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round" />
          </svg>
        </div>

        <span class="eyebrow">RESERVA NO DISPONIBLE</span>

        <h1>No hemos encontrado esta reserva</h1>

        <p>
          {{ error }}
        </p>

        <a href="/" class="secondary-button error-button"> Ir a Resbix </a>
      </section>

      <!-- Booking -->
      <section v-else-if="booking" class="booking-card">
        <!-- Details -->
        <template v-if="mode === 'details'">
          <div class="status-hero">
            <div class="status-icon" :class="`status-${statusConfig.type}`">
              <svg v-if="!isCancelled" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="m7.5 12.2 2.8 2.8 6.3-6.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>

              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="m8 8 8 8M16 8l-8 8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round" />
              </svg>
            </div>

            <div class="status-copy">
              <div class="status-line">
                <span class="status-badge" :class="`badge-${statusConfig.type}`">
                  <span class="status-dot"></span>
                  {{ statusConfig.label }}
                </span>
              </div>

              <h1>{{ statusConfig.title }}</h1>

              <p>{{ statusConfig.description }}</p>
            </div>
          </div>

          <div v-if="successMessage" class="success-alert">
            <div class="alert-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="m6.5 12 3.4 3.4 7.6-7.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>

            <span>{{ successMessage }}</span>
          </div>

          <div class="service-heading">
            <span class="section-label">TU CITA</span>

            <h2>{{ booking.service_name }}</h2>

            <p>
              Reserva a nombre de
              <strong>{{ booking.customer_name }}</strong>
            </p>
          </div>

          <div class="appointment-main">
            <div class="date-block">
              <div class="calendar-icon">
                <svg viewBox="0 0 24 24">
                  <rect
                    x="3.5"
                    y="5.5"
                    width="17"
                    height="15"
                    rx="3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7" />
                  <path
                    d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round" />
                </svg>
              </div>

              <div>
                <span class="detail-label">Fecha</span>
                <strong class="capitalize">
                  {{ formattedDate }}
                </strong>
              </div>
            </div>

            <div class="time-block">
              <span class="detail-label">Hora</span>

              <div class="big-time">
                {{ formattedTime }}
              </div>
            </div>
          </div>

          <div class="details-grid">
            <div v-if="booking.employee?.name" class="detail-item">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M5.5 20a6.5 6.5 0 0 1 13 0"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round" />
                </svg>
              </div>

              <div>
                <span>Profesional</span>
                <strong>{{ booking.employee.name }}</strong>
              </div>
            </div>

            <div v-if="booking.duration_minutes" class="detail-item">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M12 9v4l2.8 1.8M9 3h6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round" />
                </svg>
              </div>

              <div>
                <span>Duración</span>
                <strong> {{ booking.duration_minutes }} min </strong>
              </div>
            </div>

            <div v-if="formattedPrice" class="detail-item">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M15 8.5c-.7-.6-1.55-.9-2.5-.9-2.2 0-4 1.95-4 4.4s1.8 4.4 4 4.4c.95 0 1.8-.3 2.5-.9M7.5 10.5h5.5M7.5 13.5h5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round" />
                </svg>
              </div>

              <div>
                <span>Precio</span>
                <strong>{{ formattedPrice }}</strong>
              </div>
            </div>

            <div v-if="booking.customer_email" class="detail-item">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="5.5"
                    width="18"
                    height="13"
                    rx="3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7" />
                  <path
                    d="m5 8 7 5 7-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>

              <div class="email-detail">
                <span>Confirmación</span>
                <strong>{{ booking.customer_email }}</strong>
              </div>
            </div>
          </div>

          <div v-if="canManage" class="actions">
            <button type="button" class="primary-button" @click="openReschedule">
              <svg viewBox="0 0 24 24">
                <path
                  d="M19 12a7 7 0 1 1-2.05-4.95L19 9"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
                <path
                  d="M19 4v5h-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>

              Modificar reserva
            </button>

            <button type="button" class="cancel-link" @click="openCancel">Cancelar reserva</button>
          </div>

          <div v-else-if="isCancelled" class="disabled-message">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>

            Esta reserva está cancelada y ya no puede modificarse.
          </div>

          <div v-else-if="isPast" class="disabled-message">
            Esta reserva ya ha pasado y no puede modificarse.
          </div>
        </template>

        <!-- Reschedule -->
        <template v-else-if="mode === 'reschedule'">
          <button type="button" class="back-button" @click="closeReschedule">
            <svg viewBox="0 0 24 24">
              <path
                d="m15 18-6-6 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>

            Volver
          </button>

          <div class="flow-header">
            <div class="flow-icon blue">
              <svg viewBox="0 0 24 24">
                <rect
                  x="3.5"
                  y="5.5"
                  width="17"
                  height="15"
                  rx="3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7" />
                <path
                  d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round" />
              </svg>
            </div>

            <span class="section-label">CAMBIAR CITA</span>
            <h1>¿Cuándo te viene mejor?</h1>

            <p>Selecciona un nuevo día, el profesional que prefieras y una hora disponible.</p>
          </div>

          <div class="current-booking-mini">
            <span>Reserva actual</span>

            <strong>
              <span class="capitalize">{{ formattedDate }}</span>
              · {{ formattedTime }}
            </strong>
          </div>

          <div class="field-group">
            <label for="booking-date">Nueva fecha</label>

            <div class="date-input-wrapper">
              <svg viewBox="0 0 24 24">
                <rect
                  x="3.5"
                  y="5.5"
                  width="17"
                  height="15"
                  rx="3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7" />
                <path
                  d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round" />
              </svg>

              <input
                id="booking-date"
                v-model="selectedDate"
                type="date"
                :min="minimumDate"
                @change="loadAvailability" />
            </div>
          </div>

          <div v-if="selectedDate && !loadingSlots && availableEmployees.length" class="field-group">
            <label>Profesional</label>

            <div class="employee-options">
              <button
                type="button"
                class="employee-option"
                :class="{ active: selectedEmployeeId === '' }"
                @click="selectedEmployeeId = ''">
                <span class="employee-avatar any">✦</span>
                <span class="employee-option-copy">
                  <strong>Cualquier profesional</strong>
                  <small>Te asignaremos uno disponible</small>
                </span>
                <span class="employee-radio"></span>
              </button>

              <button
                v-for="employee in availableEmployees"
                :key="employee.id"
                type="button"
                class="employee-option"
                :class="{ active: selectedEmployeeId === employee.id }"
                @click="selectedEmployeeId = employee.id">
                <span class="employee-avatar">
                  {{ employee.name.charAt(0).toUpperCase() }}
                </span>
                <span class="employee-option-copy">
                  <strong>{{ employee.name }}</strong>
                  <small>Profesional disponible</small>
                </span>
                <span class="employee-radio"></span>
              </button>
            </div>
          </div>

          <div v-if="loadingSlots" class="slots-loading">
            <div v-for="index in 8" :key="index" class="slot-skeleton"></div>
          </div>

          <div v-else-if="slotsError" class="inline-error">
            {{ slotsError }}
          </div>

          <div v-else-if="selectedDate && slots.length === 0" class="empty-slots">
            <div class="empty-slots-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7" />
                <path d="M8.5 12h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </div>

            <strong>No hay horas disponibles</strong>
            <span>Prueba seleccionando otro día.</span>
          </div>

          <div v-else-if="visibleSlots.length" class="slots-section">
            <div class="slots-heading">
              <div>
                <span class="section-label"> HORAS DISPONIBLES </span>
                <h3>Elige una hora</h3>
              </div>

              <span class="slots-count">
                {{ visibleSlots.length }}
                {{ visibleSlots.length === 1 ? "hora" : "horas" }}
              </span>
            </div>

            <div class="slots-grid">
              <button
                v-for="slot in visibleSlots"
                :key="slot.startsAt"
                type="button"
                class="slot-button"
                :disabled="rescheduling"
                @click="selectSlot(slot)">
                {{ formatSlotTime(slot) }}
              </button>
            </div>
          </div>

          <div v-if="rescheduleError" class="inline-error">
            {{ rescheduleError }}
          </div>

          <div v-if="rescheduling" class="processing">
            <span class="spinner"></span>
            Modificando tu reserva...
          </div>
        </template>

        <!-- Cancellation -->
        <template v-else-if="mode === 'cancel'">
          <button type="button" class="back-button" @click="closeCancel">
            <svg viewBox="0 0 24 24">
              <path
                d="m15 18-6-6 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>

            Volver
          </button>

          <div class="flow-header cancel-header">
            <div class="flow-icon red">
              <svg viewBox="0 0 24 24">
                <path
                  d="m8 8 8 8M16 8l-8 8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round" />
              </svg>
            </div>

            <span class="section-label danger-label"> CANCELAR RESERVA </span>

            <h1>¿Seguro que quieres cancelar?</h1>

            <p>Tu cita quedará cancelada y esa hora volverá a estar disponible para otros clientes.</p>
          </div>

          <div class="cancel-summary">
            <div>
              <span>{{ booking.service_name }}</span>
              <strong class="capitalize">
                {{ formattedDate }}
              </strong>
            </div>

            <div class="cancel-summary-time">
              {{ formattedTime }}
            </div>
          </div>

          <div class="field-group">
            <label for="cancellation-reason">
              Motivo
              <span>Opcional</span>
            </label>

            <textarea
              id="cancellation-reason"
              v-model="cancellationReason"
              rows="4"
              maxlength="1000"
              placeholder="Puedes indicarnos el motivo de la cancelación..."></textarea>
          </div>

          <div v-if="cancelError" class="inline-error">
            {{ cancelError }}
          </div>

          <div class="cancel-actions">
            <button type="button" class="secondary-button" :disabled="cancelling" @click="closeCancel">
              Mantener reserva
            </button>

            <button type="button" class="danger-button" :disabled="cancelling" @click="confirmCancellation">
              <span v-if="cancelling" class="spinner white"></span>

              {{ cancelling ? "Cancelando..." : "Sí, cancelar" }}
            </button>
          </div>
        </template>
      </section>

      <div class="powered-by">
        <div class="powered-logo">R</div>

        <span>
          Reservas gestionadas con
          <strong>Resbix</strong>
        </span>
      </div>

      <p class="privacy-note">
        <svg viewBox="0 0 24 24">
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="3"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8" />
          <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" fill="none" stroke="currentColor" stroke-width="1.8" />
        </svg>

        Este enlace es privado y permite gestionar tu reserva.
      </p>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.manage-page {
  --bg: #f5f7fb;
  --card: #ffffff;
  --text: #111827;
  --muted: #697386;
  --soft-muted: #98a2b3;
  --border: #e6eaf0;
  --border-strong: #d9dee7;
  --primary: #15171a;
  --blue: #2563eb;
  --blue-soft: #eff6ff;
  --green: #079455;
  --green-soft: #ecfdf3;
  --red: #dc2626;
  --red-soft: #fff1f2;

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at 50% -20%, rgba(37, 99, 235, 0.08), transparent 36rem), var(--bg);
  color: var(--text);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.background-glow {
  position: fixed;
  z-index: 0;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.16;
  pointer-events: none;
}

.background-glow-one {
  top: 60px;
  left: -220px;
  background: #3b82f6;
}

.background-glow-two {
  right: -250px;
  bottom: 0;
  background: #8b5cf6;
}

.topbar {
  position: relative;
  z-index: 10;
  height: 72px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.topbar-inner {
  width: min(100% - 40px, 1040px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  text-decoration: none;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-logo {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #15171a;
  color: #fff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.08),
    0 5px 14px rgba(0, 0, 0, 0.1);
}

.brand-logo svg {
  width: 21px;
  height: 21px;
}

.secure-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  color: #7c8799;
  font-size: 12px;
  font-weight: 600;
}

.secure-label svg {
  width: 14px;
  height: 14px;
}

.page-content {
  position: relative;
  z-index: 2;
  width: min(100% - 32px, 650px);
  margin: 0 auto;
  padding: 54px 0 44px;
}

.booking-card {
  width: 100%;
  padding: 36px;
  border: 1px solid rgba(218, 223, 232, 0.88);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.02),
    0 8px 24px rgba(16, 24, 40, 0.035),
    0 28px 70px rgba(16, 24, 40, 0.055);
}

.status-hero {
  display: flex;
  align-items: flex-start;
  gap: 17px;
}

.status-icon {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.status-icon svg {
  width: 25px;
  height: 25px;
}

.status-success {
  background: var(--green-soft);
  color: var(--green);
  box-shadow: inset 0 0 0 1px #d1fadf;
}

.status-pending {
  background: #fff8eb;
  color: #dc6803;
}

.status-cancelled {
  background: var(--red-soft);
  color: var(--red);
}

.status-neutral {
  background: #f2f4f7;
  color: #667085;
}

.status-copy {
  min-width: 0;
  padding-top: 1px;
}

.status-line {
  margin-bottom: 7px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge-success {
  color: #067647;
  background: #ecfdf3;
}

.badge-pending {
  color: #b54708;
  background: #fffaeb;
}

.badge-cancelled {
  color: #b42318;
  background: #fef3f2;
}

.badge-neutral {
  color: #475467;
  background: #f2f4f7;
}

.status-copy h1,
.flow-header h1 {
  margin: 0;
  color: #101828;
  font-size: 25px;
  line-height: 1.22;
  font-weight: 780;
  letter-spacing: -0.035em;
}

.status-copy p,
.flow-header p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 25px;
  padding: 13px 15px;
  border: 1px solid #abefc6;
  border-radius: 14px;
  background: #ecfdf3;
  color: #067647;
  font-size: 13px;
  font-weight: 650;
}

.alert-icon {
  width: 24px;
  height: 24px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #d1fadf;
}

.alert-icon svg {
  width: 14px;
  height: 14px;
}

.service-heading {
  margin-top: 35px;
}

.section-label {
  display: block;
  margin-bottom: 7px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.service-heading h2 {
  margin: 0;
  color: #101828;
  font-size: 23px;
  font-weight: 760;
  letter-spacing: -0.035em;
}

.service-heading p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.service-heading strong {
  color: #475467;
  font-weight: 650;
}

.appointment-main {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 24px;
  margin-top: 20px;
  padding: 21px;
  border: 1px solid #e4e7ec;
  border-radius: 18px;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
}

.date-block {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 13px;
}

.calendar-icon {
  width: 43px;
  height: 43px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #e4e7ec;
  border-radius: 12px;
  background: white;
  color: #475467;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
}

.calendar-icon svg {
  width: 21px;
  height: 21px;
}

.detail-label {
  display: block;
  margin-bottom: 4px;
  color: #98a2b3;
  font-size: 11px;
  font-weight: 650;
}

.date-block strong {
  display: block;
  color: #344054;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 700;
}

.capitalize::first-letter {
  text-transform: uppercase;
}

.time-block {
  padding-left: 22px;
  border-left: 1px solid #eaecf0;
}

.big-time {
  color: #101828;
  font-size: 28px;
  line-height: 1;
  font-weight: 780;
  letter-spacing: -0.05em;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-top: 14px;
  border: 1px solid #e4e7ec;
  border-radius: 18px;
  background: #e4e7ec;
}

.detail-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px;
  background: white;
}

.detail-icon {
  width: 35px;
  height: 35px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  background: #f8f9fb;
  color: #667085;
}

.detail-icon svg {
  width: 18px;
  height: 18px;
}

.detail-item > div:last-child {
  min-width: 0;
}

.detail-item span {
  display: block;
  margin-bottom: 3px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 650;
}

.detail-item strong {
  display: block;
  overflow: hidden;
  color: #344054;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  margin-top: 26px;
}

.primary-button,
.secondary-button,
.danger-button {
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 720;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease,
    border-color 160ms ease;
}

.primary-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: #15171a;
  color: #fff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.08),
    0 5px 12px rgba(0, 0, 0, 0.1);
}

.primary-button:hover {
  transform: translateY(-1px);
  background: #26282c;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 8px 18px rgba(0, 0, 0, 0.12);
}

.primary-button svg {
  width: 17px;
  height: 17px;
}

.cancel-link {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border: 0;
  background: transparent;
  color: #98a2b3;
  font-family: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: color 160ms ease;
}

.cancel-link:hover {
  color: #d92d20;
}

.disabled-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 25px;
  padding: 14px;
  border-radius: 14px;
  background: #f8f9fb;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.disabled-message svg {
  width: 17px;
  height: 17px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: -4px 0 26px -7px;
  padding: 7px;
  border: 0;
  background: transparent;
  color: #667085;
  font-family: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: color 150ms ease;
}

.back-button:hover {
  color: #101828;
}

.back-button svg {
  width: 17px;
  height: 17px;
}

.flow-header {
  text-align: center;
}

.flow-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin: 0 auto 17px;
  border-radius: 15px;
}

.flow-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.flow-icon.red {
  background: #fff1f2;
  color: #dc2626;
}

.flow-icon svg {
  width: 23px;
  height: 23px;
}

.flow-header .section-label {
  margin-bottom: 7px;
}

.flow-header p {
  max-width: 420px;
  margin: 8px auto 0;
}

.danger-label {
  color: #e05252;
}

.current-booking-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 27px;
  padding: 13px 15px;
  border: 1px solid #eaecf0;
  border-radius: 13px;
  background: #f9fafb;
}

.current-booking-mini span {
  color: #98a2b3;
  font-size: 11px;
  font-weight: 650;
}

.current-booking-mini strong {
  color: #475467;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.field-group {
  margin-top: 25px;
}

.field-group label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: #344054;
  font-size: 12px;
  font-weight: 700;
}

.field-group label span {
  color: #98a2b3;
  font-size: 10px;
  font-weight: 550;
}

.date-input-wrapper {
  position: relative;
}

.date-input-wrapper > svg {
  position: absolute;
  top: 50%;
  left: 15px;
  width: 18px;
  height: 18px;
  color: #667085;
  pointer-events: none;
  transform: translateY(-50%);
}

.date-input-wrapper input,
.field-group textarea {
  width: 100%;
  border: 1px solid #dfe3e9;
  border-radius: 13px;
  outline: none;
  background: #fff;
  color: #344054;
  font-family: inherit;
  font-size: 13px;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.date-input-wrapper input {
  height: 48px;
  padding: 0 15px 0 45px;
}

.field-group textarea {
  min-height: 108px;
  padding: 13px 14px;
  line-height: 1.55;
  resize: vertical;
}

.date-input-wrapper input:focus,
.field-group textarea:focus {
  border-color: #98a2b3;
  box-shadow: 0 0 0 4px rgba(152, 162, 179, 0.11);
}

.field-group textarea::placeholder {
  color: #b4bbc6;
}

.employee-options {
  display: grid;
  gap: 8px;
}

.employee-option {
  width: 100%;
  min-height: 62px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 13px;
  border: 1px solid #e1e5eb;
  border-radius: 14px;
  background: #fff;
  color: #344054;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background 150ms ease;
}

.employee-option:hover {
  border-color: #c7ced8;
  background: #fbfcfd;
}

.employee-option.active {
  border-color: #2563eb;
  background: #f8fbff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.employee-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 11px;
  background: #f2f4f7;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
}

.employee-avatar.any {
  background: #eff6ff;
  color: #2563eb;
}

.employee-option-copy {
  min-width: 0;
  flex: 1;
}

.employee-option-copy strong,
.employee-option-copy small {
  display: block;
}

.employee-option-copy strong {
  color: #344054;
  font-size: 13px;
  font-weight: 720;
}

.employee-option-copy small {
  margin-top: 3px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 550;
}

.employee-radio {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  border: 1.5px solid #cfd5dd;
  border-radius: 50%;
  background: #fff;
  box-shadow: inset 0 0 0 4px #fff;
}

.employee-option.active .employee-radio {
  border-color: #2563eb;
  background: #2563eb;
}

.slots-section {
  margin-top: 28px;
}

.slots-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.slots-heading .section-label {
  margin-bottom: 4px;
}

.slots-heading h3 {
  margin: 0;
  color: #344054;
  font-size: 15px;
  font-weight: 750;
}

.slots-count {
  padding: 5px 8px;
  border-radius: 999px;
  background: #f2f4f7;
  color: #667085;
  font-size: 10px;
  font-weight: 700;
}

.slots-grid,
.slots-loading {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.slot-button {
  height: 44px;
  border: 1px solid #e1e5eb;
  border-radius: 11px;
  background: #fff;
  color: #344054;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    background 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.slot-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #15171a;
  background: #15171a;
  color: #fff;
}

.slot-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.slot-skeleton {
  height: 44px;
  border-radius: 11px;
  background: linear-gradient(90deg, #f2f4f7 25%, #f8f9fb 37%, #f2f4f7 63%);
  background-size: 400% 100%;
  animation: shimmer 1.3s ease infinite;
}

.empty-slots {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 25px;
  padding: 28px 20px;
  border: 1px dashed #dfe3e9;
  border-radius: 16px;
  background: #fafbfc;
  text-align: center;
}

.empty-slots-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  border-radius: 50%;
  background: #f2f4f7;
  color: #98a2b3;
}

.empty-slots-icon svg {
  width: 19px;
  height: 19px;
}

.empty-slots strong {
  color: #475467;
  font-size: 13px;
}

.empty-slots span {
  margin-top: 4px;
  color: #98a2b3;
  font-size: 11px;
}

.inline-error {
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid #fecdca;
  border-radius: 12px;
  background: #fef3f2;
  color: #b42318;
  font-size: 12px;
  font-weight: 600;
}

.processing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 20px;
  color: #667085;
  font-size: 12px;
  font-weight: 650;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid #d0d5dd;
  border-top-color: #475467;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner.white {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: white;
}

.cancel-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 28px;
  padding: 17px;
  border: 1px solid #eaecf0;
  border-radius: 15px;
  background: #f9fafb;
}

.cancel-summary > div:first-child {
  min-width: 0;
}

.cancel-summary span {
  display: block;
  margin-bottom: 4px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 650;
}

.cancel-summary strong {
  display: block;
  overflow: hidden;
  color: #475467;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cancel-summary-time {
  flex: 0 0 auto;
  color: #101828;
  font-size: 21px;
  font-weight: 780;
  letter-spacing: -0.04em;
}

.cancel-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 24px;
}

.secondary-button {
  border: 1px solid #dfe3e9;
  background: #fff;
  color: #475467;
}

.secondary-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #cfd5dd;
}

.danger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #d92d20;
  color: white;
  box-shadow: 0 2px 5px rgba(217, 45, 32, 0.18);
}

.danger-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #b42318;
}

.secondary-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.powered-by {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  color: #98a2b3;
  font-size: 11px;
}

.powered-logo {
  width: 21px;
  height: 21px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #e8ebf0;
  color: #667085;
  font-size: 10px;
  font-weight: 800;
}

.powered-by strong {
  color: #667085;
  font-weight: 750;
}

.privacy-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 9px 0 0;
  color: #b0b7c3;
  font-size: 10px;
}

.privacy-note svg {
  width: 12px;
  height: 12px;
}

.error-state {
  padding: 58px 38px;
  text-align: center;
}

.error-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: #fef3f2;
  color: #d92d20;
}

.error-icon svg {
  width: 25px;
  height: 25px;
}

.error-state .eyebrow {
  color: #98a2b3;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.error-state h1 {
  margin: 8px 0 0;
  color: #101828;
  font-size: 23px;
  letter-spacing: -0.035em;
}

.error-state p {
  max-width: 400px;
  margin: 10px auto 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.6;
}

.error-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 23px;
  padding: 0 20px;
  text-decoration: none;
}

.loading-card {
  min-height: 490px;
}

.skeleton {
  background: linear-gradient(90deg, #f0f2f5 25%, #f8f9fb 37%, #f0f2f5 63%);
  background-size: 400% 100%;
  animation: shimmer 1.3s ease infinite;
}

.skeleton-circle {
  float: left;
  width: 52px;
  height: 52px;
  margin-right: 17px;
  border-radius: 50%;
}

.skeleton-content {
  padding-top: 2px;
}

.skeleton-small {
  width: 72px;
  height: 16px;
  margin-bottom: 8px;
  border-radius: 999px;
}

.skeleton-title {
  width: 235px;
  max-width: 70%;
  height: 25px;
  border-radius: 7px;
}

.skeleton-subtitle {
  width: 150px;
  height: 13px;
  margin-top: 9px;
  border-radius: 5px;
}

.skeleton-panel {
  clear: both;
  margin-top: 45px;
  padding: 20px;
  border: 1px solid #eaecf0;
  border-radius: 18px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 10px 0;
}

.skeleton-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
}

.skeleton-label {
  width: 50px;
  height: 8px;
  border-radius: 4px;
}

.skeleton-value {
  width: 130px;
  height: 12px;
  margin-top: 6px;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .topbar {
    height: 64px;
  }

  .topbar-inner {
    width: calc(100% - 30px);
  }

  .secure-label {
    padding: 7px;
    border: 0;
    background: transparent;
  }

  .secure-label {
    font-size: 0;
  }

  .secure-label svg {
    width: 17px;
    height: 17px;
  }

  .page-content {
    width: calc(100% - 22px);
    padding: 24px 0 30px;
  }

  .booking-card {
    padding: 25px 20px;
    border-radius: 22px;
  }

  .status-icon {
    width: 46px;
    height: 46px;
  }

  .status-copy h1,
  .flow-header h1 {
    font-size: 21px;
  }

  .service-heading {
    margin-top: 30px;
  }

  .service-heading h2 {
    font-size: 21px;
  }

  .appointment-main {
    grid-template-columns: 1fr;
    gap: 17px;
    padding: 17px;
  }

  .time-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 0 0;
    border-top: 1px solid #eaecf0;
    border-left: 0;
  }

  .time-block .detail-label {
    margin: 0;
  }

  .big-time {
    font-size: 25px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .detail-item {
    padding: 15px;
  }

  .slots-grid,
  .slots-loading {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .cancel-actions {
    grid-template-columns: 1fr;
  }

  .danger-button {
    grid-row: 1;
  }

  .current-booking-mini {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }

  .current-booking-mini strong {
    text-align: left;
  }

  .cancel-summary {
    padding: 15px;
  }

  .email-detail strong {
    max-width: 210px;
  }
}

@media (max-width: 390px) {
  .booking-card {
    padding: 22px 17px;
  }

  .status-hero {
    gap: 13px;
  }

  .status-icon {
    width: 43px;
    height: 43px;
  }

  .slots-grid,
  .slots-loading {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
