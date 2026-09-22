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
  <main class="business-page">
    <div class="page-shell">
      <!-- =========================
           NAVEGACIÓN
      ========================== -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> ← Mis negocios </RouterLink>

        <span>/</span>

        <span>
          {{ business?.name || "Detalle del negocio" }}
        </span>
      </nav>

      <!-- =========================
           LOADING
      ========================== -->

      <div v-if="loading" class="state-card">
        <div class="spinner"></div>

        <p>Cargando negocio...</p>
      </div>

      <!-- =========================
           ERROR
      ========================== -->

      <div v-else-if="error" class="state-card error-state">
        <div class="state-icon">!</div>

        <h2>No se ha podido cargar el negocio</h2>

        <p>{{ error }}</p>

        <button type="button" class="button button-primary" @click="loadBusiness">Reintentar</button>
      </div>

      <div v-else-if="business">
        <!-- =========================
             HEADER
        ========================== -->

        <header class="business-header">
          <div class="business-header-content">
            <div class="business-icon">
              {{ business.name?.charAt(0)?.toUpperCase() }}
            </div>

            <div class="business-title">
              <span class="eyebrow"> Negocio </span>

              <h1>
                {{ business.name }}
              </h1>

              <p v-if="business.description">
                {{ business.description }}
              </p>
            </div>
          </div>

          <div class="header-actions">
            <RouterLink class="button button-secondary" :to="`/businesses/${route.params.id}/agent-config`">
              <span>✦</span>
              Configurar agente
            </RouterLink>
            <RouterLink class="button button-secondary" :to="`/businesses/${route.params.id}/leads`">
              Ver leads
            </RouterLink>
            <RouterLink class="button button-secondary" :to="`/businesses/${route.params.id}/conversations`">
              Ver conversaciones
            </RouterLink>
          </div>
        </header>

        <!-- =========================
             INFO
        ========================== -->

        <section class="section">
          <div class="section-heading">
            <div>
              <span class="section-eyebrow"> Información </span>

              <h2>Datos del negocio</h2>

              <p>Información que utilizará tu asistente virtual.</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <span class="info-label"> Teléfono </span>

              <strong>
                {{ business.phone || "No configurado" }}
              </strong>
            </div>

            <div class="info-card">
              <span class="info-label"> Dirección </span>

              <strong>
                {{ business.address || "No configurada" }}
              </strong>
            </div>
          </div>
        </section>

        <!-- =========================
             HORARIOS
        ========================== -->

        <section class="section">
          <div class="section-heading">
            <div>
              <span class="section-eyebrow"> Disponibilidad </span>

              <h2>Horarios</h2>

              <p>Define cuándo está abierto tu negocio.</p>
            </div>
          </div>

          <div v-if="hoursLoading" class="loading-inline">
            <div class="spinner small"></div>
            <span>Cargando horarios...</span>
          </div>

          <div v-else-if="hoursError" class="inline-error">
            {{ hoursError }}
          </div>

          <form v-else class="hours-form" @submit.prevent="handleSaveHours">
            <div class="hours-grid">
              <article
                v-for="day in editingHours"
                :key="day.dayOfWeek"
                class="day-card"
                :class="{
                  closed: day.isClosed,
                }">
                <div class="day-header">
                  <div>
                    <h3>
                      {{ dayNames[day.dayOfWeek] }}
                    </h3>

                    <span
                      class="day-status"
                      :class="{
                        closed: day.isClosed,
                      }">
                      {{ day.isClosed ? "Cerrado" : "Abierto" }}
                    </span>
                  </div>

                  <label class="switch">
                    <input v-model="day.isClosed" type="checkbox" @change="handleToggleClosed(day)" />

                    <span class="switch-slider"></span>
                  </label>
                </div>

                <div v-if="!day.isClosed" class="time-fields">
                  <div class="time-field">
                    <label :for="`open-${day.dayOfWeek}`"> Apertura </label>

                    <input :id="`open-${day.dayOfWeek}`" v-model="day.openTime" type="time" />
                  </div>

                  <span class="time-separator"> — </span>

                  <div class="time-field">
                    <label :for="`close-${day.dayOfWeek}`"> Cierre </label>

                    <input :id="`close-${day.dayOfWeek}`" v-model="day.closeTime" type="time" />
                  </div>
                </div>

                <div v-if="!day.isClosed" class="second-period">
                  <button type="button" class="text-button" @click="toggleSecondPeriod(day)">
                    {{ hasSecondPeriod(day) ? "− Eliminar segundo horario" : "+ Añadir segundo horario" }}
                  </button>

                  <div v-if="hasSecondPeriod(day)" class="time-fields second">
                    <div class="time-field">
                      <label :for="`second-open-${day.dayOfWeek}`"> Apertura </label>

                      <input :id="`second-open-${day.dayOfWeek}`" v-model="day.secondOpenTime" type="time" />
                    </div>

                    <span class="time-separator"> — </span>

                    <div class="time-field">
                      <label :for="`second-close-${day.dayOfWeek}`"> Cierre </label>

                      <input
                        :id="`second-close-${day.dayOfWeek}`"
                        v-model="day.secondCloseTime"
                        type="time" />
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div class="form-footer">
              <div>
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

        <!-- =========================
             SERVICIOS
        ========================== -->

        <section class="section">
          <div class="section-heading">
            <div>
              <span class="section-eyebrow"> Catálogo </span>

              <h2>Servicios</h2>

              <p>Estos son los servicios que podrá consultar tu asistente.</p>
            </div>

            <span class="count-badge">
              {{ services.length }}
              {{ services.length === 1 ? "servicio" : "servicios" }}
            </span>
          </div>

          <!-- CREAR SERVICIO -->

          <div class="create-service-card">
            <div class="create-service-header">
              <div class="plus-icon">+</div>

              <div>
                <h3>Añadir servicio</h3>

                <p>Añade un nuevo servicio a tu negocio.</p>
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
                  placeholder="Corte de pelo" />
              </div>

              <div class="field field-wide">
                <label for="service-description"> Descripción </label>

                <input
                  id="service-description"
                  v-model="serviceDescription"
                  type="text"
                  placeholder="Corte de pelo clásico" />
              </div>

              <div class="field">
                <label for="service-price"> Precio </label>

                <div class="input-with-suffix">
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

                <div class="input-with-suffix">
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

              <button type="submit" class="button button-primary" :disabled="serviceLoading">
                {{ serviceLoading ? "Añadiendo..." : "Añadir servicio" }}
              </button>
            </form>

            <p v-if="serviceError" class="form-message error">
              {{ serviceError }}
            </p>
          </div>

          <!-- LISTA SERVICIOS -->

          <div v-if="services.length === 0" class="empty-card">
            <div class="empty-icon">✦</div>

            <h3>Aún no tienes servicios</h3>

            <p>Añade tu primer servicio para que el asistente pueda informar a tus clientes.</p>
          </div>

          <div v-else class="services-grid">
            <article v-for="service in services" :key="service.id" class="service-card">
              <!-- EDITANDO -->

              <template v-if="editingServiceId === service.id">
                <div class="service-card-header">
                  <div>
                    <span class="section-eyebrow"> Editando </span>

                    <h3>
                      {{ service.name }}
                    </h3>
                  </div>
                </div>

                <form class="edit-service-form" @submit.prevent="handleUpdateService">
                  <div class="field">
                    <label :for="`edit-name-${service.id}`"> Nombre </label>

                    <input :id="`edit-name-${service.id}`" v-model="editServiceName" type="text" required />
                  </div>

                  <div class="field">
                    <label :for="`edit-description-${service.id}`"> Descripción </label>

                    <textarea
                      :id="`edit-description-${service.id}`"
                      v-model="editServiceDescription"
                      rows="3" />
                  </div>

                  <div class="edit-grid">
                    <div class="field">
                      <label :for="`edit-price-${service.id}`"> Precio </label>

                      <div class="input-with-suffix">
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

                      <div class="input-with-suffix">
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
                    <button type="submit" class="button button-primary" :disabled="updateServiceLoading">
                      {{ updateServiceLoading ? "Guardando..." : "Guardar cambios" }}
                    </button>

                    <button
                      type="button"
                      class="button button-secondary"
                      :disabled="updateServiceLoading"
                      @click="cancelEditingService">
                      Cancelar
                    </button>
                  </div>
                </form>
              </template>

              <!-- NORMAL -->

              <template v-else>
                <div class="service-card-header">
                  <div class="service-icon">✦</div>

                  <div class="service-title">
                    <h3>
                      {{ service.name }}
                    </h3>

                    <span v-if="service.duration_minutes !== null">
                      {{ service.duration_minutes }}
                      min
                    </span>
                  </div>
                </div>

                <p v-if="service.description" class="service-description">
                  {{ service.description }}
                </p>

                <div class="service-meta">
                  <div v-if="service.price !== null" class="service-price">
                    <span>Precio</span>

                    <strong> {{ service.price }} € </strong>
                  </div>

                  <div v-if="service.duration_minutes !== null" class="service-duration">
                    <span>Duración</span>

                    <strong>
                      {{ service.duration_minutes }}
                      min
                    </strong>
                  </div>
                </div>

                <div class="service-actions">
                  <button
                    type="button"
                    class="button button-secondary button-small"
                    @click="startEditingService(service)">
                    Editar
                  </button>

                  <button
                    type="button"
                    class="button button-danger button-small"
                    :disabled="deletingServiceId === service.id"
                    @click="handleDeleteService(service.id)">
                    {{ deletingServiceId === service.id ? "Eliminando..." : "Eliminar" }}
                  </button>
                </div>
              </template>
            </article>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.business-page {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.06), transparent 32%), #f8fafc;
  color: #0f172a;
}

