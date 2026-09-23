<script setup>
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ConversationService } from "../infrastructure/ConversationService.js";

const route = useRoute();
const router = useRouter();

const conversationService = new ConversationService();

const conversations = ref([]);
const loading = ref(true);
const error = ref("");

const filter = ref("all");

const businessId = route.params.id;

const filteredConversations = computed(() => {
  if (filter.value === "all") {
    return conversations.value;
  }

  return conversations.value.filter((conversation) => conversation.status === filter.value);
});

const activeCount = computed(
  () => conversations.value.filter((conversation) => conversation.status === "active").length,
);

const humanCount = computed(
  () => conversations.value.filter((conversation) => conversation.status === "human").length,
);

const closedCount = computed(
  () => conversations.value.filter((conversation) => conversation.status === "closed").length,
);

const loadConversations = async () => {
  loading.value = true;
  error.value = "";

  try {
    conversations.value = await conversationService.getByBusinessId(businessId);
  } catch (err) {
    console.error(err);
    error.value = "No se han podido cargar las conversaciones.";
  } finally {
    loading.value = false;
  }
};

const openConversation = (conversationId) => {
  router.push(`/businesses/${businessId}/conversations/${conversationId}`);
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getStatusLabel = (status) => {
  const labels = {
    active: "IA activa",
    human: "Atención humana",
    closed: "Cerrada",
  };

  return labels[status] || status;
};

const getChannelLabel = (channel) => {
  const labels = {
    web: "Chat web",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    email: "Email",
  };

  return labels[channel] || channel || "Chat";
};

onMounted(loadConversations);
</script>

<template>
  <div class="conversations-page">
    <div class="page-container">
      <!-- BREADCRUMB -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <RouterLink :to="`/businesses/${businessId}`"> Negocio </RouterLink>

        <span>/</span>

        <span>Conversaciones</span>
      </nav>

      <!-- HEADER -->

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round" />
            </svg>
          </div>

          <div>
            <p class="eyebrow">Bandeja de entrada</p>

            <h1>Conversaciones</h1>

            <p class="page-description">
              Consulta las conversaciones del agente y atiende aquellas que necesitan intervención humana.
            </p>
          </div>
        </div>

        <button type="button" class="refresh-button" :disabled="loading" @click="loadConversations">
          <svg
            :class="{ rotating: loading }"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true">
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

      <!-- STATS / FILTERS -->

      <section class="stats-grid">
        <button
          type="button"
          class="stat-card"
          :class="{ selected: filter === 'all' }"
          @click="filter = 'all'">
          <div class="stat-top">
            <div class="stat-icon all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linejoin="round" />
              </svg>
            </div>

            <span v-if="filter === 'all'" class="selected-indicator"> Activo </span>
          </div>

          <strong>{{ conversations.length }}</strong>

          <span class="stat-label"> Todas las conversaciones </span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: filter === 'active' }"
          @click="filter = 'active'">
          <div class="stat-top">
            <div class="stat-icon ai">✦</div>

            <span v-if="filter === 'active'" class="selected-indicator"> Activo </span>
          </div>

          <strong>{{ activeCount }}</strong>

          <span class="stat-label"> Gestionadas por IA </span>
        </button>

        <button
          type="button"
          class="stat-card human-card"
          :class="{ selected: filter === 'human' }"
          @click="filter = 'human'">
          <div class="stat-top">
            <div class="stat-icon human">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round" />
              </svg>
            </div>

            <span v-if="humanCount > 0" class="attention-indicator"> Requiere atención </span>
          </div>

          <strong>{{ humanCount }}</strong>

          <span class="stat-label"> Atención humana </span>
        </button>

        <button
          type="button"
          class="stat-card"
          :class="{ selected: filter === 'closed' }"
          @click="filter = 'closed'">
          <div class="stat-top">
            <div class="stat-icon closed">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 12 2 2 4-4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round" />

                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
              </svg>
            </div>

            <span v-if="filter === 'closed'" class="selected-indicator"> Activo </span>
          </div>

          <strong>{{ closedCount }}</strong>

          <span class="stat-label"> Conversaciones cerradas </span>
        </button>
      </section>

      <!-- ERROR -->

      <div v-if="error" class="feedback feedback-error">
        <div class="feedback-icon">!</div>

        <div>
          <strong>Error al cargar conversaciones</strong>
          <span>{{ error }}</span>
        </div>

        <button type="button" @click="loadConversations">Reintentar</button>
      </div>

      <!-- INBOX -->

      <section class="inbox-card">
        <!-- INBOX HEADER -->

        <div class="inbox-header">
          <div>
            <div class="inbox-title-row">
              <h2>
                {{
                  filter === "all"
                    ? "Todas las conversaciones"
                    : filter === "active"
                      ? "Gestionadas por IA"
                      : filter === "human"
                        ? "Atención humana"
                        : "Conversaciones cerradas"
                }}
              </h2>

              <span class="conversation-count">
                {{ filteredConversations.length }}
              </span>
            </div>

            <p>
              {{
                filter === "human"
                  ? "Conversaciones que necesitan intervención de una persona."
                  : filter === "active"
                    ? "Conversaciones que está gestionando actualmente el agente."
                    : filter === "closed"
                      ? "Historial de conversaciones finalizadas."
                      : "Actividad reciente de tus clientes y del agente."
              }}
            </p>
          </div>

          <div class="inbox-legend">
            <span>
              <i class="legend-dot ai-dot"></i>
              IA
            </span>

            <span>
              <i class="legend-dot human-dot"></i>
              Humano
            </span>

            <span>
              <i class="legend-dot closed-dot"></i>
              Cerrada
            </span>
          </div>
        </div>

        <!-- LOADING -->

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>

          <div>
            <strong>Cargando conversaciones</strong>
            <span>Obteniendo la actividad más reciente...</span>
          </div>
        </div>

        <!-- EMPTY -->

        <div v-else-if="filteredConversations.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round" />
            </svg>
          </div>

          <h3>
            {{
              filter === "all"
                ? "Todavía no hay conversaciones"
                : filter === "active"
                  ? "No hay conversaciones activas"
                  : filter === "human"
                    ? "Todo está bajo control"
                    : "No hay conversaciones cerradas"
            }}
          </h3>

          <p>
            {{
              filter === "all"
                ? "Cuando tus clientes hablen con el agente, sus conversaciones aparecerán aquí."
                : filter === "human"
                  ? "Actualmente ninguna conversación necesita atención humana."
                  : "No hay conversaciones que coincidan con este filtro."
            }}
          </p>
        </div>

        <!-- LIST -->

        <div v-else class="conversation-list">
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            type="button"
            class="conversation-row"
            :class="`conversation-${conversation.status}`"
            @click="openConversation(conversation.id)">
            <!-- STATUS LINE -->

            <span class="row-status-line" :class="`line-${conversation.status}`"></span>

            <!-- ICON -->

            <div class="conversation-avatar" :class="`avatar-${conversation.status}`">
              <svg
                v-if="conversation.status !== 'active'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none">
                <path
                  v-if="conversation.status === 'human'"
                  d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round" />

                <template v-else>
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round" />

                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
                </template>
              </svg>

              <span v-else>✦</span>
            </div>

            <!-- MAIN -->

            <div class="conversation-main">
              <div class="conversation-title">
                <strong> Conversación #{{ conversation.id.slice(0, 8) }} </strong>

                <span class="status-badge" :class="`status-${conversation.status}`">
                  <i></i>
                  {{ getStatusLabel(conversation.status) }}
                </span>
              </div>

              <div class="conversation-meta">
                <span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linejoin="round" />
                  </svg>

                  {{ getChannelLabel(conversation.channel) }}
                </span>

                <span class="meta-divider"></span>

                <span> ID {{ conversation.id.slice(0, 8) }} </span>
              </div>
            </div>

            <!-- DATE -->

            <div class="conversation-date">
              <span>Última actividad</span>

              <strong>
                {{ formatDate(conversation.updated_at || conversation.created_at) }}
              </strong>
            </div>

            <!-- HUMAN ACTION -->

            <div v-if="conversation.status === 'human'" class="human-alert">
              <span>!</span>
              Cliente esperando
            </div>

            <!-- ARROW -->

            <div class="open-arrow">→</div>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.conversations-page {
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

  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
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
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

/* STATS */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  margin-bottom: 18px;
}

