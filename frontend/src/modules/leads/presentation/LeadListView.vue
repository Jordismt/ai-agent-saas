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
const updatingLeadId = ref(null);

const search = ref("");
const statusFilter = ref("all");

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

const filteredLeads = computed(() => {
  const query = search.value.trim().toLowerCase();

  return leads.value.filter((lead) => {
    const matchesStatus = statusFilter.value === "all" || lead.status === statusFilter.value;

    const matchesSearch =
      !query ||
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.notes?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });
});

const newCount = computed(() => leads.value.filter((lead) => lead.status === "new").length);

const contactedCount = computed(() => leads.value.filter((lead) => lead.status === "contacted").length);

const qualifiedCount = computed(() => leads.value.filter((lead) => lead.status === "qualified").length);

const convertedCount = computed(() => leads.value.filter((lead) => lead.status === "converted").length);

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
  <div class="leads-page">
    <div class="page-container">
      <!-- BREADCRUMB -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <button type="button" @click="goBack">Negocio</button>

        <span>/</span>

        <span>Leads</span>
      </nav>

      <!-- HEADER -->

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round" />

              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8" />

              <path d="M19 8v6M22 11h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>

          <div>
            <p class="eyebrow">CRM</p>

            <h1>Leads</h1>

            <p class="page-description">
              Gestiona los clientes potenciales captados automáticamente por tu agente.
            </p>
          </div>
        </div>

        <button type="button" class="refresh-button" :disabled="loading" @click="loadLeads">
          <svg :class="{ rotating: loading }" width="14" height="14" viewBox="0 0 24 24" fill="none">
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

      <!-- STATS -->

      <section class="stats-grid">
        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'all' }"
          @click="statusFilter = 'all'">
          <div class="stat-icon total">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.8" />

              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </div>

          <strong>{{ leads.length }}</strong>
          <span>Total leads</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'new' }"
          @click="statusFilter = 'new'">
          <div class="stat-icon new">✦</div>

          <strong>{{ newCount }}</strong>
          <span>Nuevos</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'contacted' }"
          @click="statusFilter = 'contacted'">
          <div class="stat-icon contacted">↗</div>

          <strong>{{ contactedCount }}</strong>
          <span>Contactados</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'qualified' }"
          @click="statusFilter = 'qualified'">
          <div class="stat-icon qualified">✓</div>

          <strong>{{ qualifiedCount }}</strong>
          <span>Cualificados</span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: statusFilter === 'converted' }"
          @click="statusFilter = 'converted'">
          <div class="stat-icon converted">↑</div>

          <strong>{{ convertedCount }}</strong>
          <span>Convertidos</span>
        </button>
      </section>

      <!-- ERROR -->

      <div v-if="error" class="error-banner">
        <div class="error-icon">!</div>

        <div>
          <strong>Ha ocurrido un error</strong>
          <span>{{ error }}</span>
        </div>

        <button type="button" @click="loadLeads">Reintentar</button>
      </div>

      <!-- CRM -->

      <section class="crm-card">
        <!-- TOOLBAR -->

        <div class="crm-toolbar">
          <div>
            <div class="crm-title">
              <h2>Clientes potenciales</h2>

              <span>
                {{ filteredLeads.length }}
              </span>
            </div>

            <p>Leads captados por el agente durante las conversaciones.</p>
          </div>

          <div class="toolbar-actions">
            <div class="search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />

                <path d="m20 20-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>

              <input v-model="search" type="search" placeholder="Buscar lead..." />
            </div>

            <select v-model="statusFilter" class="filter-select">
              <option value="all">Todos los estados</option>

              <option value="new">Nuevos</option>

              <option value="contacted">Contactados</option>

              <option value="qualified">Cualificados</option>

              <option value="converted">Convertidos</option>

              <option value="lost">Perdidos</option>
            </select>
          </div>
        </div>

        <!-- LOADING -->

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>

          <div>
            <strong>Cargando leads</strong>
            <span> Obteniendo los clientes potenciales... </span>
          </div>
        </div>

        <!-- EMPTY ALL -->

        <div v-else-if="leads.length === 0" class="empty-state">
          <div class="empty-visual">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round" />

              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.7" />

              <path d="M19 8v6M22 11h-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </div>

          <h3>Todavía no tienes leads</h3>

          <p>Cuando un cliente facilite sus datos al agente, aparecerá automáticamente en esta sección.</p>

          <div class="empty-info">
            <span>✦</span>

            <p>
              El agente puede capturar información de clientes interesados mientras mantiene una conversación.
            </p>
          </div>
        </div>

        <!-- NO RESULTS -->

        <div v-else-if="filteredLeads.length === 0" class="empty-state compact">
          <div class="empty-visual">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7" />

              <path d="m20 20-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </div>

          <h3>No hay resultados</h3>

          <p>No encontramos leads que coincidan con los filtros actuales.</p>

          <button
            type="button"
            class="clear-filter"
            @click="
              search = '';
              statusFilter = 'all';
            ">
            Limpiar filtros
          </button>
        </div>

        <!-- TABLE -->

        <div v-else class="table-wrapper">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Contacto</th>
                <th>Notas</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="lead in filteredLeads" :key="lead.id">
                <!-- LEAD -->

                <td>
                  <div class="lead-profile">
                    <div class="lead-avatar">
                      {{ getInitials(lead.name) }}
                    </div>

                    <div>
                      <strong>
                        {{ lead.name || "Sin nombre" }}
                      </strong>

                      <span> ID {{ lead.id?.slice(0, 8) }} </span>
                    </div>
                  </div>
                </td>

                <!-- CONTACT -->

                <td>
                  <div class="contact-info">
                    <a v-if="lead.email" :href="`mailto:${lead.email}`">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          stroke-width="1.7" />

                        <path
                          d="m3 7 9 6 9-6"
                          stroke="currentColor"
                          stroke-width="1.7"
                          stroke-linejoin="round" />
                      </svg>

                      {{ lead.email }}
                    </a>

                    <a v-if="lead.phone" :href="`tel:${lead.phone}`">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z"
                          stroke="currentColor"
                          stroke-width="1.6"
                          stroke-linecap="round"
                          stroke-linejoin="round" />
                      </svg>

                      {{ lead.phone }}
                    </a>

                    <span v-if="!lead.email && !lead.phone" class="no-data"> Sin datos de contacto </span>
                  </div>
                </td>

                <!-- NOTES -->

                <td>
                  <p v-if="lead.notes" class="lead-notes" :title="lead.notes">
                    {{ lead.notes }}
                  </p>

                  <span v-else class="no-data"> Sin notas </span>
                </td>

                <!-- DATE -->

                <td>
                  <time class="lead-date">
                    {{ formatDate(lead.created_at) }}
                  </time>
                </td>

                <!-- STATUS -->

                <td>
                  <div class="status-control">
                    <span class="status-dot" :class="`dot-${lead.status}`"></span>

                    <select
                      :value="lead.status"
                      :class="`status-${lead.status}`"
                      :disabled="updatingLeadId === lead.id"
                      @change="handleStatusChange(lead, $event)">
                      <option value="new">Nuevo</option>

                      <option value="contacted">Contactado</option>

                      <option value="qualified">Cualificado</option>

                      <option value="converted">Convertido</option>

                      <option value="lost">Perdido</option>
                    </select>

                    <div v-if="updatingLeadId === lead.id" class="mini-spinner"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->

        <div v-if="!loading && leads.length > 0" class="table-footer">
          <span>
            Mostrando
            <strong>{{ filteredLeads.length }}</strong>
            de
            <strong>{{ leads.length }}</strong>
            leads
          </span>

          <span>
            {{ convertedCount === 1 ? "1 lead convertido" : `${convertedCount} leads convertidos` }}
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.leads-page {
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

  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 0;

  color: var(--text);

  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.page-description {
  max-width: 650px;

  margin: 5px 0 0;

  color: var(--text-secondary);

  font-size: 11px;
  line-height: 1.5;
}

.refresh-button {
  min-height: 37px;

  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 12px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 9px;
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
  min-height: 108px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  padding: 12px;

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
  width: 26px;
  height: 26px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 10px;

  border-radius: 7px;

  font-size: 9px;
  font-weight: 700;
}

.stat-icon.total {
  background: var(--primary-soft);
  color: var(--primary);
}

.stat-icon.new {
  background: #eef2ff;
  color: #4f46e5;
}

.stat-icon.contacted {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.qualified {
  background: #fefce8;
  color: #a16207;
}

.stat-icon.converted {
  background: #ecfdf3;
  color: #16a34a;
}

.stat-card > strong {
  color: var(--text);

  font-size: 19px;
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-card > span {
  margin-top: 5px;

  color: var(--text-muted);

  font-size: 8px;
}

/* CRM CARD */

.crm-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

/* TOOLBAR */

.crm-toolbar {
  min-height: 69px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 12px 15px;

  border-bottom: 1px solid var(--border);
}

.crm-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.crm-title h2 {
  margin: 0;

  color: var(--text);

  font-size: 11px;
}

.crm-title > span {
  min-width: 18px;
  height: 18px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 4px;

  border-radius: 999px;

  background: var(--surface-soft);
  color: var(--text-secondary);

  font-size: 7px;
  font-weight: 600;
}

.crm-toolbar p {
  margin: 3px 0 0;

  color: var(--text-muted);

  font-size: 8px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.search-box {
  width: 190px;
  min-height: 34px;

  display: flex;
  align-items: center;
  gap: 6px;

  padding: 0 9px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text-muted);

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
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
  font-size: 8px;
}

.search-box input::placeholder {
  color: #98a2b3;
}

.filter-select {
  min-height: 34px;

  padding: 0 28px 0 9px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 8px;

  outline: none;

  cursor: pointer;
}

/* TABLE */

.table-wrapper {
  width: 100%;

  overflow-x: auto;
}

.leads-table {
  width: 100%;

  border-collapse: collapse;
}

.leads-table th {
  padding: 9px 12px;

  border-bottom: 1px solid var(--border);

  background: #fafbfc;
  color: var(--text-muted);

  font-size: 7px;
  font-weight: 600;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.leads-table td {
  padding: 12px;

  border-bottom: 1px solid var(--border);

  vertical-align: middle;
}

.leads-table tbody tr {
  transition: background 0.15s ease;
}

.leads-table tbody tr:hover {
  background: #fafbfc;
}

.leads-table tbody tr:last-child td {
  border-bottom: 0;
}

.lead-profile {
  min-width: 160px;

  display: flex;
  align-items: center;
  gap: 8px;
}

.lead-avatar {
  width: 31px;
  height: 31px;

  flex: 0 0 31px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: #eef2ff;
  color: #4f46e5;

  font-size: 8px;
  font-weight: 700;
}

.lead-profile > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lead-profile strong {
  overflow: hidden;

  max-width: 180px;

  color: var(--text);

  font-size: 9px;
  font-weight: 600;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.lead-profile span {
  color: var(--text-muted);

  font-family: monospace;
  font-size: 6px;
}

.contact-info {
  min-width: 150px;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-info a {
  max-width: 190px;

  display: flex;
  align-items: center;
  gap: 5px;

  overflow: hidden;

  color: var(--text-secondary);

  font-size: 7px;

  text-decoration: none;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-info a:hover {
  color: var(--primary);
}

.no-data {
  color: var(--text-muted);

  font-size: 7px;
}

.lead-notes {
  max-width: 260px;

  display: -webkit-box;
  overflow: hidden;

  margin: 0;

  color: var(--text-secondary);

  font-size: 7px;
  line-height: 1.5;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.lead-date {
  color: var(--text-muted);

  font-size: 7px;

  white-space: nowrap;
}

/* STATUS */

.status-control {
  position: relative;

  min-width: 125px;

  display: flex;
  align-items: center;
}

.status-dot {
  position: absolute;
  left: 8px;
  z-index: 2;

  width: 5px;
  height: 5px;

  border-radius: 50%;

  pointer-events: none;
}

.status-control select {
  width: 100%;
  min-height: 31px;

  padding: 0 25px 0 19px;

  border: 1px solid transparent;
  border-radius: 7px;

  font: inherit;
  font-size: 7px;
  font-weight: 600;

  outline: none;

  cursor: pointer;
}

.status-control select:disabled {
  opacity: 0.55;

  cursor: wait;
}

.status-new {
  background: #eef2ff;
  color: #4338ca;
}

.status-contacted {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-qualified {
  background: #fefce8;
  color: #854d0e;
}

.status-converted {
  background: #ecfdf3;
  color: #15803d;
}

.status-lost {
  background: #fef2f2;
  color: #b42318;
}

.dot-new {
  background: #6366f1;
}

.dot-contacted {
  background: #3b82f6;
}

.dot-qualified {
  background: #eab308;
}

.dot-converted {
  background: #22c55e;
}

.dot-lost {
  background: #ef4444;
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

/* FOOTER */

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 9px 12px;

  border-top: 1px solid var(--border);

  background: #fafbfc;
  color: var(--text-muted);

  font-size: 7px;
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
  width: 20px;
  height: 20px;

  flex: 0 0 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #fee2e2;

  font-size: 8px;
  font-weight: 700;
}

.error-banner > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.error-banner strong {
  font-size: 8px;
}

.error-banner span {
  font-size: 7px;
}

.error-banner button {
  margin-left: auto;

  padding: 5px 7px;

  border: 1px solid currentColor;
  border-radius: 6px;

  background: transparent;
  color: inherit;

  font: inherit;
  font-size: 7px;
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

  font-size: 12px;
}

.empty-state > p {
  max-width: 400px;

  margin: 5px 0 0;

  color: var(--text-muted);

  font-size: 8px;
  line-height: 1.6;
}

.empty-info {
  max-width: 420px;

  display: flex;
  align-items: flex-start;
  gap: 7px;

  margin-top: 15px;
  padding: 9px 10px;

  border-radius: 8px;

  background: #f8fbff;

  color: var(--text-secondary);

  text-align: left;
}

.empty-info > span {
  color: var(--primary);

  font-size: 8px;
}

.empty-info p {
  margin: 0;

  font-size: 7px;
  line-height: 1.5;
}

.clear-filter {
  margin-top: 13px;
  padding: 7px 10px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: white;
  color: var(--text-secondary);

  font: inherit;
  font-size: 8px;
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

  font-size: 9px;
}

.loading-state span {
  color: var(--text-muted);

  font-size: 8px;
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

@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 850px) {
  .leads-page {
    padding: 30px 32px 60px;
  }

  .crm-toolbar {
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

@media (max-width: 700px) {
  .leads-page {
    padding: 24px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
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
    box-sizing: border-box;
  }

  .filter-select {
    width: 100%;
  }

  .table-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
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
    font-size: 25px;
  }

  .stats-grid {
    gap: 7px;
  }

  .stat-card {
    min-height: 102px;
  }
}

/* =========================
   LEADS TYPOGRAPHY FIX
========================= */

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  font-size: 13px;
}

/* =========================
   HEADER
========================= */

.eyebrow {
  font-size: 12px;
}

.page-header h1 {
  font-size: 30px;
}

.page-description {
  max-width: 650px;

  font-size: 15px;
  line-height: 1.6;
}

.refresh-button {
  min-height: 40px;
  padding: 0 14px;

  font-size: 13px;
}

/* =========================
   STATS
========================= */

.stat-card {
  min-height: 116px;
  padding: 14px;
}

.stat-icon {
  width: 30px;
  height: 30px;

  font-size: 11px;
}

.stat-card > strong {
  font-size: 23px;
}

.stat-card > span {
  margin-top: 6px;

  font-size: 12px;
  line-height: 1.4;
}

/* =========================
   CRM TOOLBAR
========================= */

.crm-title h2 {
  font-size: 16px;
}

.crm-title > span {
  min-width: 22px;
  height: 22px;

  padding: 0 6px;

  font-size: 10px;
}

.crm-toolbar p {
  margin-top: 4px;

  font-size: 12px;
  line-height: 1.45;
}

/* =========================
   SEARCH / FILTER
========================= */

.search-box {
  min-height: 40px;
  padding: 0 11px;
}

.search-box input {
  font-size: 13px;
}

.filter-select {
  min-height: 40px;

  padding-left: 11px;

  font-size: 13px;
}

/* =========================
   TABLE
========================= */

.leads-table th {
  padding: 11px 12px;

  font-size: 10px;
}

.leads-table td {
  padding: 14px 12px;
}

/* =========================
   LEAD PROFILE
========================= */

.lead-avatar {
  width: 35px;
  height: 35px;
  flex: 0 0 35px;

  font-size: 11px;
}

.lead-profile strong {
  max-width: 190px;

  font-size: 13px;
}

.lead-profile span {
  margin-top: 1px;

  font-size: 10px;
}

/* =========================
   CONTACT
========================= */

.contact-info {
  gap: 5px;
}

.contact-info a {
  font-size: 12px;
  line-height: 1.4;
}

.no-data {
  font-size: 11px;
}

/* =========================
   NOTES
========================= */

.lead-notes {
  font-size: 12px;
  line-height: 1.5;
}

/* =========================
   DATE
========================= */

.lead-date {
  font-size: 11px;
}

/* =========================
   STATUS
========================= */

.status-control {
  min-width: 135px;
}

.status-dot {
  left: 9px;

  width: 6px;
  height: 6px;
}

.status-control select {
  min-height: 36px;

  padding: 0 27px 0 21px;

  font-size: 11px;
}

/* =========================
   TABLE FOOTER
========================= */

.table-footer {
  padding: 11px 12px;

  font-size: 11px;
  line-height: 1.45;
}

/* =========================
   ERROR
========================= */

.error-icon {
  width: 23px;
  height: 23px;
  flex: 0 0 23px;

  font-size: 10px;
}

.error-banner strong {
  font-size: 13px;
}

.error-banner span {
  font-size: 12px;
  line-height: 1.45;
}

.error-banner button {
  padding: 6px 9px;

  font-size: 12px;
}

/* =========================
   EMPTY STATE
========================= */

.empty-state h3 {
  font-size: 16px;
}

.empty-state > p {
  font-size: 13px;
  line-height: 1.6;
}

.empty-info {
  padding: 10px 12px;
}

.empty-info > span {
  font-size: 11px;
}

.empty-info p {
  font-size: 12px;
  line-height: 1.55;
}

.clear-filter {
  min-height: 38px;

  padding: 0 12px;

  font-size: 13px;
}

/* =========================
   LOADING
========================= */

.loading-state strong {
  font-size: 13px;
}

.loading-state span {
  font-size: 11px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 700px) {
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

  .refresh-button {
    min-height: 44px;

    font-size: 14px;
  }

  .stat-card > strong {
    font-size: 22px;
  }

  .stat-card > span {
    font-size: 12px;
  }

  .crm-title h2 {
    font-size: 15px;
  }

  .crm-toolbar p {
    font-size: 12px;
  }

  /*
    16px evita el zoom automático de Safari
    al pulsar los controles en iPhone.
  */
  .search-box input,
  .filter-select {
    font-size: 16px;
  }

  .search-box,
  .filter-select {
    min-height: 44px;
  }

  .clear-filter {
    min-height: 42px;

    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 26px;
  }

  .stat-card {
    min-height: 108px;
  }
}
</style>