.page-shell {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 32px 0 80px;
}

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  color: #94a3b8;
  font-size: 14px;
}

.breadcrumb a {
  color: #475569;
  text-decoration: none;
  font-weight: 600;
}

.breadcrumb a:hover {
  color: #0f172a;
}

/* =========================
   HEADER
========================= */

.business-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 48px;
  padding: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.business-header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.business-icon {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #0f172a;
  color: white;
  font-size: 25px;
  font-weight: 700;
}

.business-title h1 {
  margin: 4px 0 6px;
  font-size: 32px;
  letter-spacing: -0.03em;
}

.business-title p {
  margin: 0;
  color: #64748b;
}

.eyebrow,
.section-eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.header-actions {
  flex-shrink: 0;
}

/* =========================
   BUTTONS
========================= */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 11px;
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: #0f172a;
  color: white;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.button-primary:hover:not(:disabled) {
  background: #1e293b;
}

.button-secondary {
  background: white;
  color: #0f172a;
  border-color: #dbe2ea;
}

.button-secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.button-danger {
  background: white;
  color: #dc2626;
  border-color: #fecaca;
}

.button-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.button-small {
  min-height: 36px;
  padding: 0 12px;
  font-size: 13px;
}

/* =========================
   SECTIONS
========================= */

.section {
  margin-bottom: 52px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 6px 0 6px;
  font-size: 23px;
  letter-spacing: -0.025em;
}

