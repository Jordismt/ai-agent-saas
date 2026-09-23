<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { BusinessService } from "../infrastructure/BusinessService.js";
import { BusinessHoursService } from "../infrastructure/BusinessHoursService.js";

import { GetBusinessById } from "../application/GetBusinessById.js";
import { GetBusinessServices } from "../application/GetBusinessServices.js";
import { CreateBusinessService } from "../application/CreateBusinessService.js";
import { DeleteBusinessService } from "../application/DeleteBusinessService.js";
import { UpdateBusinessService } from "../application/UpdateBusinessService.js";

const route = useRoute();

const businessService = new BusinessService();
const businessHoursService = new BusinessHoursService();

const getBusinessById = new GetBusinessById(businessService);
const getBusinessServices = new GetBusinessServices(businessService);
const createBusinessService = new CreateBusinessService(businessService);
const deleteBusinessService = new DeleteBusinessService(businessService);
const updateBusinessService = new UpdateBusinessService(businessService);

const business = ref(null);
const services = ref([]);
const businessHours = ref([]);

const loading = ref(true);
const error = ref("");

const hoursLoading = ref(true);
const hoursError = ref("");
const hoursSaveError = ref("");
const hoursSaveSuccess = ref("");
const hoursSaving = ref(false);

const editingHours = ref([]);

const serviceName = ref("");
const serviceDescription = ref("");
const servicePrice = ref("");
const serviceDuration = ref("");

const serviceLoading = ref(false);
const serviceError = ref("");
const deletingServiceId = ref(null);

const editingServiceId = ref(null);

const editServiceName = ref("");
const editServiceDescription = ref("");
const editServicePrice = ref("");
const editServiceDuration = ref("");

const updateServiceLoading = ref(false);

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const normalizeTime = (time) => {
  if (!time) {
    return null;
  }

  return String(time).slice(0, 5);
};

const initializeHoursForm = (hours) => {
  const existingHours = new Map(hours.map((day) => [day.day_of_week, day]));

  editingHours.value = Array.from({ length: 7 }, (_, index) => {
    const day = existingHours.get(index);

    if (!day) {
      return {
        id: null,
        dayOfWeek: index,
        openTime: null,
        closeTime: null,
        secondOpenTime: null,
        secondCloseTime: null,
        isClosed: true,
      };
    }

    return {
      id: day.id,
      dayOfWeek: day.day_of_week,
      openTime: normalizeTime(day.open_time),
      closeTime: normalizeTime(day.close_time),
      secondOpenTime: normalizeTime(day.second_open_time),
      secondCloseTime: normalizeTime(day.second_close_time),
      isClosed: day.is_closed,
    };
  });
};

const loadBusiness = async () => {
  loading.value = true;
  error.value = "";

  try {
    business.value = await getBusinessById.execute(route.params.id);

    services.value = await getBusinessServices.execute(route.params.id);
  } catch (err) {
    error.value = err.message || "No se ha podido cargar el negocio.";
  } finally {
    loading.value = false;
  }

  hoursLoading.value = true;
  hoursError.value = "";

  try {
    businessHours.value = await businessHoursService.getByBusinessId(route.params.id);

    initializeHoursForm(businessHours.value);
  } catch (err) {
    hoursError.value = err.message || "No se han podido cargar los horarios.";

    initializeHoursForm([]);
  } finally {
    hoursLoading.value = false;
  }
};

const handleSaveHours = async () => {
  hoursSaveError.value = "";
  hoursSaveSuccess.value = "";

  for (const day of editingHours.value) {
    if (day.isClosed) {
      continue;
    }

    if (!day.openTime || !day.closeTime) {
      hoursSaveError.value = `Completa el horario de ${dayNames[day.dayOfWeek]}.`;

      return;
    }

    const hasSecondOpen = Boolean(day.secondOpenTime);

    const hasSecondClose = Boolean(day.secondCloseTime);

    if (hasSecondOpen !== hasSecondClose) {
      hoursSaveError.value = `El segundo horario de ${dayNames[day.dayOfWeek]} debe tener apertura y cierre.`;

      return;
    }

    if (day.openTime >= day.closeTime) {
      hoursSaveError.value = `El horario de ${dayNames[day.dayOfWeek]} tiene una hora de cierre incorrecta.`;

      return;
    }

    if (hasSecondOpen && hasSecondClose && day.secondOpenTime >= day.secondCloseTime) {
      hoursSaveError.value = `El segundo horario de ${dayNames[day.dayOfWeek]} tiene una hora de cierre incorrecta.`;

      return;
    }

    if (hasSecondOpen && hasSecondClose && day.secondOpenTime <= day.closeTime) {
      hoursSaveError.value = `El segundo horario de ${dayNames[day.dayOfWeek]} debe comenzar después del primer horario.`;

      return;
    }
  }

  hoursSaving.value = true;

  try {
    const updatedHours = await businessHoursService.update(route.params.id, editingHours.value);

    businessHours.value = updatedHours;

    initializeHoursForm(updatedHours);

    hoursSaveSuccess.value = "Horarios guardados correctamente.";
  } catch (err) {
    hoursSaveError.value = err.message || "No se han podido guardar los horarios.";
  } finally {
    hoursSaving.value = false;
  }
};

