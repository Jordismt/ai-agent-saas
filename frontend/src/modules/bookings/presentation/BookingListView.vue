<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { BookingService } from "../infrastructure/BookingService.js";
import { BusinessService } from "../../businesses/infrastructure/BusinessService.js";
import { EmployeeService } from "../../employees/infrastructure/EmployeeService.js";

const route = useRoute();
const router = useRouter();

const bookingService = new BookingService();
const businessService = new BusinessService();
const employeeService = new EmployeeService();

const bookings = ref([]);
const business = ref(null);
const allEmployees = ref([]);
const services = ref([]);
const employeeServiceIds = ref({});
const employeeServicesLoading = ref(false);
const employeeServicesError = ref(false);

const loading = ref(false);
const error = ref("");
const updatingBookingId = ref(null);

const search = ref("");
const statusFilter = ref("all");
const dateFilter = ref("upcoming");
const employeeFilter = ref("all");

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
    const [businessData, bookingData, servicesData, employeesData] = await Promise.all([
      businessService.getBusinessById(businessId.value),
      bookingService.getByBusinessId(businessId.value),
      businessService.getBusinessServices(businessId.value),
      employeeService.getByBusinessId(businessId.value),
    ]);

    business.value = businessData;
    bookings.value = Array.isArray(bookingData) ? bookingData : [];
    services.value = Array.isArray(servicesData) ? servicesData : [];
    allEmployees.value = Array.isArray(employeesData) ? employeesData : [];
    employeeServicesLoading.value = true;
    employeeServicesError.value = false;
    const assignments = await Promise.allSettled(
      allEmployees.value.filter(e => e.active !== false).map(async employee => ({
        id: employee.id,
        services: await employeeService.getServices(employee.id),
      }))
    );
    employeeServiceIds.value = Object.fromEntries(assignments
      .filter(result => result.status === "fulfilled")
      .map(result => {
        const { id, services: data } = result.value;
        const items = Array.isArray(data) ? data : (data?.services || []);
        return [id, items.map(item => typeof item === "string" ? item : (item.service_id || item.serviceId || item.id))];
      }));
    employeeServicesError.value = assignments.some(result => result.status === "rejected");
    employeeServicesLoading.value = false;
  } catch (err) {
    console.error(err);

    error.value = err.message || "No se han podido cargar las reservas.";
  } finally {
    loading.value = false;
  }
};

const employees = computed(() => allEmployees.value.filter(e => e.active !== false).sort((a,b) => a.name.localeCompare(b.name,"es")));
const qualifiedEmployees = computed(() => form.value.serviceId
  ? employees.value.filter(e => employeeServiceIds.value[e.id]?.includes(form.value.serviceId))
  : []);

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

    const matchesEmployee =
      employeeFilter.value === "all" ||
      (employeeFilter.value === "unassigned"
        ? !booking.employee_id
        : booking.employee_id === employeeFilter.value);

    const matchesSearch =
      !query ||
      booking.customer_name?.toLowerCase().includes(query) ||
      booking.customer_email?.toLowerCase().includes(query) ||
      booking.customer_phone?.toLowerCase().includes(query) ||
      booking.service_name?.toLowerCase().includes(query) ||
      booking.employee?.name?.toLowerCase().includes(query) ||
      booking.notes?.toLowerCase().includes(query);

    return matchesStatus && matchesEmployee && matchesSearch && matchesDateFilter(booking);
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
  employeeFilter.value = "all";
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


