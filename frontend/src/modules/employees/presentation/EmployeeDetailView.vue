<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { apiFetch } from "../../../infrastructure/http/apiClient.js";
import { BusinessHoursService } from "../../businesses/infrastructure/BusinessHoursService.js";
import { EmployeeService } from "../infrastructure/EmployeeService.js";
import { BookingService } from "../../bookings/infrastructure/BookingService.js";

const route = useRoute();
const router = useRouter();
const employeeService = new EmployeeService();
const businessHoursService = new BusinessHoursService();
const bookingService = new BookingService();

const businessId = computed(() => route.params.id);
const employeeId = computed(() => route.params.employeeId);

const employee = ref(null);
const businessServices = ref([]);
const businessHours = ref([]);
const selectedServiceIds = ref([]);
const hours = ref([]);
const timeOff = ref([]);
const bookings = ref([]);
const bookingFilter = ref("upcoming");

const loading = ref(true);
const error = ref("");
const savingProfile = ref(false);
const savingServices = ref(false);
const savingHours = ref(false);
const creatingTimeOff = ref(false);
const deactivating = ref(false);

const profileMessage = ref("");
const servicesMessage = ref("");
const hoursMessage = ref("");
const timeOffError = ref("");
const bookingsError = ref("");

const profile = ref({ name: "", email: "", phone: "", active: true });

const timeOffForm = ref({
  startsAt: "",
  endsAt: "",
  type: "vacation",
  notes: "",
});

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const getBusinessDay = (weekday) => businessHours.value.find((day) => day.day_of_week === weekday) || null;

const isBusinessClosed = (weekday) => {
  const day = getBusinessDay(weekday);
  return !day || Boolean(day.is_closed);
};

const businessPeriods = (weekday) => {
  const day = getBusinessDay(weekday);
  if (!day || day.is_closed) return [];

  const periods = [];

  if (day.open_time && day.close_time) {
    periods.push({
      start: normalizeTime(day.open_time),
      end: normalizeTime(day.close_time),
    });
  }

  if (day.second_open_time && day.second_close_time) {
    periods.push({
      start: normalizeTime(day.second_open_time),
      end: normalizeTime(day.second_close_time),
    });
  }

  return periods;
};

const businessHoursLabel = (weekday) => {
  const periods = businessPeriods(weekday);
  if (!periods.length) return "Negocio cerrado";

  return periods.map((period) => `${period.start}–${period.end}`).join(" · ");
};

const isEmployeePeriodInsideBusinessHours = (weekday, start, end) => {
  if (!start || !end) return false;

  return businessPeriods(weekday).some((period) => start >= period.start && end <= period.end);
};

const timeOffLabels = {
  vacation: "Vacaciones",
  sick: "Baja",
  personal: "Personal",
  other: "Otro",
};

const normalizeTime = (value) => (value ? String(value).slice(0, 5) : null);

const emptyHours = () =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isClosed: true,
    startTime: null,
    endTime: null,
    secondStartTime: null,
    secondEndTime: null,
  }));

const initializeHours = (items) => {
  const map = new Map(items.map((item) => [item.weekday, item]));

  hours.value = emptyHours().map((fallback) => {
    const item = map.get(fallback.weekday);
    if (!item) return fallback;

    return {
      weekday: item.weekday,
      isClosed: item.is_closed,
      startTime: normalizeTime(item.start_time),
      endTime: normalizeTime(item.end_time),
      secondStartTime: normalizeTime(item.second_start_time),
      secondEndTime: normalizeTime(item.second_end_time),
    };
  });
};

