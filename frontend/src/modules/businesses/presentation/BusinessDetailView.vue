<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { BusinessService } from "../infrastructure/BusinessService.js";
import { GetBusinessById } from "../application/GetBusinessById.js";
import { GetBusinessServices } from "../application/GetBusinessServices.js";
import { CreateBusinessService } from "../application/CreateBusinessService.js";
import { DeleteBusinessService } from "../application/DeleteBusinessService.js";
import { UpdateBusinessService } from "../application/UpdateBusinessService.js";

const route = useRoute();

const businessService = new BusinessService();

const getBusinessById = new GetBusinessById(businessService);
const getBusinessServices = new GetBusinessServices(businessService);
const createBusinessService = new CreateBusinessService(businessService);
const deleteBusinessService = new DeleteBusinessService(businessService);
const updateBusinessService = new UpdateBusinessService(businessService);

const business = ref(null);
const services = ref([]);

const loading = ref(true);
const error = ref("");

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
};

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
  <main>
    <RouterLink to="/businesses"> ← Volver a mis negocios </RouterLink>

    <h1>Detalle del negocio</h1>

    <p v-if="loading">Cargando negocio...</p>

    <p v-else-if="error">
      {{ error }}
    </p>

    <div v-else-if="business">
      <h2>{{ business.name }}</h2>

      <p v-if="business.description">
        {{ business.description }}
      </p>

      <p v-if="business.phone">Teléfono: {{ business.phone }}</p>

      <p v-if="business.address">Dirección: {{ business.address }}</p>

      <section>
        <h2>Servicios</h2>

        <form @submit.prevent="handleCreateService">
          <div>
            <label for="service-name"> Nombre </label>

            <input id="service-name" v-model="serviceName" type="text" required placeholder="Corte de pelo" />
          </div>

          <div>
            <label for="service-description"> Descripción </label>

            <textarea
              id="service-description"
              v-model="serviceDescription"
              placeholder="Corte de pelo clásico" />
          </div>

          <div>
            <label for="service-price"> Precio </label>

            <input
              id="service-price"
              v-model="servicePrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="15" />
          </div>

          <div>
            <label for="service-duration"> Duración (minutos) </label>

            <input
              id="service-duration"
              v-model="serviceDuration"
              type="number"
              min="1"
              step="1"
              placeholder="30" />
          </div>

          <button type="submit" :disabled="serviceLoading">
            {{ serviceLoading ? "Creando..." : "Añadir servicio" }}
          </button>

          <p v-if="serviceError">
            {{ serviceError }}
          </p>
        </form>

        <p v-if="services.length === 0">Este negocio todavía no tiene servicios.</p>

        <div v-else>
          <article v-for="service in services" :key="service.id">
            <template v-if="editingServiceId === service.id">
              <h3>Editar servicio</h3>

              <form @submit.prevent="handleUpdateService">
                <div>
                  <label :for="`edit-name-${service.id}`"> Nombre </label>

                  <input :id="`edit-name-${service.id}`" v-model="editServiceName" type="text" required />
                </div>

                <div>
                  <label :for="`edit-description-${service.id}`"> Descripción </label>

                  <textarea :id="`edit-description-${service.id}`" v-model="editServiceDescription" />
                </div>

                <div>
                  <label :for="`edit-price-${service.id}`"> Precio </label>

                  <input
                    :id="`edit-price-${service.id}`"
                    v-model="editServicePrice"
                    type="number"
                    min="0"
                    step="0.01" />
                </div>

                <div>
                  <label :for="`edit-duration-${service.id}`"> Duración (minutos) </label>

                  <input
                    :id="`edit-duration-${service.id}`"
                    v-model="editServiceDuration"
                    type="number"
                    min="1"
                    step="1" />
                </div>

                <button type="submit" :disabled="updateServiceLoading">
                  {{ updateServiceLoading ? "Guardando..." : "Guardar cambios" }}
                </button>

                <button type="button" :disabled="updateServiceLoading" @click="cancelEditingService">
                  Cancelar
                </button>
              </form>
            </template>

            <template v-else>
              <h3>{{ service.name }}</h3>

              <p v-if="service.description">
                {{ service.description }}
              </p>

              <p v-if="service.price !== null">Precio: {{ service.price }} €</p>

              <p v-if="service.duration_minutes !== null">
                Duración:
                {{ service.duration_minutes }} minutos
              </p>

              <button type="button" @click="startEditingService(service)">Editar</button>

              <button
                type="button"
                :disabled="deletingServiceId === service.id"
                @click="handleDeleteService(service.id)">
                {{ deletingServiceId === service.id ? "Eliminando..." : "Eliminar" }}
              </button>
            </template>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