// Formulario de reservas manuales. Las horas proceden siempre del backend.
const modalOpen = ref(false);
const modalMode = ref("create");
const selectedBooking = ref(null);
const modalError = ref("");
const saving = ref(false);
const loadingSlots = ref(false);
const slots = ref([]);
const sendEmail = ref(true);
const form = ref(emptyForm());
let availabilityRequest = 0;
function emptyForm() {
  return { serviceId:"", employeeId:"", date:"", time:"", customerName:"", customerPhone:"", customerEmail:"", notes:"" };
}
const isEditing = computed(() => modalMode.value === "edit");
const editable = booking => !["cancelled","completed","no_show"].includes(booking.status);
const currentService = computed(() => services.value.find(s => s.id === form.value.serviceId));
const availableSlots = computed(() => {
  const result = slots.value.filter(slot => !form.value.employeeId || slot.employees?.some(e => e.id === form.value.employeeId));
  // En edición, el horario actual se puede mantener aunque la consulta lo excluya.
  if (isEditing.value && selectedBooking.value && form.value.serviceId === selectedBooking.value.service_id &&
      form.value.date === getDateParts(selectedBooking.value.starts_at)) {
    const existingTime = formatTime(selectedBooking.value.starts_at);
    if (!result.some(slot => slot.localTime === existingTime)) {
      result.unshift({localTime: existingTime, employees: selectedBooking.value.employee ? [selectedBooking.value.employee] : [], existing:true});
    }
  }
  return result;
});
function openCreate() {
  selectedBooking.value = null;
  modalMode.value = "create";
  modalError.value = "";
  sendEmail.value = true;
  slots.value = [];
  form.value = emptyForm();
  modalOpen.value = true;
}
async function openEdit(booking) {
  if (!editable(booking)) return;
  selectedBooking.value = booking;
  modalMode.value = "edit";
  modalError.value = "";
  sendEmail.value = !!booking.customer_email;
  form.value = {
    serviceId: booking.service_id || "", employeeId: booking.employee_id || "",
    date: getDateParts(booking.starts_at) || "", time: formatTime(booking.starts_at),
    customerName: booking.customer_name || "", customerPhone: booking.customer_phone || "",
    customerEmail: booking.customer_email || "", notes: booking.notes || "",
  };
  modalOpen.value = true;
  await fetchSlots();
}
function closeModal() {
  if (saving.value) return;
  availabilityRequest++;
  modalOpen.value = false;
}
async function fetchSlots() {
  const request = ++availabilityRequest;
  slots.value = [];
  if (!form.value.serviceId || !form.value.date) return;
  loadingSlots.value = true;
  modalError.value = "";
  try {
    const result = await bookingService.getAvailability(businessId.value, form.value.serviceId, form.value.date);
    if (request === availabilityRequest) slots.value = Array.isArray(result) ? result : [];
  } catch(err) {
    if (request === availabilityRequest) modalError.value = err.message || "No se ha podido consultar la disponibilidad.";
  } finally {
    if (request === availabilityRequest) loadingSlots.value = false;
  }
}
function changeAvailability() {
  if (form.value.employeeId && !qualifiedEmployees.value.some(e => e.id === form.value.employeeId)) {
    form.value.employeeId = "";
  }
  form.value.time = "";
  fetchSlots();
}
function getSlotEmployees() {
  return availableSlots.value.find(s => s.localTime === form.value.time)?.employees || [];
}
async function saveManual() {
  modalError.value = "";
  if (!form.value.serviceId || !form.value.date || !form.value.time || !form.value.customerName.trim()) {
    modalError.value = "Completa el servicio, fecha, hora y nombre del cliente."; return;
  }
  if (sendEmail.value && !form.value.customerEmail.trim()) {
    modalError.value = "Introduce el correo o desactiva las notificaciones."; return;
  }
  if (employeeServicesLoading.value || employeeServicesError.value) {
    modalError.value = "No se han podido verificar los servicios de los empleados. Actualiza la página e inténtalo de nuevo."; return;
  }
  if (form.value.employeeId && !qualifiedEmployees.value.some(e => e.id === form.value.employeeId)) {
    modalError.value = "Este empleado no realiza el servicio seleccionado."; return;
  }
  const slot = availableSlots.value.find(s => s.localTime === form.value.time);
  if (!slot) { modalError.value = "Selecciona una hora disponible."; return; }
  if (form.value.employeeId && !slot.existing && !slot.employees?.some(e => e.id === form.value.employeeId)) {
    modalError.value = "El empleado no está disponible a esa hora."; return;
  }
  saving.value = true;
  try {
    const payload = {
      serviceId: form.value.serviceId, date: form.value.date, time: form.value.time,
      employeeId: form.value.employeeId || null, customerName: form.value.customerName.trim(),
      customerPhone: form.value.customerPhone.trim() || null,
      customerEmail: sendEmail.value ? form.value.customerEmail.trim() : null,
      notes: form.value.notes.trim() || null,
    };
    if (isEditing.value) await bookingService.updateManual(selectedBooking.value.id,payload);
    else await bookingService.createManual(businessId.value,payload);
    modalOpen.value = false;
    await loadData();
  } catch(err) {
    modalError.value = err.message || "No se ha podido guardar la reserva.";
  } finally { saving.value = false; }
}
async function cancelBooking(booking) {
  if (!window.confirm(`¿Cancelar la reserva de ${booking.customer_name}? Se conservará en el historial.`)) return;
  updatingBookingId.value = booking.id;
  error.value = "";
  try { await bookingService.cancelManual(booking.id); await loadData(); }
  catch(err) { error.value = err.message || "No se ha podido cancelar la reserva."; }
  finally { updatingBookingId.value = null; }
}

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

            <p class="page-description">Gestiona todas tus reservas, tanto automáticas como manuales.</p>
          </div>
        </div>

        <div class="manual-header-actions"><button type="button" class="manual-primary" @click="openCreate">+ Nueva reserva</button>
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
        </button></div>
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
          :class="{
            selected: statusFilter === 'pending',
          }"
          @click="setStatusFilter('pending')">
          <div class="stat-icon pending">◷</div>

          <strong>{{ pendingCount }}</strong>
          <span>Pendientes</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{
            selected: statusFilter === 'confirmed',
          }"
          @click="setStatusFilter('confirmed')">
          <div class="stat-icon confirmed">✓</div>

          <strong>{{ confirmedCount }}</strong>
          <span>Confirmadas</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{
            selected: statusFilter === 'completed',
          }"
          @click="setStatusFilter('completed')">
          <div class="stat-icon completed">↑</div>

          <strong>{{ completedCount }}</strong>
          <span>Completadas</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{
            selected: statusFilter === 'cancelled',
          }"
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

            <select v-model="employeeFilter" class="filter-select">
              <option value="all">Todos los empleados</option>

              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>

              <option value="unassigned">Sin asignar</option>
            </select>

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
            <span> Obteniendo la agenda del negocio... </span>
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
            Cuando se registre una reserva desde el agente o manualmente, aparecerá aquí.
          </p>

          <div class="empty-info">
            <span>✦</span>

            <p>
              Resbix registra el servicio, el empleado, los datos del cliente, la fecha, la hora y el estado
              de cada cita.
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
                <th>Empleado</th>
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

                      <span>
                        ID
                        {{ booking.id?.slice(0, 8) }}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  <div class="service-info">
                    <strong>
                      {{ booking.service_name || "Servicio" }}
                    </strong>

                    <span v-if="booking.duration_minutes">
                      {{ booking.duration_minutes }}
                      min
                    </span>
                  </div>
                </td>

                <td>
                  <div v-if="booking.employee" class="employee-info">
                    <div class="employee-avatar">
                      {{ getInitials(booking.employee.name) }}
                    </div>

                    <div>
                      <strong>
                        {{ booking.employee.name }}
                      </strong>

                      <span>Empleado</span>
                    </div>
                  </div>

                  <span v-else class="unassigned-employee"> Sin asignar </span>
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
                  <div v-if="editable(booking)" class="manual-row-actions"><button type="button" @click="openEdit(booking)">Editar</button><button type="button" class="manual-danger-link" :disabled="updatingBookingId === booking.id" @click="cancelBooking(booking)">Cancelar</button></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!loading && bookings.length > 0" class="table-footer">
          <span>
            Mostrando
            <strong>
              {{ filteredBookings.length }}
            </strong>
            de
            <strong>
              {{ bookings.length }}
            </strong>
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

    <div v-if="modalOpen" class="manual-overlay" @click.self="closeModal">
      <section class="manual-modal" role="dialog" aria-modal="true" aria-labelledby="manual-modal-title">
        <div class="manual-modal-head">
          <div><p class="eyebrow">Agenda · Resbix</p><h2 id="manual-modal-title">{{ isEditing ? 'Editar reserva' : 'Nueva reserva' }}</h2><p>Selecciona una cita disponible y completa los datos del cliente.</p></div>
          <button type="button" class="manual-close" :disabled="saving" aria-label="Cerrar" @click="closeModal">×</button>
        </div>
        <form class="manual-form" @submit.prevent="saveManual">
          <div v-if="modalError" class="manual-alert">{{ modalError }}</div>
          <div class="manual-grid">
            <label class="manual-field manual-wide">Servicio <select v-model="form.serviceId" required @change="changeAvailability"><option value="">Seleccionar servicio</option><option v-for="service in services" :key="service.id" :value="service.id">{{ service.name }} · {{ service.duration_minutes }} min</option></select></label>
            <label class="manual-field">Fecha <input v-model="form.date" type="date" required @change="changeAvailability" /></label>
            <label class="manual-field">Empleado
              <select v-model="form.employeeId" :disabled="!form.serviceId || employeeServicesLoading || employeeServicesError" @change="form.time = ''">
                <option value="">{{ employeeServicesLoading ? 'Cargando empleados...' : (!form.serviceId ? 'Selecciona primero un servicio' : 'Cualquiera disponible') }}</option>
                <option v-for="employee in qualifiedEmployees" :key="employee.id" :value="employee.id">{{ employee.name }}</option>
              </select>
              <small v-if="employeeServicesError" class="manual-hint">No se pudieron cargar las especialidades. Actualiza la página.</small>
              <small v-else-if="form.serviceId && !employeeServicesLoading && !qualifiedEmployees.length" class="manual-hint">No hay empleados asignados a este servicio.</small>
            </label>
            <div class="manual-field manual-wide"><span>Horario disponible</span><div v-if="loadingSlots" class="manual-hint">Consultando disponibilidad...</div><div v-else-if="!form.date || !form.serviceId" class="manual-hint">Selecciona un servicio y una fecha.</div><div v-else-if="!availableSlots.length" class="manual-hint">No hay horarios disponibles para esta selección.</div><div v-else class="manual-slot-grid"><button v-for="slot in availableSlots" :key="slot.localTime" type="button" :class="['manual-slot', {chosen:form.time===slot.localTime}]" @click="form.time=slot.localTime">{{ slot.localTime }}</button></div></div>
          </div>
          <div class="manual-separator"></div>
          <div class="manual-grid">
            <label class="manual-field manual-wide">Nombre del cliente <input v-model="form.customerName" type="text" maxlength="120" placeholder="Nombre y apellidos" required /></label>
            <label class="manual-field">Teléfono (opcional) <input v-model="form.customerPhone" type="tel" maxlength="50" placeholder="600 000 000" /></label>
            <label class="manual-field">Email (opcional) <input v-model="form.customerEmail" type="email" :disabled="!sendEmail" placeholder="cliente@correo.com" /></label>
            <label class="manual-toggle manual-wide"><input v-model="sendEmail" type="checkbox" /><span><strong>Utilizar correo para notificaciones</strong><small>Si introduces un email, el backend puede enviar la confirmación y el recordatorio. Las notificaciones de edición y cancelación manual requieren completar su integración.</small></span></label>
            <label class="manual-field manual-wide">Notas internas <textarea v-model="form.notes" rows="3" maxlength="1000" placeholder="Observaciones de la reserva..."></textarea></label>
          </div>
          <div class="manual-modal-footer"><button type="button" class="manual-secondary" :disabled="saving" @click="closeModal">Cerrar</button><button type="submit" class="manual-primary" :disabled="saving || loadingSlots">{{ saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear reserva') }}</button></div>
        </form>
      </section>
    </div>
</template>

<style scoped>
.bookings-page {
  min-height: 100vh;
  padding: 34px 48px 80px;
}

.page-container {
  width: min(1320px, 100%);
  margin: 0 auto;
}

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

.employee-info {
  min-width: 145px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-avatar {
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
}

.employee-info > div:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-info strong {
  max-width: 130px;
  overflow: hidden;
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-info span {
  color: var(--text-muted);
  font-size: 10px;
}

.unassigned-employee {
  color: var(--text-muted);
  font-size: 11px;
}

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

.booking-price {
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

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

@media (max-width: 1180px) {
  .bookings-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    width: auto;
    min-width: 190px;
  }
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

/* Reservas manuales */
.manual-header-actions{display:flex;align-items:center;gap:10px}
.manual-primary{border:0;border-radius:9px;padding:11px 18px;background:#2563eb;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.manual-primary:hover:not(:disabled){background:#1d4ed8}
.manual-primary:disabled{opacity:.55;cursor:wait}
.manual-row-actions{display:flex;gap:8px;margin-top:7px}
.manual-row-actions button{border:0;background:none;color:#2563eb;font-size:12px;font-weight:650;cursor:pointer;padding:3px}
.manual-row-actions .manual-danger-link{color:#dc2626}
.manual-overlay{position:fixed;inset:0;z-index:1100;background:rgba(15,23,42,.56);display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}
.manual-modal{width:min(660px,100%);max-height:calc(100vh - 40px);overflow:auto;border-radius:17px;background:#fff;box-shadow:0 24px 90px rgba(0,0,0,.24)}
.manual-modal-head{display:flex;justify-content:space-between;gap:15px;padding:24px 27px 19px;border-bottom:1px solid #e5e7eb}
.manual-modal-head h2{font-size:23px;color:#0f172a;letter-spacing:-.035em;margin:0 0 5px}
.manual-modal-head p:not(.eyebrow){margin:0;color:#64748b;font-size:13px}
.manual-close{align-self:flex-start;border:0;background:#f1f5f9;color:#475569;width:32px;height:32px;border-radius:8px;font-size:24px;cursor:pointer}
.manual-form{padding:22px 27px 0}
.manual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.manual-wide{grid-column:1/-1}
.manual-field{display:flex;flex-direction:column;gap:7px;color:#334155;font-size:12px;font-weight:700}
.manual-field input,.manual-field select,.manual-field textarea{width:100%;box-sizing:border-box;border:1px solid #dbe2eb;border-radius:9px;padding:11px;background:#fff;color:#0f172a;font:inherit;font-size:13px;font-weight:450;outline:none}
.manual-field input:focus,.manual-field select:focus,.manual-field textarea:focus{border-color:#60a5fa;box-shadow:0 0 0 3px #dbeafe}
.manual-field input:disabled{background:#f8fafc;color:#94a3b8}
.manual-slot-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.manual-slot{padding:10px 4px;border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:600}
.manual-slot.chosen{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}
.manual-hint{border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;padding:16px;border-radius:9px;font-size:13px;font-weight:450}
.manual-separator{height:1px;background:#e5e7eb;margin:22px 0}
.manual-toggle{display:flex;align-items:flex-start;gap:10px;padding:12px;background:#f8fafc;border-radius:9px;cursor:pointer}
.manual-toggle input{margin-top:3px;accent-color:#2563eb}
.manual-toggle span{display:flex;flex-direction:column;gap:4px}
.manual-toggle strong{color:#334155;font-size:12px}
.manual-toggle small{color:#64748b;font-size:11px;line-height:1.5}
.manual-alert{border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;padding:12px;border-radius:9px;font-size:12px;margin-bottom:16px}
.manual-modal-footer{display:flex;justify-content:flex-end;gap:9px;position:sticky;bottom:0;background:#fff;border-top:1px solid #e5e7eb;margin:22px -27px 0;padding:16px 27px}
.manual-secondary{border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:11px 17px;font:inherit;font-size:13px;font-weight:650;color:#475569;cursor:pointer}
@media(max-width:700px){.manual-header-actions{width:100%;flex-wrap:wrap}.manual-header-actions>button{flex:1}.manual-modal-head{padding:20px}.manual-form{padding:18px 20px 0}.manual-modal-footer{margin:20px -20px 0;padding:15px 20px}.manual-slot-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:480px){.manual-grid{grid-template-columns:1fr}.manual-slot-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
