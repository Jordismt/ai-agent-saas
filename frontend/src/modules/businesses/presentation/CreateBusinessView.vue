<script setup>
import { ref } from "vue";
import { BusinessService } from "../infrastructure/BusinessService";
import { CreateBusiness } from "../application/CreateBusiness";

const businessService = new BusinessService();
const createBusiness = new CreateBusiness(businessService);

const name = ref("");
const description = ref("");
const phone = ref("");
const address = ref("");

const loading = ref(false);
const error = ref("");
const success = ref("");

const handleSubmit = async () => {
  error.value = "";
  success.value = "";

  if (!name.value.trim()) {
    error.value = "El nombre del negocio es obligatorio.";
    return;
  }

  loading.value = true;

  try {
    await createBusiness.execute({
      name: name.value.trim(),
      description: description.value.trim() || null,
      phone: phone.value.trim() || null,
      address: address.value.trim() || null,
    });

    success.value = "Negocio creado correctamente.";

    name.value = "";
    description.value = "";
    phone.value = "";
    address.value = "";
  } catch (err) {
    error.value = err.response?.data?.message || "No se ha podido crear el negocio.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main>
    <h1>Crear negocio</h1>

    <form @submit.prevent="handleSubmit">
      <div>
        <label for="name">Nombre</label>
        <input id="name" v-model="name" type="text" required placeholder="Peluquería Laura" />
      </div>

      <div>
        <label for="description">Descripción</label>
        <textarea id="description" v-model="description" placeholder="Peluquería y barbería" />
      </div>

      <div>
        <label for="phone">Teléfono</label>
        <input id="phone" v-model="phone" type="tel" placeholder="600000000" />
      </div>

      <div>
        <label for="address">Dirección</label>
        <input id="address" v-model="address" type="text" placeholder="Calle Mayor 10" />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Creando..." : "Crear negocio" }}
      </button>

      <p v-if="error">
        {{ error }}
      </p>

      <p v-if="success">
        {{ success }}
      </p>
    </form>
  </main>
</template>