const handleToggleClosed = (day) => {
  if (day.isClosed) {
    day.openTime = null;
    day.closeTime = null;
    day.secondOpenTime = null;
    day.secondCloseTime = null;
  } else {
    if (!day.openTime) {
      day.openTime = "09:00";
    }

    if (!day.closeTime) {
      day.closeTime = "18:00";
    }
  }

  hoursSaveError.value = "";
  hoursSaveSuccess.value = "";
};

const hasSecondPeriod = (day) => {
  return day.secondOpenTime !== null || day.secondCloseTime !== null;
};

const toggleSecondPeriod = (day) => {
  if (hasSecondPeriod(day)) {
    day.secondOpenTime = null;
    day.secondCloseTime = null;
  } else {
    day.secondOpenTime = "16:00";
    day.secondCloseTime = "20:00";
  }

  hoursSaveError.value = "";
  hoursSaveSuccess.value = "";
};

const formatHours = (hours) => {
  if (hours.is_closed) {
    return "Cerrado";
  }

  const openTime = normalizeTime(hours.open_time);

  const closeTime = normalizeTime(hours.close_time);

  const firstPeriod = `${openTime} - ${closeTime}`;

  const secondOpenTime = normalizeTime(hours.second_open_time);

  const secondCloseTime = normalizeTime(hours.second_close_time);

  if (secondOpenTime && secondCloseTime) {
    return `${firstPeriod} / ${secondOpenTime} - ${secondCloseTime}`;
  }

  return firstPeriod;
};

/* =========================
   SERVICIOS
========================= */

const handleCreateService = async () => {
  serviceError.value = "";

  if (!serviceName.value.trim()) {
    serviceError.value = "El nombre del servicio es obligatorio.";

    return;
  }

  serviceLoading.value = true;

  try {
    const service = await createBusinessService.execute(route.params.id, {
      name: serviceName.value.trim(),
      description: serviceDescription.value.trim() || null,
      price: servicePrice.value === "" ? null : Number(servicePrice.value),
      duration_minutes: serviceDuration.value === "" ? null : Number(serviceDuration.value),
    });

    services.value.push(service);

    serviceName.value = "";
    serviceDescription.value = "";
    servicePrice.value = "";
    serviceDuration.value = "";
  } catch (err) {
    serviceError.value = err.message || "No se ha podido crear el servicio.";
  } finally {
    serviceLoading.value = false;
  }
};

const handleDeleteService = async (serviceId) => {
  serviceError.value = "";

  const confirmed = window.confirm("¿Seguro que quieres eliminar este servicio?");

  if (!confirmed) {
    return;
  }

  deletingServiceId.value = serviceId;

  try {
    await deleteBusinessService.execute(route.params.id, serviceId);

    services.value = services.value.filter((service) => service.id !== serviceId);
  } catch (err) {
    serviceError.value = err.message || "No se ha podido eliminar el servicio.";
  } finally {
    deletingServiceId.value = null;
  }
};

const startEditingService = (service) => {
  editingServiceId.value = service.id;

  editServiceName.value = service.name;

  editServiceDescription.value = service.description || "";

  editServicePrice.value = service.price === null ? "" : service.price;

  editServiceDuration.value = service.duration_minutes === null ? "" : service.duration_minutes;

  serviceError.value = "";
};

const cancelEditingService = () => {
  editingServiceId.value = null;

  editServiceName.value = "";
  editServiceDescription.value = "";
  editServicePrice.value = "";
  editServiceDuration.value = "";

  serviceError.value = "";
};

const handleUpdateService = async () => {
  serviceError.value = "";

  if (!editServiceName.value.trim()) {
    serviceError.value = "El nombre del servicio es obligatorio.";

    return;
  }

  updateServiceLoading.value = true;

  try {
    const updatedService = await updateBusinessService.execute(route.params.id, editingServiceId.value, {
      name: editServiceName.value.trim(),
      description: editServiceDescription.value.trim() || null,
      price: editServicePrice.value === "" ? null : Number(editServicePrice.value),
      duration_minutes: editServiceDuration.value === "" ? null : Number(editServiceDuration.value),
    });

    const index = services.value.findIndex((service) => service.id === editingServiceId.value);

    if (index !== -1) {
      services.value[index] = updatedService;
    }

    cancelEditingService();
  } catch (err) {
    serviceError.value = err.message || "No se ha podido actualizar el servicio.";
  } finally {
    updateServiceLoading.value = false;
  }
};

onMounted(loadBusiness);
</script>

