<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { LeadService } from "../infrastructure/LeadService.js";

const route = useRoute();
const router = useRouter();

const leadService = new LeadService();

const leads = ref([]);
const loading = ref(false);
const error = ref("");

const businessId = computed(() => route.params.id);

const loadLeads = async () => {
  loading.value = true;
  error.value = "";

  try {
    leads.value = await leadService.getByBusinessId(businessId.value);
  } catch (err) {
    console.error(err);
    error.value = err.message || "No se han podido cargar los leads.";
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("es-ES");
};

const getStatusLabel = (status) => {
  const labels = {
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Cualificado",
    converted: "Convertido",
    lost: "Perdido",
  };

  return labels[status] || status;
};

const goBack = () => {
  router.push(`/businesses/${businessId.value}`);
};
const updatingLeadId = ref(null);

const handleStatusChange = async (lead, event) => {
  const newStatus = event.target.value;

  updatingLeadId.value = lead.id;
  error.value = "";

  try {
    const updatedLead = await leadService.updateStatus(lead.id, newStatus);

    const index = leads.value.findIndex((item) => item.id === lead.id);

    if (index !== -1) {
      leads.value[index] = updatedLead;
    }
  } catch (err) {
    console.error(err);
    error.value = err.message || "No se ha podido actualizar el estado.";
  } finally {
    updatingLeadId.value = null;
  }
};
onMounted(loadLeads);
</script>

<template>
  <main class="leads-page">
    <header class="page-header">
      <div>
        <button type="button" class="back-button" @click="goBack">← Volver al negocio</button>

        <h1>Leads</h1>

        <p>Clientes potenciales captados por tu agente.</p>
      </div>
    </header>

    <section class="content">
      <p v-if="loading" class="state">Cargando leads...</p>

      <p v-else-if="error" class="state error">
        {{ error }}
      </p>

      <div v-else-if="leads.length === 0" class="empty-state">
        <h2>No hay leads todavía</h2>

        <p>Cuando un cliente deje sus datos al agente, aparecerá aquí.</p>
      </div>

      <div v-else class="leads-list">
        <article v-for="lead in leads" :key="lead.id" class="lead-card">
          <div class="lead-header">
            <div>
              <h2>
                {{ lead.name || "Sin nombre" }}
              </h2>

              <select
                :value="lead.status"
                :disabled="updatingLeadId === lead.id"
                @change="handleStatusChange(lead, $event)">
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Cualificado</option>
                <option value="converted">Convertido</option>
                <option value="lost">Perdido</option>
              </select>
            </div>

            <time>
              {{ formatDate(lead.created_at) }}
            </time>
          </div>

          <div class="lead-info">
            <p v-if="lead.phone">
              <strong>Teléfono:</strong>
              {{ lead.phone }}
            </p>

            <p v-if="lead.email">
              <strong>Email:</strong>
              {{ lead.email }}
            </p>

            <p v-if="lead.notes">
              <strong>Notas:</strong>
              {{ lead.notes }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.leads-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
}

.page-header {
  margin-bottom: 32px;
}

.back-button {
  border: 0;
  background: none;
  padding: 0;
  margin-bottom: 20px;
  cursor: pointer;
  font: inherit;
}

h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

.page-header p {
  margin: 0;
  opacity: 0.7;
}

.content {
  width: 100%;
}

.state,
.empty-state {
  padding: 32px;
  text-align: center;
}

.error {
  color: #b42318;
}

.empty-state {
  border: 1px solid #ddd;
  border-radius: 12px;
}

.empty-state h2 {
  margin-top: 0;
}

.leads-list {
  display: grid;
  gap: 16px;
}

.lead-card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
}

.lead-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.lead-header h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.lead-header time {
  font-size: 13px;
  opacity: 0.6;
  white-space: nowrap;
}

.status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  font-size: 13px;
}

.lead-info {
  display: grid;
  gap: 8px;
}

.lead-info p {
  margin: 0;
}

@media (max-width: 600px) {
  .leads-page {
    padding: 24px 16px;
  }

  .lead-header {
    flex-direction: column;
  }

  .lead-header time {
    white-space: normal;
  }
}
</style>