const load = async () => {
  loading.value = true;
  error.value = "";

  try {
    const [employeeData, assignedServices, employeeHours, absences, allServices, allBusinessHours, allBookings] =
      await Promise.all([
        employeeService.getById(employeeId.value),
        employeeService.getServices(employeeId.value),
        employeeService.getHours(employeeId.value),
        employeeService.getTimeOff(employeeId.value),
        apiFetch(`/businesses/${businessId.value}/services`),
        businessHoursService.getByBusinessId(businessId.value),
        bookingService.getByBusinessId(businessId.value),
      ]);

    employee.value = employeeData;
    profile.value = {
      name: employeeData.name || "",
      email: employeeData.email || "",
      phone: employeeData.phone || "",
      active: Boolean(employeeData.active),
    };

    businessServices.value = allServices;
    businessHours.value = allBusinessHours;
    selectedServiceIds.value = assignedServices.map((service) => service.id);
    timeOff.value = absences;
    bookings.value = (Array.isArray(allBookings) ? allBookings : []).filter(
      (booking) => booking.employee_id === employeeId.value,
    );
    initializeHours(employeeHours);
  } catch (err) {
    error.value = err.message || "No se ha podido cargar el empleado.";
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  profileMessage.value = "";
  const name = profile.value.name.trim();

  if (!name) {
    profileMessage.value = "El nombre es obligatorio.";
    return;
  }

  savingProfile.value = true;

  try {
    employee.value = await employeeService.update(employeeId.value, {
      name,
      email: profile.value.email.trim() || null,
      phone: profile.value.phone.trim() || null,
      active: profile.value.active,
    });

    profileMessage.value = "Datos guardados correctamente.";
  } catch (err) {
    profileMessage.value = err.message || "No se han podido guardar los datos.";
  } finally {
    savingProfile.value = false;
  }
};

const toggleService = (serviceId) => {
  selectedServiceIds.value = selectedServiceIds.value.includes(serviceId)
    ? selectedServiceIds.value.filter((id) => id !== serviceId)
    : [...selectedServiceIds.value, serviceId];

  servicesMessage.value = "";
};

const saveServices = async () => {
  servicesMessage.value = "";
  savingServices.value = true;

  try {
    await employeeService.updateServices(employeeId.value, selectedServiceIds.value);
    servicesMessage.value = "Servicios guardados correctamente.";
  } catch (err) {
    servicesMessage.value = err.message || "No se han podido guardar los servicios.";
  } finally {
    savingServices.value = false;
  }
};

const toggleDay = (day) => {
  if (isBusinessClosed(day.weekday)) {
    day.isClosed = true;
    day.startTime = null;
    day.endTime = null;
    day.secondStartTime = null;
    day.secondEndTime = null;
    hoursMessage.value = `${dayNames[day.weekday]} está cerrado en el horario general del negocio.`;
    return;
  }

  if (day.isClosed) {
    day.startTime = null;
    day.endTime = null;
    day.secondStartTime = null;
    day.secondEndTime = null;
  } else {
    const periods = businessPeriods(day.weekday);
    day.startTime = periods[0]?.start || null;
    day.endTime = periods[0]?.end || null;
    day.secondStartTime = periods[1]?.start || null;
    day.secondEndTime = periods[1]?.end || null;
  }

  hoursMessage.value = "";
};

const hasSecondPeriod = (day) => Boolean(day.secondStartTime || day.secondEndTime);

const toggleSecondPeriod = (day) => {
  if (hasSecondPeriod(day)) {
    day.secondStartTime = null;
    day.secondEndTime = null;
  } else {
    day.secondStartTime = "16:00";
    day.secondEndTime = "20:00";
  }
  hoursMessage.value = "";
};

const validateHours = () => {
  for (const day of hours.value) {
    /*
     * Si el negocio está cerrado ese día, el empleado
     * también está forzosamente cerrado.
     *
     * No debemos validar el horario antiguo que pudiera
     * tener guardado el empleado.
     */
    if (isBusinessClosed(day.weekday)) {
      continue;
    }

    /*
     * Negocio abierto, pero el empleado no trabaja.
     */
    if (day.isClosed) {
      continue;
    }

    if (!day.startTime || !day.endTime) {
      return `Completa el horario de ${dayNames[day.weekday]}.`;
    }

    if (day.startTime >= day.endTime) {
      return `El horario de ${dayNames[day.weekday]} no es válido.`;
    }

    const secondStart = Boolean(day.secondStartTime);
    const secondEnd = Boolean(day.secondEndTime);

    if (secondStart !== secondEnd) {
      return `Completa el segundo turno de ${dayNames[day.weekday]}.`;
    }

    if (secondStart && day.secondStartTime >= day.secondEndTime) {
      return `El segundo turno de ${dayNames[day.weekday]} no es válido.`;
    }

    if (secondStart && day.secondStartTime < day.endTime) {
      return `El segundo turno de ${dayNames[day.weekday]} debe empezar después del primero.`;
    }

    if (!isEmployeePeriodInsideBusinessHours(day.weekday, day.startTime, day.endTime)) {
      return `El primer turno de ${dayNames[day.weekday]} debe estar dentro del horario del negocio (${businessHoursLabel(day.weekday)}).`;
    }

    if (
      secondStart &&
      !isEmployeePeriodInsideBusinessHours(day.weekday, day.secondStartTime, day.secondEndTime)
    ) {
      return `El segundo turno de ${dayNames[day.weekday]} debe estar dentro del horario del negocio (${businessHoursLabel(day.weekday)}).`;
    }
  }

  return "";
};
const saveHours = async () => {
  hoursMessage.value = "";
  const validationError = validateHours();

  if (validationError) {
    hoursMessage.value = validationError;
    return;
  }

  savingHours.value = true;

  try {
    const updated = await employeeService.updateHours(
      employeeId.value,
      hours.value.map((day) => {
        const closed = day.isClosed || isBusinessClosed(day.weekday);

        return {
          weekday: day.weekday,
          isClosed: closed,
          startTime: closed ? null : day.startTime,
          endTime: closed ? null : day.endTime,
          secondStartTime: closed ? null : day.secondStartTime,
          secondEndTime: closed ? null : day.secondEndTime,
        };
      }),
    );

    initializeHours(updated);
    hoursMessage.value = "Horario guardado correctamente.";
  } catch (err) {
    hoursMessage.value = err.message || "No se ha podido guardar el horario.";
  } finally {
    savingHours.value = false;
  }
};

const toIso = (localValue) => {
  if (!localValue) return null;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const createTimeOff = async () => {
  timeOffError.value = "";

  const startsAt = toIso(timeOffForm.value.startsAt);
  const endsAt = toIso(timeOffForm.value.endsAt);

  if (!startsAt || !endsAt) {
    timeOffError.value = "Selecciona el inicio y el final de la ausencia.";
    return;
  }

  if (new Date(startsAt) >= new Date(endsAt)) {
    timeOffError.value = "El final debe ser posterior al inicio.";
    return;
  }

  creatingTimeOff.value = true;

  try {
    const created = await employeeService.createTimeOff(employeeId.value, {
      startsAt,
      endsAt,
      type: timeOffForm.value.type,
      notes: timeOffForm.value.notes.trim() || null,
    });

    timeOff.value = [...timeOff.value, created].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

    timeOffForm.value = {
      startsAt: "",
      endsAt: "",
      type: "vacation",
      notes: "",
    };
  } catch (err) {
    timeOffError.value = err.message || "No se ha podido crear la ausencia.";
  } finally {
    creatingTimeOff.value = false;
  }
};

const deleteTimeOff = async (item) => {
  if (!window.confirm("¿Eliminar esta ausencia?")) return;

  try {
    await employeeService.deleteTimeOff(employeeId.value, item.id);
    timeOff.value = timeOff.value.filter((entry) => entry.id !== item.id);
  } catch (err) {
    timeOffError.value = err.message || "No se ha podido eliminar la ausencia.";
  }
};

const deactivate = async () => {
  if (!window.confirm("¿Desactivar este empleado? Dejará de recibir nuevas reservas.")) return;

  deactivating.value = true;

  try {
    employee.value = await employeeService.deactivate(employeeId.value);
    profile.value.active = false;
    profileMessage.value = "Empleado desactivado.";
  } catch (err) {
    profileMessage.value = err.message || "No se ha podido desactivar el empleado.";
  } finally {
    deactivating.value = false;
  }
};

const reactivate = async () => {
  profile.value.active = true;
  await saveProfile();
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};


const employeeBookings = computed(() =>
  [...bookings.value].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
);

const upcomingBookings = computed(() =>
  employeeBookings.value.filter(
    (booking) =>
      new Date(booking.ends_at || booking.starts_at).getTime() >= Date.now() &&
      !["cancelled", "completed", "no_show"].includes(booking.status),
  ),
);

const pastBookings = computed(() =>
  employeeBookings.value
    .filter(
      (booking) =>
        new Date(booking.ends_at || booking.starts_at).getTime() < Date.now() ||
        ["cancelled", "completed", "no_show"].includes(booking.status),
    )
    .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at)),
);