<template>
  <div class="business-detail-page">
    <div class="page-container">
      <!-- BREADCRUMB -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <span>{{ business?.name || "Detalle" }}</span>
      </nav>

      <!-- LOADING -->

      <div v-if="loading" class="page-state">
        <div class="spinner"></div>
        <p>Cargando negocio...</p>
      </div>

      <!-- ERROR -->

      <div v-else-if="error" class="page-state">
        <div class="state-icon error-icon">!</div>

        <h2>No se ha podido cargar el negocio</h2>

        <p>{{ error }}</p>

        <button type="button" class="button button-primary" @click="loadBusiness">Reintentar</button>
      </div>

      <!-- CONTENT -->

      <template v-else-if="business">
        <!-- PAGE HEADER -->

        <header class="page-header">
          <div class="business-heading">
            <div class="business-avatar">
              {{ business.name?.charAt(0)?.toUpperCase() }}
            </div>

            <div>
              <div class="heading-meta">
                <span class="status-dot"></span>
                <span>Negocio activo</span>
              </div>

              <h1>{{ business.name }}</h1>

              <p>
                {{ business.description || "Gestiona la información que utiliza tu agente de IA." }}
              </p>
            </div>
          </div>

          <RouterLink class="primary-action" :to="`/businesses/${route.params.id}/agent-config`">
            <span>✦</span>
            Configurar agente
          </RouterLink>
        </header>

        <!-- BUSINESS NAV -->

        <section class="business-navigation">
          <div class="business-nav-info">
            <span class="nav-label">Panel del negocio</span>

            <div class="business-links">
              <a href="#general" class="business-link active"> General </a>

              <a href="#hours" class="business-link"> Horarios </a>

              <a href="#services" class="business-link"> Servicios </a>
            </div>
          </div>

          <div class="business-actions">
            <RouterLink :to="`/businesses/${route.params.id}/conversations`" class="action-link">
              <span class="action-icon">◌</span>

              <div>
                <strong>Conversaciones</strong>
                <small>Gestionar chats</small>
              </div>

              <span class="arrow">→</span>
            </RouterLink>

            <RouterLink :to="`/businesses/${route.params.id}/leads`" class="action-link">
              <span class="action-icon">♧</span>

              <div>
                <strong>Leads</strong>
                <small>Ver oportunidades</small>
              </div>

              <span class="arrow">→</span>
            </RouterLink>

            <RouterLink :to="`/businesses/${route.params.id}/bookings`" class="action-link">
              <span class="action-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              </span>

              <div>
                <strong>Reservas</strong>
                <small>Gestionar citas</small>
              </div>

              <span class="arrow">→</span>
            </RouterLink>
          </div>
        </section>

        <!-- GENERAL -->

        <section id="general" class="content-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Información</span>
              <h2>Datos del negocio</h2>

              <p>Información disponible para tu asistente virtual.</p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-icon">☎</div>

              <div class="info-content">
                <span>Teléfono</span>

                <strong>
                  {{ business.phone || "No configurado" }}
                </strong>
              </div>

              <span class="configuration-state" :class="{ empty: !business.phone }">
                {{ business.phone ? "Configurado" : "Pendiente" }}
              </span>
            </div>

            <div class="info-divider"></div>

            <div class="info-row">
              <div class="info-icon">⌖</div>

              <div class="info-content">
                <span>Dirección</span>

                <strong>
                  {{ business.address || "No configurada" }}
                </strong>
              </div>

              <span class="configuration-state" :class="{ empty: !business.address }">
                {{ business.address ? "Configurada" : "Pendiente" }}
              </span>
            </div>
          </div>
        </section>

        <!-- HOURS -->

        <section id="hours" class="content-section">
          <div class="section-heading section-heading-action">
            <div>
              <span class="eyebrow">Disponibilidad</span>

              <h2>Horario comercial</h2>

              <p>Define cuándo puede indicar tu agente que el negocio está abierto.</p>
            </div>

            <span class="section-badge"> 7 días </span>
          </div>

          <div v-if="hoursLoading" class="inline-state">
            <div class="spinner spinner-small"></div>
            Cargando horarios...
          </div>

          <div v-else-if="hoursError" class="alert alert-error">
            {{ hoursError }}
          </div>

          <form v-else class="hours-panel" @submit.prevent="handleSaveHours">
            <div class="hours-header">
              <span>Día</span>
              <span>Estado</span>
              <span>Horario</span>
              <span></span>
            </div>

            <div class="hours-list">
              <div
                v-for="day in editingHours"
                :key="day.dayOfWeek"
                class="hours-row"
                :class="{ closed: day.isClosed }">
                <div class="day-name">
                  <strong>
                    {{ dayNames[day.dayOfWeek] }}
                  </strong>
                </div>

                <div class="day-toggle">
                  <label class="switch">
                    <input v-model="day.isClosed" type="checkbox" @change="handleToggleClosed(day)" />

                    <span class="switch-slider"></span>
                  </label>

                  <span class="day-status" :class="{ closed: day.isClosed }">
                    {{ day.isClosed ? "Cerrado" : "Abierto" }}
                  </span>
                </div>

                <div v-if="!day.isClosed" class="day-hours">
                  <div class="time-group">
                    <input
                      :id="`open-${day.dayOfWeek}`"
                      v-model="day.openTime"
                      type="time"
                      aria-label="Hora de apertura" />

                    <span>—</span>

                    <input
                      :id="`close-${day.dayOfWeek}`"
                      v-model="day.closeTime"
                      type="time"
                      aria-label="Hora de cierre" />
                  </div>

                  <div v-if="hasSecondPeriod(day)" class="time-group second-time">
                    <input
                      :id="`second-open-${day.dayOfWeek}`"
                      v-model="day.secondOpenTime"
                      type="time"
                      aria-label="Segunda hora de apertura" />

                    <span>—</span>

                    <input
                      :id="`second-close-${day.dayOfWeek}`"
                      v-model="day.secondCloseTime"
                      type="time"
                      aria-label="Segunda hora de cierre" />
                  </div>
                </div>

                <div v-else class="closed-hours">No disponible</div>

                <button
                  v-if="!day.isClosed"
                  type="button"
                  class="period-button"
                  @click="toggleSecondPeriod(day)">
                  {{ hasSecondPeriod(day) ? "− Segundo turno" : "+ Segundo turno" }}
                </button>

                <span v-else></span>
              </div>
            </div>

            <div class="panel-footer">
              <div class="feedback">
                <p v-if="hoursSaveError" class="form-message error">
                  {{ hoursSaveError }}
                </p>

                <p v-if="hoursSaveSuccess" class="form-message success">✓ {{ hoursSaveSuccess }}</p>
              </div>

              <button type="submit" class="button button-primary" :disabled="hoursSaving">
                {{ hoursSaving ? "Guardando..." : "Guardar horarios" }}
              </button>
            </div>
          </form>
        </section>

        <!-- SERVICES -->

        <section id="services" class="content-section services-section">
          <div class="section-heading section-heading-action">
            <div>
              <span class="eyebrow">Catálogo</span>

              <h2>Servicios</h2>

              <p>Información que el agente podrá utilizar para responder preguntas de tus clientes.</p>
            </div>

            <span class="section-badge">
              {{ services.length }}
              {{ services.length === 1 ? "servicio" : "servicios" }}
            </span>
          </div>

          <!-- CREATE SERVICE -->

          <div class="create-service-panel">
            <div class="create-heading">
              <div class="create-icon">+</div>

              <div>
                <h3>Añadir servicio</h3>

                <p>Añade un nuevo servicio al catálogo del negocio.</p>
              </div>
            </div>

            <form class="service-form" @submit.prevent="handleCreateService">
              <div class="field">
                <label for="service-name"> Nombre </label>

                <input
                  id="service-name"
                  v-model="serviceName"
                  type="text"
                  required
                  placeholder="Ej. Corte de pelo" />
              </div>

              <div class="field field-description">
                <label for="service-description"> Descripción </label>

                <input
                  id="service-description"
                  v-model="serviceDescription"
                  type="text"
                  placeholder="Descripción breve del servicio" />
              </div>

              <div class="field">
                <label for="service-price"> Precio </label>

                <div class="input-suffix">
                  <input
                    id="service-price"
                    v-model="servicePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="15" />

                  <span>€</span>
                </div>
              </div>

              <div class="field">
                <label for="service-duration"> Duración </label>

                <div class="input-suffix">
                  <input
                    id="service-duration"
                    v-model="serviceDuration"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="30" />

                  <span>min</span>
                </div>
              </div>

              <button
                type="submit"
                class="button button-primary add-service-button"
                :disabled="serviceLoading">
                {{ serviceLoading ? "Añadiendo..." : "Añadir" }}
              </button>
            </form>

            <p v-if="serviceError" class="form-message error service-error">
              {{ serviceError }}
            </p>
          </div>

          <!-- EMPTY -->

          <div v-if="services.length === 0" class="empty-services">
            <div class="empty-icon">✦</div>

            <h3>Aún no tienes servicios</h3>

            <p>Añade tu primer servicio para que tu agente pueda informar a tus clientes.</p>
          </div>

          <!-- SERVICES LIST -->

          <div v-else class="services-panel">
            <div class="services-table-header">
              <span>Servicio</span>
              <span>Precio</span>
              <span>Duración</span>
              <span>Acciones</span>
            </div>

            <article
              v-for="service in services"
              :key="service.id"
              class="service-row"
              :class="{
                editing: editingServiceId === service.id,
              }">
              <!-- EDIT -->

              <template v-if="editingServiceId === service.id">
                <form class="service-edit-form" @submit.prevent="handleUpdateService">
                  <div class="edit-main">
                    <div class="field">
                      <label :for="`edit-name-${service.id}`"> Nombre </label>

                      <input :id="`edit-name-${service.id}`" v-model="editServiceName" type="text" required />
                    </div>

                    <div class="field">
                      <label :for="`edit-description-${service.id}`"> Descripción </label>

                      <textarea
                        :id="`edit-description-${service.id}`"
                        v-model="editServiceDescription"
                        rows="3"></textarea>
                    </div>
                  </div>

                  <div class="edit-meta">
                    <div class="field">
                      <label :for="`edit-price-${service.id}`"> Precio </label>

                      <div class="input-suffix">
                        <input
                          :id="`edit-price-${service.id}`"
                          v-model="editServicePrice"
                          type="number"
                          min="0"
                          step="0.01" />

                        <span>€</span>
                      </div>
                    </div>

                    <div class="field">
                      <label :for="`edit-duration-${service.id}`"> Duración </label>

                      <div class="input-suffix">
                        <input
                          :id="`edit-duration-${service.id}`"
                          v-model="editServiceDuration"
                          type="number"
                          min="1"
                          step="1" />

                        <span>min</span>
                      </div>
                    </div>
                  </div>

                  <div class="edit-actions">
                    <button
                      type="submit"
                      class="button button-primary button-small"
                      :disabled="updateServiceLoading">
                      {{ updateServiceLoading ? "Guardando..." : "Guardar" }}
                    </button>

                    <button
                      type="button"
                      class="button button-secondary button-small"
                      :disabled="updateServiceLoading"
                      @click="cancelEditingService">
                      Cancelar
                    </button>
                  </div>
                </form>
              </template>

              <!-- NORMAL -->

              <template v-else>
                <div class="service-main">
                  <div class="service-icon">✦</div>

                  <div>
                    <strong>{{ service.name }}</strong>

                    <p>
                      {{ service.description || "Sin descripción" }}
                    </p>
                  </div>
                </div>

                <div class="service-value">
                  <strong v-if="service.price !== null"> {{ service.price }} € </strong>

                  <span v-else>—</span>
                </div>

                <div class="service-value">
                  <strong v-if="service.duration_minutes !== null">
                    {{ service.duration_minutes }} min
                  </strong>

                  <span v-else>—</span>
                </div>

                <div class="service-actions">
                  <button type="button" class="table-action" @click="startEditingService(service)">
                    Editar
                  </button>

                  <button
                    type="button"
                    class="table-action danger"
                    :disabled="deletingServiceId === service.id"
                    @click="handleDeleteService(service.id)">
                    {{ deletingServiceId === service.id ? "Eliminando..." : "Eliminar" }}
                  </button>
                </div>
              </template>
            </article>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.business-detail-page {
  min-height: 100vh;
  padding: 34px 48px 80px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

/* BREADCRUMB */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-bottom: 25px;

  color: var(--text-muted);

  font-size: 11px;
}

