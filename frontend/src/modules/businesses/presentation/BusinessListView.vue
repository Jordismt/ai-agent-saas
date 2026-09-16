<script setup>
import { onMounted, ref } from "vue";
import { BusinessService } from "../infrastructure/BusinessService.js";
import { GetBusinesses } from "../application/GetBusinesses.js";

const businessService = new BusinessService();
const getBusinesses = new GetBusinesses(businessService);

const businesses = ref([]);
const loading = ref(true);
const error = ref("");

const loadBusinesses = async () => {
  loading.value = true;
  error.value = "";

  try {
    businesses.value = await getBusinesses.execute();
  } catch (err) {
    error.value = err.message || "No se han podido cargar los negocios.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadBusinesses);
</script>

<template>
  <main>
    <h1>Mis negocios</h1>

    <p v-if="loading">Cargando negocios...</p>

    <p v-else-if="error">
      {{ error }}
    </p>

    <p v-else-if="businesses.length === 0">Todavía no tienes ningún negocio.</p>

    <div v-else>
      <article v-for="business in businesses" :key="business.id">
        <h2>{{ business.name }}</h2>

        <p v-if="business.description">
          {{ business.description }}
        </p>

        <p v-if="business.phone">
          {{ business.phone }}
        </p>

        <p v-if="business.address">
          {{ business.address }}
        </p>

        <RouterLink :to="`/businesses/${business.id}`"> Ver negocio </RouterLink>
      </article>
    </div>
  </main>
</template>