.section-heading p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.count-badge {
  padding: 7px 11px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

/* =========================
   INFO
========================= */

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-card {
  padding: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}

.info-label {
  display: block;
  margin-bottom: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info-card strong {
  font-size: 15px;
  font-weight: 600;
}

/* =========================
   HORARIOS
========================= */

.hours-form {
  padding: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.day-card {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  background: #fff;
  transition: border-color 0.15s ease;
}

.day-card:not(.closed):hover {
  border-color: #cbd5e1;
}

.day-card.closed {
  background: #f8fafc;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.day-header h3 {
  margin: 0 0 5px;
  font-size: 15px;
}

.day-status {
  display: inline-flex;
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
}

.day-status.closed {
  color: #94a3b8;
}

.switch {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
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
  background: #cbd5e1;
  transition: 0.2s ease;
}

.switch-slider::after {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  top: 3px;
  left: 3px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: 0.2s ease;
}

.switch input:checked + .switch-slider {
  background: #0f172a;
}

.switch input:checked + .switch-slider::after {
  transform: translateX(18px);
}

.time-fields {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 10px;
  margin-top: 18px;
}

.time-fields.second {
  margin-top: 12px;
}

.time-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-field label,
.field label {
  color: #475569;
  font-size: 12px;
  font-weight: 650;
}

.time-field input,
.field input,
.field textarea,
.input-with-suffix input {
  width: 100%;
  box-sizing: border-box;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid #dbe2ea;
  border-radius: 9px;
  background: white;
  color: #0f172a;
  font: inherit;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.field textarea {
  padding: 11px;
  resize: vertical;
}

.time-field input:focus,
.field input:focus,
.field textarea:focus {
  border-color: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.1);
}

.time-separator {
  padding-bottom: 11px;
  color: #94a3b8;
}

.second-period {
  margin-top: 12px;
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #475569;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.text-button:hover {
  color: #0f172a;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eef2f7;
}

.form-message {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.form-message.error {
  color: #dc2626;
}

.form-message.success {
  color: #16a34a;
}

/* =========================
   SERVICIOS
========================= */

.create-service-card {
  margin-bottom: 20px;
  padding: 22px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
}

.create-service-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.plus-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 21px;
}

.create-service-header h3 {
  margin: 0 0 3px;
  font-size: 15px;
}

.create-service-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.service-form {
  display: grid;
  grid-template-columns: 1.2fr 2fr 0.8fr 0.8fr auto;
  align-items: end;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.input-with-suffix {
  position: relative;
}

.input-with-suffix input {
  padding-right: 42px;
}

.input-with-suffix span {
  position: absolute;
  top: 50%;
  right: 11px;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 12px;
  pointer-events: none;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.service-card {
  padding: 22px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.025);
}

.service-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #f1f5f9;
  color: #475569;
}

.service-title {
  min-width: 0;
}

.service-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.service-title span {
  color: #94a3b8;
  font-size: 12px;
}

.service-description {
  min-height: 40px;
  margin: 18px 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
}

.service-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.service-price,
.service-duration {
  flex: 1;
  padding: 12px;
  border-radius: 11px;
  background: #f8fafc;
}

.service-price span,
.service-duration span {
  display: block;
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
}

.service-price strong,
.service-duration strong {
  font-size: 14px;
}

.service-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
}

.empty-card {
  padding: 50px 20px;
  text-align: center;
  background: white;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
}

.empty-icon {
  width: 46px;
  height: 46px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #f1f5f9;
}

.empty-card h3 {
  margin: 0 0 7px;
  font-size: 16px;
}

.empty-card p {
  max-width: 440px;
  margin: 0 auto;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

/* =========================
   EDITAR SERVICIO
========================= */

.edit-service-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  padding-top: 6px;
}

/* =========================
   STATES
========================= */

.state-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
}

.state-card p {
  color: #64748b;
}

.error-state h2 {
  margin: 15px 0 5px;
  font-size: 20px;
}

.state-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fef2f2;
  color: #dc2626;
  font-weight: 800;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner.small {
  width: 17px;
  height: 17px;
  border-width: 2px;
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 30px;
  color: #64748b;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.inline-error {
  padding: 16px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  font-size: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 950px) {
  .service-form {
    grid-template-columns: repeat(2, 1fr);
  }

  .service-form .button {
    grid-column: span 2;
  }

  .field-wide {
    grid-column: span 2;
  }
}

@media (max-width: 760px) {
  .page-shell {
    width: min(100% - 24px, 680px);
    padding-top: 20px;
  }

  .business-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .business-header-content {
    align-items: flex-start;
  }

  .business-title h1 {
    font-size: 26px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .button {
    width: 100%;
  }

  .info-grid,
  .hours-grid,
  .services-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .service-form {
    grid-template-columns: 1fr;
  }

  .service-form .button,
  .field-wide {
    grid-column: auto;
  }

  .form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .form-footer .button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .business-header-content {
    flex-direction: column;
  }

  .business-icon {
    width: 52px;
    height: 52px;
    flex-basis: 52px;
  }

  .hours-form,
  .create-service-card,
  .service-card {
    padding: 16px;
  }

  .time-fields {
    grid-template-columns: 1fr;
  }

  .time-separator {
    display: none;
  }

  .service-meta {
    flex-direction: column;
  }

  .service-actions,
  .edit-actions {
    flex-direction: column;
  }

  .service-actions .button,
  .edit-actions .button {
    width: 100%;
  }
}
</style>