.breadcrumb a {
  color: var(--text-secondary);
  font-weight: 500;
  text-decoration: none;
}

.breadcrumb a:hover {
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

.business-heading {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 16px;
}

.business-avatar {
  width: 54px;
  height: 54px;

  flex: 0 0 54px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 14px;

  background: #0f172a;
  color: white;

  font-size: 20px;
  font-weight: 700;

  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.12);
}

.heading-meta {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 4px;

  color: #16a34a;

  font-size: 10px;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.business-heading h1 {
  margin: 0;

  color: var(--text);

  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.business-heading p {
  max-width: 620px;

  margin: 5px 0 0;

  overflow: hidden;

  color: var(--text-secondary);

  font-size: 12px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary-action {
  min-height: 40px;

  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 15px;

  border-radius: 8px;

  background: var(--primary);
  color: white;

  font-size: 12px;
  font-weight: 600;

  text-decoration: none;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);

  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.primary-action:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* BUSINESS NAVIGATION */

.business-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;

  margin-bottom: 42px;
  padding: 15px 18px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.business-nav-info {
  display: flex;
  align-items: center;
  gap: 22px;
}

.nav-label {
  color: var(--text-muted);

  font-size: 10px;
  font-weight: 600;
}

.business-links {
  display: flex;
  align-items: center;
  gap: 3px;
}

.business-link {
  padding: 7px 10px;

  border-radius: 7px;

  color: var(--text-secondary);

  font-size: 11px;
  font-weight: 500;

  text-decoration: none;
}

.business-link:hover,
.business-link.active {
  background: var(--surface-soft);
  color: var(--text);
}

.business-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-link {
  min-width: 175px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 8px 10px;

  border: 1px solid var(--border);
  border-radius: 9px;

  color: var(--text);

  text-decoration: none;

  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.action-link:hover {
  border-color: #cbd5e1;
  background: var(--surface-soft);
}

.action-icon {
  width: 27px;
  height: 27px;

  flex: 0 0 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: var(--primary-soft);
  color: var(--primary);
}

.action-link div {
  min-width: 0;

  display: flex;
  flex-direction: column;
}

.action-link strong {
  font-size: 10px;
}

.action-link small {
  margin-top: 1px;

  color: var(--text-muted);

  font-size: 8px;
}

.action-link .arrow {
  margin-left: auto;

  color: var(--text-muted);

  font-size: 13px;
}

/* SECTIONS */

.content-section {
  scroll-margin-top: 25px;

  margin-bottom: 46px;
}

.section-heading {
  margin-bottom: 16px;
}

.section-heading-action {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.eyebrow {
  display: block;

  margin-bottom: 5px;

  color: var(--primary);

  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.section-heading h2 {
  margin: 0;

  color: var(--text);

  font-size: 19px;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.section-heading p {
  margin: 4px 0 0;

  color: var(--text-secondary);

  font-size: 11px;
}

.section-badge {
  padding: 5px 9px;

  border: 1px solid var(--border);
  border-radius: 999px;

  background: var(--surface);
  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 600;
}

/* GENERAL */

.info-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.info-row {
  min-height: 70px;

  display: flex;
  align-items: center;
  gap: 13px;

  padding: 14px 17px;
}

.info-icon {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background: var(--surface-soft);
  color: var(--text-secondary);

  font-size: 14px;
}

.info-content {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-content span {
  color: var(--text-muted);

  font-size: 9px;
  font-weight: 500;
}

.info-content strong {
  overflow: hidden;

  color: var(--text);

  font-size: 12px;
  font-weight: 600;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.configuration-state {
  margin-left: auto;

  padding: 4px 7px;

  border-radius: 999px;

  background: #ecfdf3;
  color: #16a34a;

  font-size: 8px;
  font-weight: 600;
}

.configuration-state.empty {
  background: #f8fafc;
  color: var(--text-muted);
}

.info-divider {
  height: 1px;

  margin-left: 64px;

  background: var(--border);
}

/* HOURS */

.hours-panel {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.hours-header {
  display: grid;
  grid-template-columns: 1fr 150px minmax(330px, 1.4fr) 120px;
  gap: 15px;

  padding: 10px 17px;

  border-bottom: 1px solid var(--border);

  background: var(--surface-soft);
  color: var(--text-muted);

  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hours-list {
  display: flex;
  flex-direction: column;
}

.hours-row {
  min-height: 68px;

  display: grid;
  grid-template-columns: 1fr 150px minmax(330px, 1.4fr) 120px;
  align-items: center;
  gap: 15px;

  padding: 10px 17px;

  border-bottom: 1px solid var(--border);
}

.hours-row:last-child {
  border-bottom: 0;
}

.hours-row.closed {
  background: #fcfcfd;
}

.day-name strong {
  color: var(--text);

  font-size: 11px;
  font-weight: 600;
}

.day-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-status {
  color: #16a34a;

  font-size: 9px;
  font-weight: 600;
}

.day-status.closed {
  color: var(--text-muted);
}

.switch {
  position: relative;

  width: 34px;
  height: 19px;

  flex: 0 0 34px;

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

  width: 13px;
  height: 13px;

  border-radius: 50%;

  background: white;

  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);

  transition: 0.2s ease;
}

.switch input:checked + .switch-slider {
  background: var(--primary);
}

.switch input:checked + .switch-slider::after {
  transform: translateX(15px);
}

.day-hours {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.time-group {
  display: flex;
  align-items: center;
  gap: 7px;
}

.time-group > span {
  color: var(--text-muted);

  font-size: 10px;
}

.time-group input {
  width: 100px;
  min-height: 34px;

  box-sizing: border-box;

  padding: 0 8px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text);

  font: inherit;
  font-size: 10px;

  outline: none;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.time-group input:focus {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.second-time {
  padding-top: 5px;

  border-top: 1px dashed var(--border);
}

.closed-hours {
  color: var(--text-muted);

  font-size: 10px;
}

.period-button {
  justify-self: start;

  padding: 5px 7px;

  border: 0;
  border-radius: 6px;

  background: transparent;
  color: var(--primary);

  font: inherit;
  font-size: 9px;
  font-weight: 600;

  cursor: pointer;
}

.period-button:hover {
  background: var(--primary-soft);
}

.panel-footer {
  min-height: 62px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 11px 17px;

  border-top: 1px solid var(--border);

  background: #fcfcfd;
}

/* SERVICES */

.create-service-panel {
  margin-bottom: 15px;
  padding: 17px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.create-heading {
  display: flex;
  align-items: center;
  gap: 10px;

  margin-bottom: 16px;
}

.create-icon {
  width: 31px;
  height: 31px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 16px;
}

.create-heading h3 {
  margin: 0;

  color: var(--text);

  font-size: 12px;
}

.create-heading p {
  margin: 2px 0 0;

  color: var(--text-muted);

  font-size: 9px;
}

.service-form {
  display: grid;
  grid-template-columns:
    1.2fr
    minmax(180px, 2fr)
    0.7fr
    0.7fr
    auto;
  align-items: end;
  gap: 10px;
}

.field {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field label {
  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 600;
}

.field input,
.field textarea {
  width: 100%;

  box-sizing: border-box;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text);

  font: inherit;
  font-size: 10px;

  outline: none;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.field input {
  min-height: 36px;

  padding: 0 9px;
}

.field textarea {
  padding: 9px;

  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.field input::placeholder,
.field textarea::placeholder {
  color: #98a2b3;
}

.input-suffix {
  position: relative;
}

.input-suffix input {
  padding-right: 37px;
}

.input-suffix > span {
  position: absolute;
  top: 50%;
  right: 9px;

  transform: translateY(-50%);

  color: var(--text-muted);

  font-size: 9px;

  pointer-events: none;
}

.add-service-button {
  min-width: 76px;
}

.services-panel {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.services-table-header {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 120px 120px 150px;
  gap: 15px;

  padding: 10px 17px;

  border-bottom: 1px solid var(--border);

  background: var(--surface-soft);
  color: var(--text-muted);

  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.service-row {
  min-height: 73px;

  display: grid;
  grid-template-columns: minmax(260px, 1fr) 120px 120px 150px;
  align-items: center;
  gap: 15px;

  padding: 11px 17px;

  border-bottom: 1px solid var(--border);

  transition: background 0.15s ease;
}

.service-row:last-child {
  border-bottom: 0;
}

.service-row:not(.editing):hover {
  background: #fcfcfd;
}

.service-row.editing {
  display: block;

  padding: 17px;

  background: #fcfcfd;
}

.service-main {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 11px;
}

.service-icon {
  width: 33px;
  height: 33px;

  flex: 0 0 33px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 12px;
}

.service-main > div {
  min-width: 0;
}

.service-main strong {
  display: block;

  margin-bottom: 3px;

  overflow: hidden;

  color: var(--text);

  font-size: 11px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-main p {
  margin: 0;

  overflow: hidden;

  color: var(--text-muted);

  font-size: 9px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-value strong {
  color: var(--text);

  font-size: 10px;
  font-weight: 600;
}

.service-value > span {
  color: var(--text-muted);

  font-size: 10px;
}

.service-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.table-action {
  padding: 6px 8px;

  border: 1px solid var(--border);
  border-radius: 6px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 9px;
  font-weight: 500;

  cursor: pointer;
}

.table-action:hover:not(:disabled) {
  border-color: #cbd5e1;

  background: var(--surface-soft);
  color: var(--text);
}

.table-action.danger {
  color: var(--danger);
}

.table-action.danger:hover:not(:disabled) {
  border-color: #fecaca;

  background: var(--danger-soft);
}

.table-action:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}

/* EDIT SERVICE */

.service-edit-form {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 260px auto;
  align-items: end;
  gap: 16px;
}

.edit-main {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 10px;
}

.edit-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.edit-actions {
  display: flex;
  gap: 6px;
}

/* BUTTONS */

.button {
  min-height: 36px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 12px;

  border: 1px solid transparent;
  border-radius: 7px;

  font: inherit;
  font-size: 10px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.button-primary {
  background: var(--primary);
  color: white;

  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.16);
}

.button-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.button-secondary {
  border-color: var(--border);

  background: white;
  color: var(--text-secondary);
}

.button-secondary:hover:not(:disabled) {
  background: var(--surface-soft);
  color: var(--text);
}

.button-small {
  min-height: 34px;

  padding: 0 10px;
}

.button:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}

/* MESSAGES */

.form-message {
  margin: 0;

  font-size: 10px;
  font-weight: 500;
}

.form-message.error {
  color: var(--danger);
}

.form-message.success {
  color: #16a34a;
}

.service-error {
  margin-top: 10px;
}

.alert {
  padding: 12px 14px;

  border-radius: 9px;

  font-size: 11px;
}

.alert-error {
  border: 1px solid #fecaca;

  background: var(--danger-soft);
  color: var(--danger);
}

/* EMPTY */

.empty-services {
  padding: 45px 20px;

  border: 1px dashed #d0d5dd;
  border-radius: 13px;

  background: var(--surface);

  text-align: center;
}

.empty-icon {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin: 0 auto 11px;

  border-radius: 10px;

  background: var(--primary-soft);
  color: var(--primary);
}

.empty-services h3 {
  margin: 0;

  color: var(--text);

  font-size: 12px;
}

.empty-services p {
  max-width: 400px;

  margin: 5px auto 0;

  color: var(--text-muted);

  font-size: 10px;
  line-height: 1.5;
}

/* STATES */

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

  font-size: 16px;
}

.page-state p {
  margin: 0 0 15px;

  color: var(--text-secondary);

  font-size: 11px;
}

.state-icon {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-weight: 700;
}

.error-icon {
  background: var(--danger-soft);
  color: var(--danger);
}

.inline-state {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 20px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);
  color: var(--text-secondary);

  font-size: 10px;
}

.spinner {
  width: 22px;
  height: 22px;

  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

.spinner-small {
  width: 15px;
  height: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .business-navigation {
    align-items: stretch;
    flex-direction: column;
  }

  .business-navigation,
  .business-nav-info {
    align-items: flex-start;
  }

  .hours-header,
  .hours-row {
    grid-template-columns: 120px 130px 1fr 110px;
  }

  .service-form {
    grid-template-columns: repeat(2, 1fr);
  }

  .field-description {
    grid-column: span 2;
  }

  .add-service-button {
    grid-column: span 2;
  }

  .service-edit-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .business-detail-page {
    padding: 30px 32px 60px;
  }

  .hours-header {
    display: none;
  }

  .hours-row {
    grid-template-columns: 120px 1fr;
    gap: 10px;

    padding: 14px;
  }

  .day-hours,
  .closed-hours {
    grid-column: 1 / -1;
  }

  .period-button {
    grid-column: 1 / -1;
  }

  .services-table-header {
    display: none;
  }

  .service-row {
    grid-template-columns: 1fr auto auto;
  }

  .service-main {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .business-detail-page {
    padding: 24px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .primary-action {
    width: 100%;
  }

  .business-heading {
    align-items: flex-start;
  }

  .business-heading p {
    white-space: normal;
  }

  .business-navigation {
    margin-bottom: 34px;
  }

  .business-nav-info {
    width: 100%;

    flex-direction: column;
    gap: 10px;
  }

  .business-links {
    width: 100%;

    overflow-x: auto;
  }

  .business-actions {
    width: 100%;

    flex-direction: column;
  }

  .action-link {
    width: 100%;

    box-sizing: border-box;
  }

  .section-heading-action {
    align-items: flex-start;
    flex-direction: column;
  }

  .service-form {
    grid-template-columns: 1fr;
  }

  .field-description,
  .add-service-button {
    grid-column: auto;
  }

  .add-service-button {
    width: 100%;
  }

  .service-row {
    grid-template-columns: 1fr 1fr;

    gap: 12px;
  }

  .service-main,
  .service-actions {
    grid-column: 1 / -1;
  }

  .edit-main,
  .edit-meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .business-avatar {
    width: 46px;
    height: 46px;

    flex-basis: 46px;

    border-radius: 12px;
  }

  .business-heading h1 {
    font-size: 24px;
  }

  .info-row {
    align-items: flex-start;
  }

  .configuration-state {
    display: none;
  }

  .hours-row {
    grid-template-columns: 1fr;
  }

  .day-hours,
  .closed-hours,
  .period-button {
    grid-column: auto;
  }

  .time-group {
    width: 100%;
  }

  .time-group input {
    flex: 1;

    width: auto;
  }

  .panel-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .panel-footer .button {
    width: 100%;
  }

  .service-row {
    grid-template-columns: 1fr;
  }

  .service-main,
  .service-actions {
    grid-column: auto;
  }
}

/* =========================
   BUSINESS DETAIL TYPOGRAPHY FIX
========================= */

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  font-size: 13px;
}

/* =========================
   BUSINESS HEADER
========================= */

.business-avatar {
  font-size: 20px;
}

.heading-meta {
  font-size: 12px;
}

.business-heading h1 {
  font-size: 30px;
}

.business-heading p {
  max-width: 650px;

  font-size: 14px;
  line-height: 1.55;
}

.primary-action {
  min-height: 42px;
  padding: 0 16px;

  font-size: 14px;
}

/* =========================
   BUSINESS NAVIGATION
========================= */

.nav-label {
  font-size: 12px;
}

.business-link {
  padding: 8px 11px;

  font-size: 13px;
}

/* Conversations / Leads */

.action-icon {
  width: 30px;
  height: 30px;

  flex: 0 0 30px;

  font-size: 12px;
}

.action-link strong {
  font-size: 13px;
}

.action-link small {
  margin-top: 2px;

  font-size: 11px;
}

.action-link .arrow {
  font-size: 15px;
}

/* =========================
   SECTION HEADINGS
========================= */

.eyebrow {
  font-size: 12px;
}

.section-heading h2 {
  font-size: 21px;
}

.section-heading p {
  font-size: 14px;
  line-height: 1.55;
}

.section-badge {
  padding: 5px 10px;

  font-size: 12px;
}

/* =========================
   GENERAL INFORMATION
========================= */

.info-content span {
  font-size: 11px;
}

.info-content strong {
  font-size: 14px;
}

.configuration-state {
  padding: 4px 8px;

  font-size: 11px;
}

/* =========================
   BUSINESS HOURS
========================= */

.hours-header {
  font-size: 11px;
}

.day-name strong {
  font-size: 14px;
}

.day-status {
  font-size: 12px;
}

.time-group > span {
  font-size: 12px;
}

.time-group input {
  min-height: 38px;

  padding: 0 9px;

  font-size: 13px;
}

.closed-hours {
  font-size: 13px;
}

.period-button {
  padding: 6px 8px;

  font-size: 12px;
}

/* =========================
   CREATE SERVICE
========================= */

.create-heading h3 {
  font-size: 16px;
}

.create-heading p {
  margin-top: 3px;

  font-size: 12px;
  line-height: 1.5;
}

.field label {
  font-size: 12px;
}

.field input,
.field textarea {
  font-size: 14px;
}

.field input {
  min-height: 40px;
  padding: 0 10px;
}

.field textarea {
  padding: 10px;

  line-height: 1.5;
}

.input-suffix > span {
  font-size: 12px;
}

/* =========================
   SERVICES TABLE
========================= */

.services-table-header {
  font-size: 11px;
}

.service-icon {
  width: 36px;
  height: 36px;

  flex: 0 0 36px;

  font-size: 13px;
}

.service-main strong {
  margin-bottom: 4px;

  font-size: 14px;
}

.service-main p {
  font-size: 12px;
  line-height: 1.45;
}

.service-value strong {
  font-size: 13px;
}

.service-value > span {
  font-size: 12px;
}

/* Edit / Delete */

.table-action {
  padding: 7px 9px;

  font-size: 12px;
}

/* =========================
   GENERIC BUTTONS
========================= */

.button {
  min-height: 40px;

  padding: 0 13px;

  font-size: 13px;
}

.button-small {
  min-height: 38px;

  padding: 0 11px;
}

/* =========================
   MESSAGES / ALERTS
========================= */

.form-message {
  font-size: 12px;
  line-height: 1.45;
}

.alert {
  font-size: 13px;
  line-height: 1.5;
}

/* =========================
   EMPTY SERVICES
========================= */

.empty-services h3 {
  font-size: 16px;
}

.empty-services p {
  font-size: 13px;
  line-height: 1.6;
}

/* =========================
   PAGE STATES
========================= */

.page-state h2 {
  font-size: 18px;
}

.page-state p {
  font-size: 13px;
  line-height: 1.5;
}

.inline-state {
  font-size: 13px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 760px) {
  .breadcrumb {
    font-size: 12px;
  }

  .business-heading h1 {
    font-size: 28px;
  }

  .business-heading p {
    font-size: 14px;
  }

  .primary-action {
    min-height: 44px;

    font-size: 14px;
  }

  .nav-label {
    font-size: 12px;
  }

  .business-link {
    font-size: 13px;
  }

  .action-link strong {
    font-size: 13px;
  }

  .action-link small {
    font-size: 11px;
  }

  .section-heading h2 {
    font-size: 20px;
  }

  .section-heading p {
    font-size: 13px;
  }

  .day-name strong {
    font-size: 14px;
  }

  .day-status {
    font-size: 12px;
  }

  /*
    En móvil los inputs a 16px para evitar
    el zoom automático de Safari/iPhone.
  */
  .time-group input,
  .field input,
  .field textarea {
    font-size: 16px;
  }

  .button {
    min-height: 42px;

    font-size: 14px;
  }

  .table-action {
    min-height: 38px;

    font-size: 13px;
  }
}

@media (max-width: 520px) {
  .business-heading h1 {
    font-size: 26px;
  }

  .business-heading p {
    font-size: 14px;
  }

  .info-content strong {
    font-size: 14px;
  }

  .service-main strong {
    font-size: 14px;
  }

  .service-main p {
    font-size: 12px;
  }
}
</style>
