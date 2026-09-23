<script setup>
import { computed, onMounted, ref } from "vue";

import { DashboardService } from "../infrastructure/DashboardService.js";

const dashboardService = new DashboardService();

const loading = ref(true);
const error = ref("");
const summary = ref(null);

const stats = computed(() => {
  return (
    summary.value?.stats || {
      businesses: 0,
      conversations: 0,
      leads: 0,
      upcomingBookings: 0,
    }
  );
});

const attention = computed(() => {
  return (
    summary.value?.attention || {
      newLeads: 0,
      humanConversations: 0,
      pendingBookings: 0,
    }
  );
});

const businesses = computed(() => summary.value?.businesses || []);
const recentActivity = computed(() => summary.value?.recentActivity || []);

const hasAttention = computed(() => {
  return (
    attention.value.newLeads > 0 ||
    attention.value.humanConversations > 0 ||
    attention.value.pendingBookings > 0
  );
});

const loadDashboard = async () => {
  loading.value = true;
  error.value = "";

  try {
    summary.value = await dashboardService.getSummary();
  } catch (err) {
    error.value = err.message || "No se ha podido cargar el resumen del dashboard.";
  } finally {
    loading.value = false;
  }
};

const formatRelativeTime = (date) => {
  if (!date) {
    return "";
  }

  const target = new Date(date);
  const now = new Date();

  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 0) {
    return "ahora";
  }

  if (diffSeconds < 60) {
    return "ahora";
  }

  const minutes = Math.floor(diffSeconds / 60);

  if (minutes < 60) {
    return `hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `hace ${hours} ${hours === 1 ? "h" : "h"}`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `hace ${days} ${days === 1 ? "día" : "días"}`;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(target);
};

const getActivityIcon = (type) => {
  const icons = {
    conversation: "◌",
    lead: "♧",
    booking: "◷",
  };

  return icons[type] || "•";
};

const getActivityRoute = (activity) => {
  if (!activity?.businessId) {
    return "/businesses";
  }

  if (activity.type === "conversation") {
    return `/businesses/${activity.businessId}/conversations/${activity.entityId}`;
  }

  if (activity.type === "lead") {
    return `/businesses/${activity.businessId}/leads`;
  }

  if (activity.type === "booking") {
    return `/businesses/${activity.businessId}/bookings`;
  }

  return `/businesses/${activity.businessId}`;
};

const getInitial = (name) => {
  if (!name) {
    return "N";
  }

  return name.trim().charAt(0).toUpperCase();
};

onMounted(loadDashboard);
</script>

<template>
  <div class="dashboard-page">
    <div class="page-container">
      <!-- HEADER -->

      <header class="dashboard-header">
        <div>
          <p class="eyebrow">Workspace</p>

          <h1>Resumen</h1>

          <p class="subtitle">Una visión general de la actividad de tus negocios y agentes.</p>
        </div>

        <div class="header-actions">
          <button type="button" class="refresh-button" :disabled="loading" @click="loadDashboard">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              :class="{ spinning: loading }">
              <path
                d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>

            Actualizar
          </button>

          <RouterLink to="/businesses/create" class="create-button">
            <span>+</span>
            Crear negocio
          </RouterLink>
        </div>
      </header>

      <!-- ERROR -->

      <div v-if="error" class="error-banner">
        <div class="error-icon">!</div>

        <div>
          <strong>No se ha podido cargar el dashboard</strong>
          <span>{{ error }}</span>
        </div>

        <button type="button" @click="loadDashboard">Reintentar</button>
      </div>

      <!-- LOADING -->

      <template v-if="loading && !summary">
        <section class="stats-grid">
          <article v-for="index in 4" :key="index" class="stat-card stat-card-loading">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-number"></div>
            <div class="skeleton skeleton-text"></div>
          </article>
        </section>

        <section class="main-grid">
          <div class="panel loading-panel">
            <div class="skeleton skeleton-title"></div>

            <div v-for="index in 5" :key="index" class="loading-row">
              <div class="skeleton skeleton-avatar"></div>

              <div class="loading-lines">
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line-small"></div>
              </div>
            </div>
          </div>

          <div class="panel loading-panel">
            <div class="skeleton skeleton-title"></div>

            <div v-for="index in 3" :key="index" class="loading-row">
              <div class="skeleton skeleton-avatar"></div>

              <div class="loading-lines">
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line-small"></div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template v-else-if="summary">
        <!-- STATS -->

        <section class="stats-grid">
          <RouterLink to="/businesses" class="stat-card">
            <div class="stat-top">
              <div class="stat-icon blue">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.8" />
                  <path d="M9 4v16M4 10h5" stroke="currentColor" stroke-width="1.8" />
                </svg>
              </div>

              <span class="stat-label">Negocios</span>
            </div>

            <strong>{{ stats.businesses }}</strong>

            <div class="stat-bottom">
              <p>Negocios configurados</p>
              <span>→</span>
            </div>
          </RouterLink>

          <article class="stat-card">
            <div class="stat-top">
              <div class="stat-icon green">◌</div>

              <span class="stat-label">Conversaciones</span>
            </div>

            <strong>{{ stats.conversations }}</strong>

            <div class="stat-bottom">
              <p>Conversaciones totales</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-top">
              <div class="stat-icon orange">♧</div>

              <span class="stat-label">Leads</span>
            </div>

            <strong>{{ stats.leads }}</strong>

            <div class="stat-bottom">
              <p>Contactos captados</p>

              <span v-if="attention.newLeads > 0" class="mini-badge orange-badge">
                {{ attention.newLeads }} nuevos
              </span>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-top">
              <div class="stat-icon purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8" />
                  <path
                    d="M16 3v4M8 3v4M3 10h18"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round" />
                </svg>
              </div>

              <span class="stat-label">Reservas</span>
            </div>

            <strong>{{ stats.upcomingBookings }}</strong>

            <div class="stat-bottom">
              <p>Próximas reservas</p>

              <span v-if="attention.pendingBookings > 0" class="mini-badge purple-badge">
                {{ attention.pendingBookings }} pendientes
              </span>
            </div>
          </article>
        </section>

        <!-- ACTIVITY + ATTENTION -->

        <section class="main-grid">
          <article class="panel activity-panel">
            <div class="panel-header">
              <div>
                <h2>Actividad reciente</h2>

                <p>Últimos eventos de tus negocios.</p>
              </div>

              <span class="activity-count">
                {{ recentActivity.length }}
              </span>
            </div>

            <div v-if="recentActivity.length" class="activity-list">
              <RouterLink
                v-for="activity in recentActivity"
                :key="activity.id"
                :to="getActivityRoute(activity)"
                class="activity-item">
                <div class="activity-icon" :class="`activity-${activity.type}`">
                  {{ getActivityIcon(activity.type) }}
                </div>

                <div class="activity-content">
                  <div class="activity-title-row">
                    <strong>{{ activity.title }}</strong>

                    <time>{{ formatRelativeTime(activity.date) }}</time>
                  </div>

                  <p>
                    {{ activity.description || "Nueva actividad registrada" }}
                  </p>

                  <span>{{ activity.businessName }}</span>
                </div>

                <span class="activity-arrow">→</span>
              </RouterLink>
            </div>

            <div v-else class="panel-empty">
              <div class="empty-icon">◌</div>

              <strong>Todavía no hay actividad</strong>

              <p>Cuando tus agentes reciban conversaciones, leads o reservas aparecerán aquí.</p>
            </div>
          </article>

          <article class="panel attention-panel">
            <div class="panel-header">
              <div>
                <h2>Requiere atención</h2>

                <p>Elementos que pueden necesitar tu intervención.</p>
              </div>
            </div>

            <div class="attention-list">
              <div class="attention-item">
                <div class="attention-icon attention-lead">♧</div>

                <div class="attention-content">
                  <span>Leads nuevos</span>

                  <strong>{{ attention.newLeads }}</strong>
                </div>
              </div>

              <div class="attention-item">
                <div class="attention-icon attention-human">◌</div>

                <div class="attention-content">
                  <span>Chats con humano</span>

                  <strong>{{ attention.humanConversations }}</strong>
                </div>
              </div>

              <div class="attention-item">
                <div class="attention-icon attention-booking">◷</div>

                <div class="attention-content">
                  <span>Reservas pendientes</span>

                  <strong>{{ attention.pendingBookings }}</strong>
                </div>
              </div>
            </div>

            <div class="attention-status" :class="{ 'attention-clear': !hasAttention }">
              <span class="attention-status-dot"></span>

              <div>
                <strong>
                  {{ hasAttention ? "Hay elementos pendientes" : "Todo al día" }}
                </strong>

                <p>
                  {{
                    hasAttention
                      ? "Revisa los elementos que requieren tu atención."
                      : "No tienes acciones pendientes en este momento."
                  }}
                </p>
              </div>
            </div>
          </article>
        </section>

        <!-- BUSINESSES -->

        <section class="businesses-section">
          <div class="section-heading">
            <div>
              <h2>Tus negocios</h2>

              <p>Rendimiento y actividad de cada negocio.</p>
            </div>

            <RouterLink to="/businesses" class="view-all-link">
              Ver todos
              <span>→</span>
            </RouterLink>
          </div>

          <div v-if="businesses.length" class="businesses-grid">
            <RouterLink
              v-for="business in businesses"
              :key="business.id"
              :to="`/businesses/${business.id}`"
              class="business-card">
              <div class="business-card-top">
                <div class="business-identity">
                  <div class="business-avatar">
                    {{ getInitial(business.name) }}
                  </div>

                  <div>
                    <strong>{{ business.name }}</strong>

                    <span>
                      {{ business.description || business.address || "Negocio configurado" }}
                    </span>
                  </div>
                </div>

                <span class="business-arrow">→</span>
              </div>

              <div class="business-metrics">
                <div>
                  <strong>{{ business.conversations }}</strong>
                  <span>Conversaciones</span>
                </div>

                <div>
                  <strong>{{ business.leads }}</strong>
                  <span>Leads</span>
                </div>

                <div>
                  <strong>{{ business.upcomingBookings }}</strong>
                  <span>Reservas</span>
                </div>
              </div>

              <div
                v-if="
                  business.humanConversations > 0 || business.newLeads > 0 || business.pendingBookings > 0
                "
                class="business-alerts">
                <span v-if="business.newLeads > 0">
                  {{ business.newLeads }}
                  {{ business.newLeads === 1 ? "lead nuevo" : "leads nuevos" }}
                </span>

                <span v-if="business.humanConversations > 0">
                  {{ business.humanConversations }}
                  {{ business.humanConversations === 1 ? "chat humano" : "chats humanos" }}
                </span>

                <span v-if="business.pendingBookings > 0">
                  {{ business.pendingBookings }}
                  {{ business.pendingBookings === 1 ? "reserva pendiente" : "reservas pendientes" }}
                </span>
              </div>
            </RouterLink>
          </div>

          <div v-else class="businesses-empty">
            <div class="businesses-empty-icon">▦</div>

            <div>
              <strong>Crea tu primer negocio</strong>

              <p>Configura un negocio para empezar a utilizar tu agente de IA.</p>
            </div>

            <RouterLink to="/businesses/create" class="empty-create-button">
              Crear negocio
              <span>→</span>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 42px 48px 70px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

/* =========================
   HEADER
========================= */

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;

  margin-bottom: 30px;
}

.eyebrow {
  margin: 0 0 7px;

  color: var(--primary);

  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-header h1 {
  margin: 0;

  color: var(--text);

  font-size: 32px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.subtitle {
  margin: 8px 0 0;

  color: var(--text-secondary);

  font-size: 14px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.create-button,
.refresh-button {
  min-height: 40px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 15px;

  border-radius: 8px;

  font: inherit;
  font-size: 13px;
  font-weight: 600;

  text-decoration: none;

  cursor: pointer;

  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.create-button {
  border: 1px solid var(--primary);

  background: var(--primary);
  color: white;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);
}

.create-button:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.create-button > span {
  font-size: 18px;
  line-height: 1;
}

.refresh-button {
  border: 1px solid var(--border);

  background: var(--surface);
  color: var(--text-secondary);
}

.refresh-button:hover:not(:disabled) {
  border-color: #cbd5e1;

  background: #f8fafc;
  color: var(--text);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   ERROR
========================= */

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;

  margin-bottom: 22px;
  padding: 13px 15px;

  border: 1px solid #fecaca;
  border-radius: 11px;

  background: #fef2f2;
}

.error-icon {
  width: 30px;
  height: 30px;

  flex: 0 0 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: #fee2e2;
  color: #dc2626;

  font-size: 13px;
  font-weight: 800;
}

.error-banner > div:nth-child(2) {
  min-width: 0;

  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.error-banner strong {
  color: #991b1b;

  font-size: 12px;
}

.error-banner span {
  color: #b91c1c;

  font-size: 11px;
}

.error-banner button {
  padding: 7px 10px;

  border: 1px solid #fecaca;
  border-radius: 7px;

  background: white;
  color: #b91c1c;

  font: inherit;
  font-size: 11px;
  font-weight: 600;

  cursor: pointer;
}

/* =========================
   STATS
========================= */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  margin-bottom: 20px;
}

.stat-card {
  min-width: 0;

  padding: 18px;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--surface);
  color: inherit;

  text-decoration: none;

  box-shadow: var(--shadow-sm);

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

a.stat-card:hover {
  border-color: #cbd5e1;

  box-shadow: var(--shadow-md);

  transform: translateY(-1px);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  margin-bottom: 17px;
}

.stat-icon {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  font-size: 15px;
  font-weight: 700;
}

.stat-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.green {
  background: #ecfdf3;
  color: #16a34a;
}

.stat-icon.orange {
  background: #fffaeb;
  color: #d97706;
}

.stat-icon.purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.stat-label {
  color: var(--text-muted);

  font-size: 10px;
  font-weight: 600;
}

.stat-card > strong {
  display: block;

  margin-bottom: 7px;

  color: var(--text);

  font-size: 27px;
  line-height: 1;
  letter-spacing: -0.035em;
}

.stat-bottom {
  min-height: 19px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stat-bottom p {
  margin: 0;

  color: var(--text-secondary);

  font-size: 11px;
}

.stat-bottom > span:not(.mini-badge) {
  color: var(--text-muted);

  font-size: 15px;
}

.mini-badge {
  display: inline-flex;
  align-items: center;

  padding: 3px 6px;

  border-radius: 999px;

  font-size: 9px;
  font-weight: 600;

  white-space: nowrap;
}

.orange-badge {
  background: #fffaeb;
  color: #b45309;
}

.purple-badge {
  background: #f5f3ff;
  color: #7c3aed;
}

/* =========================
   MAIN GRID
========================= */

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.75fr);
  gap: 16px;

  margin-bottom: 30px;
}

.panel {
  min-width: 0;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.panel-header {
  min-height: 74px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  padding: 17px 19px;

  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  margin: 0;

  color: var(--text);

  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.panel-header p {
  margin: 4px 0 0;

  color: var(--text-secondary);

  font-size: 11px;
}

.activity-count {
  min-width: 25px;
  height: 25px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 7px;

  border-radius: 999px;

  background: var(--surface-soft);
  color: var(--text-secondary);

  font-size: 10px;
  font-weight: 700;
}

/* =========================
   ACTIVITY
========================= */

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 12px;

  padding: 13px 18px;

  border-bottom: 1px solid #f1f5f9;

  color: inherit;

  text-decoration: none;

  transition: background 0.15s ease;
}

.activity-item:last-child {
  border-bottom: 0;
}

.activity-item:hover {
  background: #fafbfc;
}

.activity-icon {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  font-size: 14px;
  font-weight: 700;
}

.activity-conversation {
  background: #ecfdf3;
  color: #16a34a;
}

.activity-lead {
  background: #fffaeb;
  color: #d97706;
}

.activity-booking {
  background: #f5f3ff;
  color: #7c3aed;
}

.activity-content {
  min-width: 0;

  flex: 1;
}

.activity-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-title-row strong {
  overflow: hidden;

  color: var(--text);

  font-size: 11px;
  font-weight: 650;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-title-row time {
  flex: 0 0 auto;

  color: var(--text-muted);

  font-size: 9px;
}

.activity-content p {
  overflow: hidden;

  margin: 3px 0 2px;

  color: var(--text-secondary);

  font-size: 10px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-content > span {
  display: block;

  overflow: hidden;

  color: var(--text-muted);

  font-size: 9px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-arrow {
  flex: 0 0 auto;

  color: #cbd5e1;

  font-size: 14px;

  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.activity-item:hover .activity-arrow {
  color: var(--primary);
  transform: translateX(2px);
}

/* =========================
   ATTENTION
========================= */

.attention-list {
  padding: 8px 17px;
}

.attention-item {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 12px 2px;

  border-bottom: 1px solid #f1f5f9;
}

.attention-item:last-child {
  border-bottom: 0;
}

.attention-icon {
  width: 32px;
  height: 32px;

  flex: 0 0 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  font-size: 13px;
  font-weight: 700;
}

.attention-lead {
  background: #fffaeb;
  color: #d97706;
}

.attention-human {
  background: #eff6ff;
  color: #2563eb;
}

.attention-booking {
  background: #f5f3ff;
  color: #7c3aed;
}

.attention-content {
  min-width: 0;

  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.attention-content span {
  color: var(--text-secondary);

  font-size: 11px;
}

.attention-content strong {
  color: var(--text);

  font-size: 14px;
}

.attention-status {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  margin: 6px 16px 16px;
  padding: 11px;

  border: 1px solid #fde68a;
  border-radius: 9px;

  background: #fffbeb;
}

.attention-status-dot {
  width: 7px;
  height: 7px;

  flex: 0 0 7px;

  margin-top: 4px;

  border-radius: 50%;

  background: #f59e0b;

  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.attention-status > div {
  min-width: 0;
}

.attention-status strong {
  display: block;

  color: #92400e;

  font-size: 10px;
}

.attention-status p {
  margin: 2px 0 0;

  color: #b45309;

  font-size: 9px;
  line-height: 1.45;
}

.attention-status.attention-clear {
  border-color: #bbf7d0;

  background: #f0fdf4;
}

.attention-clear .attention-status-dot {
  background: #22c55e;

  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.attention-clear strong {
  color: #166534;
}

.attention-clear p {
  color: #15803d;
}

/* =========================
   EMPTY PANEL
========================= */

.panel-empty {
  min-height: 290px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 30px;

  text-align: center;
}

.empty-icon {
  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 10px;

  border-radius: 10px;

  background: var(--surface-soft);
  color: var(--text-muted);
}

.panel-empty strong {
  color: var(--text);

  font-size: 12px;
}

.panel-empty p {
  max-width: 320px;

  margin: 5px 0 0;

  color: var(--text-secondary);

  font-size: 10px;
  line-height: 1.5;
}

/* =========================
   BUSINESSES
========================= */

.businesses-section {
  padding-bottom: 10px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;

  margin-bottom: 14px;
}

.section-heading h2 {
  margin: 0;

  color: var(--text);

  font-size: 17px;
  letter-spacing: -0.02em;
}

.section-heading p {
  margin: 4px 0 0;

  color: var(--text-secondary);

  font-size: 11px;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: var(--text-secondary);

  font-size: 11px;
  font-weight: 600;

  text-decoration: none;

  transition: color 0.15s ease;
}

.view-all-link:hover {
  color: var(--primary);
}

.view-all-link span {
  font-size: 14px;
}

.businesses-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.business-card {
  min-width: 0;

  padding: 17px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);
  color: inherit;

  text-decoration: none;

  box-shadow: var(--shadow-sm);

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.business-card:hover {
  border-color: #cbd5e1;

  box-shadow: var(--shadow-md);

  transform: translateY(-1px);
}

.business-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.business-identity {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 11px;
}

.business-avatar {
  width: 38px;
  height: 38px;

  flex: 0 0 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 13px;
  font-weight: 800;
}

.business-identity > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.business-identity strong {
  overflow: hidden;

  color: var(--text);

  font-size: 12px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-identity span {
  overflow: hidden;

  color: var(--text-secondary);

  font-size: 10px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-arrow {
  color: var(--text-muted);

  font-size: 16px;

  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.business-card:hover .business-arrow {
  color: var(--primary);

  transform: translateX(2px);
}

.business-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  margin-top: 16px;
  padding-top: 14px;

  border-top: 1px solid #f1f5f9;
}

.business-metrics > div {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 3px;

  padding: 0 10px;

  border-right: 1px solid #f1f5f9;
}

.business-metrics > div:first-child {
  padding-left: 0;
}

.business-metrics > div:last-child {
  padding-right: 0;
  border-right: 0;
}

.business-metrics strong {
  color: var(--text);

  font-size: 14px;
}

.business-metrics span {
  overflow: hidden;

  color: var(--text-muted);

  font-size: 9px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-alerts {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;

  margin-top: 13px;
}

.business-alerts span {
  display: inline-flex;

  padding: 4px 7px;

  border-radius: 999px;

  background: #fff7ed;
  color: #c2410c;

  font-size: 8px;
  font-weight: 600;
}

.businesses-empty {
  display: flex;
  align-items: center;
  gap: 14px;

  padding: 20px;

  border: 1px dashed #cbd5e1;
  border-radius: 13px;

  background: var(--surface);
}

.businesses-empty-icon {
  width: 40px;
  height: 40px;

  flex: 0 0 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: var(--primary-soft);
  color: var(--primary);
}

.businesses-empty > div:nth-child(2) {
  min-width: 0;

  flex: 1;
}

.businesses-empty strong {
  color: var(--text);

  font-size: 12px;
}

.businesses-empty p {
  margin: 4px 0 0;

  color: var(--text-secondary);

  font-size: 10px;
}

.empty-create-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 8px 11px;

  border-radius: 7px;

  background: var(--primary);
  color: white;

  font-size: 10px;
  font-weight: 600;

  text-decoration: none;
}

/* =========================
   LOADING
========================= */

.stat-card-loading {
  min-height: 125px;
}

.skeleton {
  border-radius: 6px;

  background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 37%, #f1f5f9 63%);

  background-size: 400% 100%;

  animation: skeleton 1.4s ease infinite;
}

@keyframes skeleton {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

.skeleton-icon {
  width: 34px;
  height: 34px;

  margin-bottom: 18px;

  border-radius: 9px;
}

.skeleton-number {
  width: 45px;
  height: 23px;

  margin-bottom: 8px;
}

.skeleton-text {
  width: 105px;
  height: 9px;
}

.loading-panel {
  min-height: 360px;

  padding: 20px;
}

.skeleton-title {
  width: 130px;
  height: 13px;

  margin-bottom: 25px;
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 11px;

  margin-bottom: 20px;
}

.skeleton-avatar {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  border-radius: 9px;
}

.loading-lines {
  width: 100%;
}

.skeleton-line {
  width: 65%;
  height: 9px;

  margin-bottom: 7px;
}

.skeleton-line-small {
  width: 40%;
  height: 7px;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
  }
}

@media (max-width: 950px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .attention-panel {
    order: -1;
  }

  .attention-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;

    padding: 15px;
  }

  .attention-item {
    padding: 10px;

    border: 1px solid var(--border);
    border-radius: 9px;
  }

  .attention-content {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}

@media (max-width: 900px) {
  .dashboard-page {
    padding: 32px;
  }
}

@media (max-width: 760px) {
  .dashboard-page {
    padding: 28px 20px 50px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .header-actions {
    width: 100%;
  }

  .refresh-button,
  .create-button {
    flex: 1;
  }

  .businesses-grid {
    grid-template-columns: 1fr;
  }

  .activity-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .attention-list {
    grid-template-columns: 1fr;
  }

  .attention-content {
    align-items: center;
    flex-direction: row;
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header h1 {
    font-size: 28px;
  }

  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .refresh-button,
  .create-button {
    width: 100%;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .activity-item {
    padding: 13px;
  }

  .activity-arrow {
    display: none;
  }

  .business-metrics {
    gap: 0;
  }

  .business-metrics > div {
    padding: 0 7px;
  }

  .businesses-empty {
    align-items: flex-start;
    flex-direction: column;
  }

  .empty-create-button {
    width: 100%;

    justify-content: center;
  }
}

/* =========================
   DASHBOARD TYPOGRAPHY FIX
========================= */

.eyebrow {
  font-size: 12px;
}

.subtitle {
  font-size: 15px;
}

/* Stats */

.stat-label {
  font-size: 12px;
}

.stat-card > strong {
  font-size: 30px;
}

.stat-bottom p {
  font-size: 13px;
}

.mini-badge {
  padding: 4px 8px;

  font-size: 11px;
}

/* Panel headers */

.panel-header h2 {
  font-size: 17px;
}

.panel-header p {
  font-size: 13px;
}

.activity-count {
  font-size: 11px;
}

/* Activity */

.activity-title-row strong {
  font-size: 13px;
}

.activity-title-row time {
  font-size: 11px;
}

.activity-content p {
  margin-top: 4px;

  font-size: 12px;
}

.activity-content > span {
  margin-top: 3px;

  font-size: 11px;
}

/* Attention */

.attention-content span {
  font-size: 13px;
}

.attention-content strong {
  font-size: 16px;
}

.attention-status strong {
  font-size: 12px;
}

.attention-status p {
  font-size: 11px;
}

/* Empty states */

.panel-empty strong {
  font-size: 14px;
}

.panel-empty p {
  font-size: 12px;
}

/* Businesses */

.section-heading h2 {
  font-size: 18px;
}

.section-heading p {
  font-size: 13px;
}

.view-all-link {
  font-size: 13px;
}

.business-identity strong {
  font-size: 14px;
}

.business-identity span {
  font-size: 12px;
}

.business-metrics strong {
  font-size: 17px;
}

.business-metrics span {
  font-size: 11px;
}

.business-alerts span {
  padding: 5px 8px;

  font-size: 10px;
}

/* Empty business */

.businesses-empty strong {
  font-size: 14px;
}

.businesses-empty p {
  font-size: 12px;
}

.empty-create-button {
  font-size: 12px;
}

/* Error */

.error-banner strong {
  font-size: 13px;
}

.error-banner span {
  font-size: 12px;
}

.error-banner button {
  font-size: 12px;
}
</style>
