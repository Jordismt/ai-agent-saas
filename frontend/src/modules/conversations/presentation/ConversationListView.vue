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
    active: "Activa",
    human: "Atención humana",
    closed: "Cerrada",
  };

  return labels[status] || status;
};

onMounted(loadConversations);
</script>

<template>
  <main class="conversations-page">
    <header class="page-header">
      <div>
        <button type="button" class="back-button" @click="router.push(`/businesses/${businessId}`)">
          ← Volver al negocio
        </button>

        <h1>Conversaciones</h1>

        <p>Consulta y gestiona las conversaciones de tus clientes.</p>
      </div>

      <button type="button" class="refresh-button" :disabled="loading" @click="loadConversations">
        {{ loading ? "Actualizando..." : "Actualizar" }}
      </button>
    </header>

    <section class="stats-grid">
      <button type="button" class="stat-card" :class="{ selected: filter === 'all' }" @click="filter = 'all'">
        <span class="stat-label"> Todas </span>

        <strong>
          {{ conversations.length }}
        </strong>
      </button>

      <button
        type="button"
        class="stat-card"
        :class="{ selected: filter === 'active' }"
        @click="filter = 'active'">
        <span class="stat-label"> Activas </span>

        <strong>
          {{ activeCount }}
        </strong>
      </button>

      <button
        type="button"
        class="stat-card"
        :class="{ selected: filter === 'human' }"
        @click="filter = 'human'">
        <span class="stat-label"> Atención humana </span>

        <strong>
          {{ humanCount }}
        </strong>
      </button>

      <button
        type="button"
        class="stat-card"
        :class="{ selected: filter === 'closed' }"
        @click="filter = 'closed'">
        <span class="stat-label"> Cerradas </span>

        <strong>
          {{ closedCount }}
        </strong>
      </button>
    </section>

    <p v-if="error" class="error-message">
      {{ error }}
    </p>

    <section v-if="loading" class="empty-state">
      <p>Cargando conversaciones...</p>
    </section>

    <section v-else-if="filteredConversations.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>

      <h2>No hay conversaciones</h2>

      <p>Cuando tus clientes hablen con el agente, aparecerán aquí.</p>
    </section>

    <section v-else class="conversation-list">
      <button
        v-for="conversation in filteredConversations"
        :key="conversation.id"
        type="button"
        class="conversation-card"
        @click="openConversation(conversation.id)">
        <div class="conversation-main">
          <div class="conversation-icon">💬</div>

          <div class="conversation-info">
            <div class="conversation-title">
              <strong> Conversación #{{ conversation.id.slice(0, 8) }} </strong>

              <span class="status" :class="`status-${conversation.status}`">
                {{ getStatusLabel(conversation.status) }}
              </span>
            </div>

            <p>
              Canal:
              {{ conversation.channel }}
            </p>

            <small>
              {{ formatDate(conversation.updated_at || conversation.created_at) }}
            </small>
          </div>
        </div>

        <span class="arrow"> → </span>
      </button>
    </section>
  </main>
</template>

<style scoped>
.conversations-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 12px 0 8px;
  font-size: 36px;
  line-height: 1.1;
}

.page-header p {
  margin: 0;
  color: #64748b;
}

.back-button,
.refresh-button {
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.back-button {
  padding: 0;
  color: #64748b;
}

.back-button:hover {
  color: #0f172a;
}

.refresh-button {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #0f172a;
}

.refresh-button:hover:not(:disabled) {
  background: #f8fafc;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.selected {
  border-color: #0f172a;
}

.stat-label {
  color: #64748b;
  font-size: 14px;
}

.stat-card strong {
  font-size: 28px;
  color: #0f172a;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.conversation-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.conversation-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.conversation-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #f1f5f9;
}

.conversation-info {
  min-width: 0;
}

.conversation-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.conversation-title strong {
  color: #0f172a;
}

.conversation-info p {
  margin: 6px 0 2px;
  color: #64748b;
  font-size: 14px;
}

.conversation-info small {
  color: #94a3b8;
}

.status {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-human {
  background: #fef3c7;
  color: #92400e;
}

.status-closed {
  background: #f1f5f9;
  color: #475569;
}

.arrow {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 20px;
}

.empty-state {
  padding: 70px 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  text-align: center;
  background: #f8fafc;
}

.empty-icon {
  margin-bottom: 12px;
  font-size: 36px;
}

.empty-state h2 {
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

.error-message {
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
}

@media (max-width: 800px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .conversations-page {
    padding: 28px 16px 40px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .conversation-card {
    padding: 16px;
  }
}
</style>