const visibleBookings = computed(() =>
  bookingFilter.value === "history" ? pastBookings.value : upcomingBookings.value,
);

const bookingStatusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No presentado",
};

const formatBookingPrice = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value} €`;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(numeric);
};

const openBookingConversation = (booking) => {
  if (!booking.conversation_id) return;
  router.push(`/businesses/${businessId.value}/conversations/${booking.conversation_id}`);
};

onMounted(load);
</script>

<template>
  <div class="employee-detail-page">
    <div class="page-container">
      <div class="breadcrumb">
        <RouterLink :to="`/businesses/${businessId}`">Negocio</RouterLink>
        <span>/</span>
        <RouterLink :to="`/businesses/${businessId}/employees`">Equipo</RouterLink>
        <span>/</span>
        <strong>{{ employee?.name || "Empleado" }}</strong>
      </div>

      <section v-if="loading" class="page-state">
        <div class="spinner"></div>
        <p>Cargando empleado...</p>
      </section>

      <section v-else-if="error" class="page-state">
        <div class="state-icon error">!</div>
        <h2>No hemos podido cargar el empleado</h2>
        <p>{{ error }}</p>
        <button type="button" class="secondary-button" @click="load">Reintentar</button>
      </section>

      <template v-else>
        <header class="page-header">
          <div class="identity">
            <div class="avatar">{{ employee.name?.charAt(0)?.toUpperCase() || "E" }}</div>
            <div>
              <div class="heading-meta">
                <span class="status-dot" :class="{ inactive: !profile.active }"></span>
                <span>{{ profile.active ? "Empleado activo" : "Empleado inactivo" }}</span>
              </div>
              <h1>{{ employee.name }}</h1>
              <p>Configura sus datos, servicios, disponibilidad y ausencias.</p>
            </div>
          </div>

          <RouterLink :to="`/businesses/${businessId}/employees`" class="secondary-button">
            ← Volver al equipo
          </RouterLink>
        </header>

        <section class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Perfil</span>
              <h2>Datos del empleado</h2>
              <p>Información interna y estado de disponibilidad para nuevas reservas.</p>
            </div>
          </div>

          <div class="panel profile-panel">
            <div class="profile-grid">
              <div class="field">
                <label>Nombre *</label>
                <input v-model="profile.name" maxlength="100" />
              </div>
              <div class="field">
                <label>Email</label>
                <input v-model="profile.email" type="email" />
              </div>
              <div class="field">
                <label>Teléfono</label>
                <input v-model="profile.phone" maxlength="30" />
              </div>
              <div class="status-field">
                <span>Estado</span>
                <label class="switch">
                  <input v-model="profile.active" type="checkbox" />
                  <span class="switch-slider"></span>
                </label>
                <strong>{{ profile.active ? "Activo" : "Inactivo" }}</strong>
              </div>
            </div>

            <div class="panel-footer">
              <p class="message">{{ profileMessage }}</p>
              <button type="button" class="primary-button" :disabled="savingProfile" @click="saveProfile">
                {{ savingProfile ? "Guardando..." : "Guardar datos" }}
              </button>
            </div>
          </div>
        </section>

        <section class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Especialización</span>
              <h2>Servicios que realiza</h2>
              <p>Solo aparecerá disponible para los servicios seleccionados.</p>
            </div>
            <span class="section-badge">{{ selectedServiceIds.length }} seleccionados</span>
          </div>

          <div class="panel">
            <div v-if="businessServices.length" class="services-grid">
              <button
                v-for="service in businessServices"
                :key="service.id"
                type="button"
                class="service-option"
                :class="{ selected: selectedServiceIds.includes(service.id) }"
                @click="toggleService(service.id)">
                <span class="checkbox">{{ selectedServiceIds.includes(service.id) ? "✓" : "" }}</span>
                <span>
                  <strong>{{ service.name }}</strong>
                  <small>{{ service.duration_minutes }} min · {{ service.price ?? 0 }} €</small>
                </span>
              </button>
            </div>

            <div v-else class="inline-empty">Este negocio todavía no tiene servicios configurados.</div>

            <div class="panel-footer">
              <p class="message">{{ servicesMessage }}</p>
              <button type="button" class="primary-button" :disabled="savingServices" @click="saveServices">
                {{ savingServices ? "Guardando..." : "Guardar servicios" }}
              </button>
            </div>
          </div>
        </section>

        <section class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Disponibilidad</span>
              <h2>Horario semanal</h2>
              <p>El horario del empleado se cruza con el horario general del negocio.</p>
            </div>
          </div>

          <div class="panel hours-panel">
            <div class="hours-header">
              <span>Día</span>
              <span>Estado</span>
              <span>Horario</span>
              <span>Segundo turno</span>
            </div>

            <div class="hours-list">
              <div
                v-for="day in hours"
                :key="day.weekday"
                class="hours-row"
                :class="{ closed: day.isClosed || isBusinessClosed(day.weekday) }">
                <div class="day-name">
                  <strong>{{ dayNames[day.weekday] }}</strong>
                  <small>{{ businessHoursLabel(day.weekday) }}</small>
                </div>

                <div v-if="isBusinessClosed(day.weekday)" class="business-closed-badge">Negocio cerrado</div>

                <div v-else class="day-toggle">
                  <label class="switch">
                    <input
                      v-model="day.isClosed"
                      type="checkbox"
                      :true-value="false"
                      :false-value="true"
                      @change="toggleDay(day)" />
                    <span class="switch-slider"></span>
                  </label>
                  <span :class="{ closed: day.isClosed }">
                    {{ day.isClosed ? "No trabaja" : "Disponible" }}
                  </span>
                </div>

                <div v-if="!isBusinessClosed(day.weekday) && !day.isClosed" class="day-hours">
                  <div class="time-group">
                    <input
                      v-model="day.startTime"
                      type="time"
                      :min="businessPeriods(day.weekday)[0]?.start"
                      :max="businessPeriods(day.weekday).at(-1)?.end" />
                    <span>—</span>
                    <input
                      v-model="day.endTime"
                      type="time"
                      :min="businessPeriods(day.weekday)[0]?.start"
                      :max="businessPeriods(day.weekday).at(-1)?.end" />
                  </div>

                  <div v-if="hasSecondPeriod(day)" class="time-group second">
                    <input
                      v-model="day.secondStartTime"
                      type="time"
                      :min="businessPeriods(day.weekday)[0]?.start"
                      :max="businessPeriods(day.weekday).at(-1)?.end" />
                    <span>—</span>
                    <input
                      v-model="day.secondEndTime"
                      type="time"
                      :min="businessPeriods(day.weekday)[0]?.start"
                      :max="businessPeriods(day.weekday).at(-1)?.end" />
                  </div>
                </div>

                <span v-else class="closed-label">
                  {{ isBusinessClosed(day.weekday) ? "No configurable" : "Sin disponibilidad" }}
                </span>

                <button
                  type="button"
                  class="period-button"
                  :disabled="day.isClosed || isBusinessClosed(day.weekday)"
                  @click="toggleSecondPeriod(day)">
                  {{ hasSecondPeriod(day) ? "Quitar turno" : "+ Segundo turno" }}
                </button>
              </div>
            </div>

            <div class="panel-footer">
              <p class="message">{{ hoursMessage }}</p>
              <button type="button" class="primary-button" :disabled="savingHours" @click="saveHours">
                {{ savingHours ? "Guardando..." : "Guardar horario" }}
              </button>
            </div>
          </div>
        </section>


        <section class="content-section">
          <div class="section-heading bookings-section-heading">
            <div>
              <span class="eyebrow">Agenda</span>
              <h2>Reservas del empleado</h2>
              <p>Consulta las próximas citas de {{ employee.name }} y su historial de reservas.</p>
            </div>
            <span class="section-badge">{{ bookings.length }} {{ bookings.length === 1 ? "reserva" : "reservas" }}</span>
          </div>

          <div class="panel employee-bookings-panel">
            <div class="booking-tabs">
              <button
                type="button"
                :class="{ active: bookingFilter === 'upcoming' }"
                @click="bookingFilter = 'upcoming'">
                Próximas
                <span>{{ upcomingBookings.length }}</span>
              </button>
              <button
                type="button"
                :class="{ active: bookingFilter === 'history' }"
                @click="bookingFilter = 'history'">
                Historial
                <span>{{ pastBookings.length }}</span>
              </button>
            </div>

            <p v-if="bookingsError" class="bookings-error">{{ bookingsError }}</p>

            <div v-if="!visibleBookings.length" class="booking-empty">
              <div class="booking-empty-icon">◷</div>
              <strong>{{ bookingFilter === "upcoming" ? "No tiene próximas reservas" : "No hay reservas en el historial" }}</strong>
              <p>Las citas asignadas a este empleado aparecerán aquí automáticamente.</p>
            </div>

            <div v-else class="employee-bookings-list">
              <article v-for="booking in visibleBookings" :key="booking.id" class="employee-booking-item">
                <div class="booking-date-block">
                  <strong>{{ formatDateTime(booking.starts_at) }}</strong>
                  <span v-if="booking.duration_minutes">{{ booking.duration_minutes }} min</span>
                </div>

                <div class="booking-main-info">
                  <div class="booking-service-line">
                    <strong>{{ booking.service_name || "Servicio" }}</strong>
                    <span class="booking-status" :class="`status-${booking.status}`">
                      {{ bookingStatusLabels[booking.status] || booking.status }}
                    </span>
                  </div>
                  <span class="booking-customer">{{ booking.customer_name || "Cliente sin nombre" }}</span>
                  <div class="booking-contact">
                    <a v-if="booking.customer_phone" :href="`tel:${booking.customer_phone}`">{{ booking.customer_phone }}</a>
                    <a v-if="booking.customer_email" :href="`mailto:${booking.customer_email}`">{{ booking.customer_email }}</a>
                    <span v-if="!booking.customer_phone && !booking.customer_email">Sin datos de contacto</span>
                  </div>
                </div>

                <div class="booking-side-info">
                  <strong>{{ formatBookingPrice(booking.price) }}</strong>
                  <button
                    v-if="booking.conversation_id"
                    type="button"
                    class="conversation-link"
                    @click="openBookingConversation(booking)">
                    Ver conversación →
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Calendario</span>
              <h2>Vacaciones y ausencias</h2>
              <p>Estos periodos bloquean automáticamente la disponibilidad del empleado.</p>
            </div>
          </div>

          <div class="timeoff-layout">
            <form class="panel timeoff-form" @submit.prevent="createTimeOff">
              <h3>Nueva ausencia</h3>

              <div class="field">
                <label>Inicio</label>
                <input v-model="timeOffForm.startsAt" type="datetime-local" />
              </div>

              <div class="field">
                <label>Final</label>
                <input v-model="timeOffForm.endsAt" type="datetime-local" />
              </div>

              <div class="field">
                <label>Tipo</label>
                <select v-model="timeOffForm.type">
                  <option value="vacation">Vacaciones</option>
                  <option value="sick">Baja</option>
                  <option value="personal">Personal</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div class="field">
                <label>Notas</label>
                <textarea
                  v-model="timeOffForm.notes"
                  maxlength="500"
                  rows="3"
                  placeholder="Opcional"></textarea>
              </div>

              <p v-if="timeOffError" class="error-message">{{ timeOffError }}</p>

              <button type="submit" class="primary-button full" :disabled="creatingTimeOff">
                {{ creatingTimeOff ? "Añadiendo..." : "+ Añadir ausencia" }}
              </button>
            </form>

            <div class="panel timeoff-list">
              <div class="timeoff-list-header">
                <div>
                  <h3>Ausencias configuradas</h3>
                  <p>{{ timeOff.length }} {{ timeOff.length === 1 ? "periodo" : "periodos" }}</p>
                </div>
              </div>

              <div v-if="!timeOff.length" class="inline-empty">
                No hay vacaciones ni ausencias configuradas.
              </div>

              <article v-for="item in timeOff" :key="item.id" class="timeoff-item">
                <div class="timeoff-icon">◷</div>
                <div class="timeoff-content">
                  <strong>{{ timeOffLabels[item.type] || "Ausencia" }}</strong>
                  <span>{{ formatDateTime(item.starts_at) }} → {{ formatDateTime(item.ends_at) }}</span>
                  <small v-if="item.notes">{{ item.notes }}</small>
                </div>
                <button type="button" class="danger-link" @click="deleteTimeOff(item)">Eliminar</button>
              </article>
            </div>
          </div>
        </section>

        <section class="danger-zone">
          <div>
            <h2>{{ profile.active ? "Desactivar empleado" : "Empleado desactivado" }}</h2>
            <p>
              {{
                profile.active
                  ? "No recibirá nuevas reservas, pero se conservarán sus datos e historial."
                  : "Puedes volver a activarlo cuando quieras."
              }}
            </p>
          </div>

          <button
            v-if="profile.active"
            type="button"
            class="danger-button"
            :disabled="deactivating"
            @click="deactivate">
            {{ deactivating ? "Desactivando..." : "Desactivar empleado" }}
          </button>

          <button v-else type="button" class="secondary-button" :disabled="savingProfile" @click="reactivate">
            Reactivar empleado
          </button>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.employee-detail-page {
  min-height: 100vh;
  padding: 38px 48px 80px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.breadcrumb a {
  color: var(--text-secondary);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--primary);
}

.breadcrumb strong {
  color: var(--text-secondary);
  font-weight: 600;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 38px;
}

.identity {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #0f172a;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.heading-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
}

.status-dot.inactive {
  background: #98a2b3;
}

.page-header h1 {
  margin: 0;
  color: var(--text);
  font-size: 30px;
  letter-spacing: -0.035em;
}

.page-header p {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.content-section {
  margin-bottom: 38px;
  scroll-margin-top: 20px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.section-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 21px;
}

.section-heading p {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.55;
}

.section-badge {
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.profile-panel {
  padding-top: 17px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 180px;
  gap: 13px;
  padding: 0 17px 17px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label,
.status-field > span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  outline: none;
}

.field input,
.field select {
  min-height: 40px;
  padding: 0 10px;
}

.field textarea {
  padding: 10px;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.status-field {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-top: 24px;
}

.status-field > span {
  display: none;
}

.status-field strong {
  color: var(--text-secondary);
  font-size: 13px;
}

.switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex: 0 0 36px;
  cursor: pointer;
}

.switch input {
  position: absolute;
  opacity: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #d0d5dd;
  transition: 0.2s ease;
}

.switch-slider::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: 0.2s ease;
}

.switch input:checked + .switch-slider {
  background: var(--primary);
}

.switch input:checked + .switch-slider::after {
  transform: translateX(16px);
}

.panel-footer {
  min-height: 63px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 17px;
  border-top: 1px solid var(--border);
  background: #fcfcfd;
}

.message {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 17px;
}

.service-option {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.service-option:hover {
  background: #fcfcfd;
}

.service-option.selected {
  border-color: #93c5fd;
  background: var(--primary-soft);
}

.checkbox {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
}

.service-option.selected .checkbox {
  border-color: #93c5fd;
}

.service-option strong,
.service-option small {
  display: block;
}

.service-option strong {
  color: var(--text);
  font-size: 14px;
}

.service-option small {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.hours-header,
.hours-row {
  display: grid;
  grid-template-columns: 130px 145px minmax(300px, 1fr) 130px;
  gap: 15px;
}

.hours-header {
  padding: 10px 17px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hours-row {
  min-height: 72px;
  align-items: center;
  padding: 11px 17px;
  border-bottom: 1px solid var(--border);
}

.hours-row:last-child {
  border-bottom: 0;
}

.hours-row.closed {
  background: #fcfcfd;
}

.hours-row > strong,
.day-name > strong {
  color: var(--text);
  font-size: 14px;
}

.day-name {
  min-width: 0;
}

.day-name strong,
.day-name small {
  display: block;
}

.day-name small {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.35;
}

.business-closed-badge {
  width: fit-content;
  padding: 5px 8px;
  border-radius: 999px;
  background: #f2f4f7;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.day-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-toggle > span {
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
}

.day-toggle > span.closed {
  color: var(--text-muted);
}

.day-hours {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-group {
  display: flex;
  align-items: center;
  gap: 7px;
}

.time-group input {
  width: 104px;
  min-height: 38px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 13px;
}

.time-group span,
.closed-label {
  color: var(--text-muted);
  font-size: 12px;
}

.time-group.second {
  padding-top: 6px;
  border-top: 1px dashed var(--border);
}

.period-button {
  justify-self: start;
  padding: 7px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.period-button:hover:not(:disabled) {
  background: var(--primary-soft);
}

.period-button:disabled {
  color: var(--text-muted);
  cursor: default;
}

.timeoff-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
}

.timeoff-form {
  padding: 17px;
}

.timeoff-form h3,
.timeoff-list h3 {
  margin: 0;
  color: var(--text);
  font-size: 16px;
}

.timeoff-form .field {
  margin-top: 13px;
}

.full {
  width: 100%;
  margin-top: 15px;
}

.timeoff-list-header {
  padding: 17px;
  border-bottom: 1px solid var(--border);
}

.timeoff-list-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.timeoff-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 14px 17px;
  border-bottom: 1px solid var(--border);
}

.timeoff-item:last-child {
  border-bottom: 0;
}

.timeoff-icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--text-secondary);
}

.timeoff-content {
  min-width: 0;
  flex: 1;
}

.timeoff-content strong,
.timeoff-content span,
.timeoff-content small {
  display: block;
}

.timeoff-content strong {
  color: var(--text);
  font-size: 13px;
}

.timeoff-content span {
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 12px;
}

.timeoff-content small {
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 11px;
}

.danger-link {
  border: 0;
  background: transparent;
  color: var(--danger);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.inline-empty {
  padding: 28px 17px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.error-message {
  margin: 10px 0 0;
  color: var(--danger);
  font-size: 12px;
}

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  padding: 19px;
  border: 1px solid #fecaca;
  border-radius: 13px;
  background: #fff;
}

.danger-zone h2 {
  margin: 0;
  color: var(--text);
  font-size: 16px;
}

.danger-zone p {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.primary-button,
.secondary-button,
.danger-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 13px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: var(--primary);
  color: #fff;
}

.secondary-button {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-secondary);
}

.danger-button {
  border: 1px solid #fecaca;
  background: var(--danger-soft);
  color: var(--danger);
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.page-state {
  min-height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--surface);
  text-align: center;
}

.page-state h2 {
  margin: 13px 0 4px;
  color: var(--text);
  font-size: 18px;
}

.page-state p {
  margin: 0 0 15px;
  color: var(--text-secondary);
  font-size: 13px;
}

.spinner {
  width: 23px;
  height: 23px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.state-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.state-icon.error {
  background: var(--danger-soft);
  color: var(--danger);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


.bookings-section-heading {
  align-items: center;
}

.employee-bookings-panel {
  overflow: hidden;
}

.booking-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: #fcfcfd;
}

.booking-tabs button {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.booking-tabs button:hover {
  background: var(--surface-soft);
}

.booking-tabs button.active {
  border-color: var(--border);
  background: #fff;
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.booking-tabs button span {
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 10px;
}

.employee-bookings-list {
  display: flex;
  flex-direction: column;
}

.employee-booking-item {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) 145px;
  gap: 18px;
  align-items: center;
  padding: 15px 17px;
  border-bottom: 1px solid var(--border);
}

.employee-booking-item:last-child {
  border-bottom: 0;
}

.employee-booking-item:hover {
  background: #fcfcfd;
}

.booking-date-block,
.booking-main-info,
.booking-side-info {
  min-width: 0;
}

.booking-date-block strong,
.booking-date-block span {
  display: block;
}

.booking-date-block strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.booking-date-block span {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 11px;
}

.booking-service-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.booking-service-line > strong {
  color: var(--text);
  font-size: 14px;
}

.booking-status {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.booking-status.status-pending { background: #fff7ed; color: #c2410c; }
.booking-status.status-confirmed { background: #eff6ff; color: #1d4ed8; }
.booking-status.status-completed { background: #ecfdf3; color: #15803d; }
.booking-status.status-cancelled { background: #fef2f2; color: #b42318; }
.booking-status.status-no_show { background: #f5f3ff; color: #6d28d9; }

.booking-customer {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.booking-contact {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.booking-contact a,
.booking-contact span {
  color: var(--text-muted);
  font-size: 11px;
  text-decoration: none;
}

.booking-contact a:hover {
  color: var(--primary);
}

.booking-side-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.booking-side-info > strong {
  color: var(--text);
  font-size: 13px;
}

.conversation-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.booking-empty {
  min-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
}

.booking-empty-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 9px;
  border-radius: 10px;
  background: var(--surface-soft);
  color: var(--text-muted);
}

.booking-empty strong {
  color: var(--text);
  font-size: 14px;
}

.booking-empty p {
  margin: 5px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.bookings-error {
  margin: 0;
  padding: 10px 14px;
  border-bottom: 1px solid #fecaca;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12px;
}

@media (max-width: 1050px) {
  .profile-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hours-header,
  .hours-row {
    grid-template-columns: 110px 130px 1fr 120px;
  }

  .employee-booking-item {
    grid-template-columns: 170px minmax(0, 1fr) 130px;
  }
}

@media (max-width: 900px) {
  .employee-detail-page {
    padding: 30px 32px 60px;
  }

  .hours-header {
    display: none;
  }

  .hours-row {
    grid-template-columns: 120px 1fr;
  }

  .day-hours,
  .closed-label,
  .period-button {
    grid-column: 1 / -1;
  }

  .timeoff-layout {
    grid-template-columns: 1fr;
  }

  .employee-booking-item {
    grid-template-columns: 1fr auto;
  }

  .booking-date-block {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .employee-detail-page {
    padding: 24px 20px 50px;
  }

  .page-header,
  .danger-zone {
    align-items: stretch;
    flex-direction: column;
  }

  .identity {
    align-items: flex-start;
  }

  .profile-grid,
  .services-grid {
    grid-template-columns: 1fr;
  }

  .panel-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .panel-footer .primary-button {
    width: 100%;
  }

  .employee-booking-item {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .booking-date-block {
    grid-column: auto;
  }

  .booking-side-info {
    align-items: flex-start;
  }

  .field input,
  .field select,
  .field textarea,
  .time-group input {
    font-size: 16px;
  }
}

@media (max-width: 520px) {
  .hours-row {
    grid-template-columns: 1fr;
  }

  .day-hours,
  .closed-label,
  .period-button {
    grid-column: auto;
  }

  .time-group {
    width: 100%;
  }

  .time-group input {
    min-width: 0;
    width: 100%;
  }

  .timeoff-item {
    flex-wrap: wrap;
  }
}
</style>