.stat-card {
  min-height: 115px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  padding: 13px;

  border: 1px solid var(--border);
  border-radius: 11px;

  background: var(--surface);

  font: inherit;
  text-align: left;

  cursor: pointer;

  box-shadow: var(--shadow-sm);

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
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

.stat-top {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 10px;
}

.stat-icon {
  width: 27px;
  height: 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  font-size: 10px;
}

.stat-icon.all {
  background: var(--primary-soft);
  color: var(--primary);
}

.stat-icon.ai {
  background: #eef2ff;
  color: #4f46e5;
}

.stat-icon.human {
  background: #fff7ed;
  color: #ea580c;
}

.stat-icon.closed {
  background: #f2f4f7;
  color: #667085;
}

.selected-indicator,
.attention-indicator {
  padding: 3px 6px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 600;
}

.selected-indicator {
  background: var(--primary-soft);
  color: var(--primary);
}

.attention-indicator {
  background: #fff7ed;
  color: #c2410c;
}

.stat-card > strong {
  color: var(--text);

  font-size: 20px;
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-label {
  margin-top: 5px;

  color: var(--text-muted);

  font-size: 8px;
}

/* INBOX */

.inbox-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.inbox-header {
  min-height: 64px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 12px 16px;

  border-bottom: 1px solid var(--border);
}

.inbox-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.inbox-header h2 {
  margin: 0;

  color: var(--text);

  font-size: 11px;
}

.conversation-count {
  min-width: 19px;
  height: 19px;

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

.inbox-header p {
  margin: 3px 0 0;

  color: var(--text-muted);

  font-size: 8px;
}

.inbox-legend {
  display: flex;
  align-items: center;
  gap: 12px;

  color: var(--text-muted);

  font-size: 7px;
}

.inbox-legend > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;
}

.ai-dot {
  background: #6366f1;
}

.human-dot {
  background: #f97316;
}

.closed-dot {
  background: #98a2b3;
}

/* LIST */

.conversation-list {
  display: flex;
  flex-direction: column;
}

.conversation-row {
  position: relative;

  width: 100%;
  min-height: 78px;

  display: grid;
  grid-template-columns:
    38px
    minmax(220px, 1fr)
    145px
    auto
    26px;
  align-items: center;
  gap: 13px;

  padding: 11px 15px;

  border: 0;
  border-bottom: 1px solid var(--border);

  background: white;

  font: inherit;
  text-align: left;

  cursor: pointer;

  transition: background 0.15s ease;
}

.conversation-row:last-child {
  border-bottom: 0;
}

.conversation-row:hover {
  background: #fafbfc;
}

.conversation-human {
  background: #fffdf9;
}

.conversation-human:hover {
  background: #fffaf2;
}

.row-status-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;

  width: 2px;

  background: transparent;
}

.line-active {
  background: #6366f1;
}

.line-human {
  background: #f97316;
}

.line-closed {
  background: #d0d5dd;
}

.conversation-avatar {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  font-size: 11px;
}

.avatar-active {
  background: #eef2ff;
  color: #4f46e5;
}

.avatar-human {
  background: #fff7ed;
  color: #ea580c;
}

.avatar-closed {
  background: #f2f4f7;
  color: #667085;
}

.conversation-main {
  min-width: 0;
}

.conversation-title {
  display: flex;
  align-items: center;
  gap: 7px;

  margin-bottom: 5px;
}

.conversation-title > strong {
  overflow: hidden;

  color: var(--text);

  font-size: 10px;
  font-weight: 600;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  padding: 3px 6px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 600;
}

.status-badge i {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: currentColor;
}

.status-active {
  background: #eef2ff;
  color: #4f46e5;
}

.status-human {
  background: #fff7ed;
  color: #c2410c;
}

.status-closed {
  background: #f2f4f7;
  color: #667085;
}

.conversation-meta {
  display: flex;
  align-items: center;
  gap: 7px;

  color: var(--text-muted);

  font-size: 7px;
}

.conversation-meta > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-divider {
  width: 3px;
  height: 3px;

  border-radius: 50%;

  background: #d0d5dd;
}

.conversation-date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conversation-date span {
  color: var(--text-muted);

  font-size: 7px;
}

.conversation-date strong {
  color: var(--text-secondary);

  font-size: 8px;
  font-weight: 500;
}

.human-alert {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 5px 7px;

  border-radius: 7px;

  background: #fff7ed;
  color: #c2410c;

  font-size: 7px;
  font-weight: 600;
}

.human-alert > span {
  width: 14px;
  height: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #ffedd5;

  font-size: 7px;
  font-weight: 700;
}

.open-arrow {
  color: #98a2b3;

  font-size: 14px;

  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.conversation-row:hover .open-arrow {
  color: var(--primary);
  transform: translateX(2px);
}

/* EMPTY */

.empty-state {
  min-height: 300px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 30px;

  text-align: center;
}

.empty-icon {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 12px;

  border-radius: 11px;

  background: var(--surface-soft);
  color: var(--text-muted);
}

.empty-state h3 {
  margin: 0;

  color: var(--text);

  font-size: 12px;
}

.empty-state p {
  max-width: 380px;

  margin: 5px 0 0;

  color: var(--text-muted);

  font-size: 9px;
  line-height: 1.6;
}

/* LOADING */

.loading-state {
  min-height: 250px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;

  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: rotate 0.7s linear infinite;
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

/* FEEDBACK */

.feedback {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 12px;
  padding: 10px 11px;

  border: 1px solid;
  border-radius: 9px;
}

.feedback-icon {
  width: 20px;
  height: 20px;

  flex: 0 0 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-size: 8px;
  font-weight: 700;
}

.feedback > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.feedback strong {
  font-size: 8px;
}

.feedback span {
  font-size: 8px;
}

.feedback > button {
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

.feedback-error {
  border-color: #fecaca;

  background: var(--danger-soft);
  color: var(--danger);
}

.feedback-error .feedback-icon {
  background: #fee2e2;
}

/* RESPONSIVE */

@media (max-width: 1050px) {
  .conversation-row {
    grid-template-columns:
      38px
      minmax(220px, 1fr)
      135px
      26px;
  }

  .human-alert {
    display: none;
  }
}

@media (max-width: 900px) {
  .conversations-page {
    padding: 30px 32px 60px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .conversation-row {
    grid-template-columns:
      38px
      minmax(180px, 1fr)
      120px
      26px;
  }

  .inbox-legend {
    display: none;
  }
}

@media (max-width: 760px) {
  .conversations-page {
    padding: 24px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }

  .conversation-row {
    grid-template-columns: 34px minmax(0, 1fr) 22px;
  }

  .conversation-date {
    display: none;
  }

  .conversation-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 520px) {
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
    grid-template-columns: 1fr 1fr;
    gap: 7px;
  }

  .stat-card {
    min-height: 105px;
  }

  .attention-indicator {
    display: none;
  }

  .inbox-header {
    align-items: flex-start;
  }

  .conversation-row {
    padding: 11px 10px;
  }

  .conversation-meta .meta-divider,
  .conversation-meta span:last-child {
    display: none;
  }
}
/* =========================
   CONVERSATION LIST TYPOGRAPHY FIX
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

  font-size: 14px;
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

.stat-icon {
  width: 30px;
  height: 30px;

  font-size: 12px;
}

.selected-indicator,
.attention-indicator {
  padding: 4px 7px;

  font-size: 10px;
}

.stat-card > strong {
  font-size: 24px;
}

.stat-label {
  margin-top: 6px;

  font-size: 12px;
}

/* =========================
   INBOX HEADER
========================= */

.inbox-header h2 {
  font-size: 16px;
}

.conversation-count {
  min-width: 22px;
  height: 22px;

  padding: 0 6px;

  font-size: 10px;
}

.inbox-header p {
  margin-top: 4px;

  font-size: 12px;
  line-height: 1.45;
}

.inbox-legend {
  font-size: 11px;
}

/* =========================
   CONVERSATION ROW
========================= */

.conversation-row {
  min-height: 88px;
}

.conversation-avatar {
  width: 38px;
  height: 38px;

  font-size: 13px;
}

/* Visitor / conversation title */

.conversation-title > strong {
  font-size: 14px;
}

/* AI / human / closed badge */

.status-badge {
  padding: 4px 7px;

  font-size: 10px;
}

.status-badge i {
  width: 5px;
  height: 5px;
}

/* Conversation metadata */

.conversation-meta {
  margin-top: 1px;

  font-size: 11px;
  line-height: 1.4;
}

/* =========================
   DATE
========================= */

.conversation-date {
  gap: 3px;
}

.conversation-date span {
  font-size: 10px;
}

.conversation-date strong {
  font-size: 12px;
}

/* =========================
   HUMAN HANDOFF
========================= */

.human-alert {
  padding: 6px 8px;

  font-size: 11px;
}

.human-alert > span {
  width: 17px;
  height: 17px;

  font-size: 9px;
}

/* =========================
   OPEN ARROW
========================= */

.open-arrow {
  font-size: 16px;
}

/* =========================
   EMPTY STATE
========================= */

.empty-state h3 {
  font-size: 16px;
}

.empty-state p {
  max-width: 400px;

  font-size: 13px;
  line-height: 1.6;
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
   FEEDBACK / ERROR
========================= */

.feedback-icon {
  width: 22px;
  height: 22px;

  flex: 0 0 22px;

  font-size: 9px;
}

.feedback strong {
  font-size: 13px;
}

.feedback span {
  font-size: 12px;
  line-height: 1.45;
}

.feedback > button {
  padding: 6px 9px;

  font-size: 12px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 760px) {
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
    min-height: 42px;

    font-size: 14px;
  }

  .stat-card > strong {
    font-size: 22px;
  }

  .stat-label {
    font-size: 12px;
  }

  .inbox-header h2 {
    font-size: 15px;
  }

  .inbox-header p {
    font-size: 12px;
  }

  .conversation-row {
    min-height: 86px;
  }

  .conversation-title > strong {
    font-size: 14px;
  }

  .conversation-meta {
    font-size: 11px;
  }

  .status-badge {
    font-size: 10px;
  }
}

@media (max-width: 520px) {
  .page-header h1 {
    font-size: 26px;
  }

  .stat-card {
    min-height: 110px;
  }

  .conversation-avatar {
    width: 36px;
    height: 36px;
  }

  .conversation-row {
    padding: 13px 11px;
  }
}
</style>
