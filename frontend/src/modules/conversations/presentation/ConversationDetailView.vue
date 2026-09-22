<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ConversationService } from "../infrastructure/ConversationService.js";

const route = useRoute();
const router = useRouter();

const conversationService = new ConversationService();

const conversation = ref(null);
const messages = ref([]);
const newMessage = ref("");
const sendingMessage = ref(false);

const handleSendMessage = async () => {
  const content = newMessage.value.trim();

  if (!content || sendingMessage.value) {
    return;
  }

  sendingMessage.value = true;
  actionError.value = "";

  try {
    const message = await conversationService.createMessage(conversationId, content);

    messages.value.push(message);
    newMessage.value = "";
  } catch (err) {
    console.error(err);

    actionError.value = err.message || "No se ha podido enviar el mensaje.";
  } finally {
    sendingMessage.value = false;
  }
};
const loading = ref(true);
const messagesLoading = ref(true);
const error = ref("");
const actionError = ref("");
const updatingStatus = ref(false);

const businessId = route.params.id;
const conversationId = route.params.conversationId;

const isHuman = computed(() => conversation.value?.status === "human");

const isClosed = computed(() => conversation.value?.status === "closed");

const isActive = computed(() => conversation.value?.status === "active");

const statusLabel = computed(() => {
  const labels = {
    active: "Activa",
    human: "Atención humana",
    closed: "Cerrada",
  };

  return labels[conversation.value?.status] || conversation.value?.status || "";
});

const statusClass = computed(() => {
  return `status-${conversation.value?.status}`;
});

const loadConversation = async () => {
  loading.value = true;
  error.value = "";

  try {
    conversation.value = await conversationService.getById(conversationId);
  } catch (err) {
    console.error(err);

    error.value = "No se ha podido cargar la conversación.";
  } finally {
    loading.value = false;
  }
};

const loadMessages = async () => {
  messagesLoading.value = true;

  try {
    messages.value = await conversationService.getMessages(conversationId);
  } catch (err) {
    console.error(err);

    error.value = "No se han podido cargar los mensajes.";
  } finally {
    messagesLoading.value = false;
  }
};

const updateStatus = async (status) => {
  actionError.value = "";
  updatingStatus.value = true;

  try {
    conversation.value = await conversationService.updateStatus(conversationId, status);
  } catch (err) {
    console.error(err);

    actionError.value = err.message || "No se ha podido actualizar la conversación.";
  } finally {
    updatingStatus.value = false;
  }
};

const handleReturnToAI = async () => {
  await updateStatus("active");
};

const handleClose = async () => {
  const confirmed = window.confirm("¿Seguro que quieres cerrar esta conversación?");

  if (!confirmed) {
    return;
  }

  await updateStatus("closed");
};

const handleReopen = async () => {
  await updateStatus("active");
};

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getRoleLabel = (role) => {
  const labels = {
    user: "Cliente",
    assistant: "Asistente",
    system: "Sistema",
  };

  return labels[role] || role;
};

const goBack = () => {
  router.push(`/businesses/${businessId}/conversations`);
};

onMounted(async () => {
  await loadConversation();
  await loadMessages();
});
</script>

<template>
  <main class="conversation-page">
    <div class="page-shell">
      <!-- =========================
           NAVEGACIÓN
      ========================== -->

      <nav class="breadcrumb">
        <button type="button" @click="goBack">← Conversaciones</button>

        <span>/</span>

        <span>
          {{ conversation?.id?.slice(0, 8) || "Detalle" }}
        </span>
      </nav>

      <!-- =========================
           LOADING
      ========================== -->

      <div v-if="loading" class="state-card">
        <div class="spinner"></div>

        <p>Cargando conversación...</p>
      </div>

      <!-- =========================
           ERROR
      ========================== -->

      <div v-else-if="error" class="state-card error-state">
        <div class="state-icon">!</div>

        <h2>No se ha podido cargar</h2>

        <p>
          {{ error }}
        </p>

        <button type="button" class="button button-primary" @click="loadConversation">Reintentar</button>
      </div>

      <!-- =========================
           CONVERSACIÓN
      ========================== -->

      <div v-else-if="conversation">
        <!-- =========================
             HEADER
        ========================== -->

        <header class="conversation-header">
          <div>
            <span class="eyebrow"> Conversación </span>

            <div class="title-row">
              <h1>#{{ conversation.id.slice(0, 8) }}</h1>

              <span class="status" :class="statusClass">
                {{ statusLabel }}
              </span>
            </div>

            <p>
              Iniciada el
              {{ formatDate(conversation.created_at) }}
            </p>
          </div>

          <div class="header-actions">
            <button
              v-if="isHuman"
              type="button"
              class="button button-primary"
              :disabled="updatingStatus"
              @click="handleReturnToAI">
              {{ updatingStatus ? "Actualizando..." : "↗ Devolver a IA" }}
            </button>

            <button
              v-if="isActive || isHuman"
              type="button"
              class="button button-secondary"
              :disabled="updatingStatus"
              @click="handleClose">
              Cerrar conversación
            </button>

            <button
              v-if="isClosed"
              type="button"
              class="button button-primary"
              :disabled="updatingStatus"
              @click="handleReopen">
              Reabrir conversación
            </button>
          </div>
        </header>

        <p v-if="actionError" class="action-error">
          {{ actionError }}
        </p>

        <!-- =========================
             META
        ========================== -->

        <section class="meta-grid">
          <div class="meta-card">
            <span>Estado</span>

            <strong>
              {{ statusLabel }}
            </strong>
          </div>

          <div class="meta-card">
            <span>Canal</span>

            <strong>
              {{ conversation.channel }}
            </strong>
          </div>

          <div class="meta-card">
            <span>Visitante</span>

            <strong class="visitor-id">
              {{ conversation.visitor_id }}
            </strong>
          </div>

          <div class="meta-card">
            <span>Última actividad</span>

            <strong>
              {{ formatDate(conversation.updated_at || conversation.created_at) }}
            </strong>
          </div>
        </section>

        <!-- =========================
             MENSAJES
        ========================== -->

        <section class="messages-section">
          <div class="section-heading">
            <div>
              <span class="section-eyebrow"> Historial </span>

              <h2>Mensajes</h2>

              <p>Historial completo de la conversación.</p>
            </div>

            <span class="count-badge">
              {{ messages.length }}
              {{ messages.length === 1 ? "mensaje" : "mensajes" }}
            </span>
          </div>

          <div v-if="messagesLoading" class="messages-state">
            <div class="spinner small"></div>

            <span> Cargando mensajes... </span>
          </div>

          <div v-else-if="messages.length === 0" class="messages-state empty">
            <div class="empty-icon">💬</div>

            <h3>No hay mensajes</h3>

            <p>Esta conversación todavía no tiene mensajes.</p>
          </div>

          <div v-else class="messages-container">
            <article
              v-for="message in messages"
              :key="message.id"
              class="message"
              :class="`message-${message.role}`">
              <div class="message-header">
                <strong>
                  {{ getRoleLabel(message.role) }}
                </strong>

                <span>
                  {{ formatDate(message.created_at) }}
                </span>
              </div>

              <div class="message-content">
                {{ message.content }}
              </div>
            </article>
          </div>
        </section>

        <form class="message-form" @submit.prevent="handleSendMessage">
          <textarea
            v-model="newMessage"
            placeholder="Escribe un mensaje..."
            rows="3"
            :disabled="sendingMessage"></textarea>

          <button type="submit" :disabled="sendingMessage || !newMessage.trim()">
            {{ sendingMessage ? "Enviando..." : "Enviar mensaje" }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.message-form {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.message-form textarea {
  flex: 1;
  resize: vertical;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font: inherit;
}

.message-form button {
  align-self: flex-end;
  padding: 12px 18px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.message-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .message-form {
    flex-direction: column;
  }

  .message-form button {
    align-self: stretch;
  }
}
.conversation-page {
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

.breadcrumb button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #475569;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.breadcrumb button:hover {
  color: #0f172a;
}

/* =========================
   HEADER
========================= */

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  padding: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.conversation-header h1 {
  margin: 6px 0 8px;
  font-size: 32px;
  letter-spacing: -0.03em;
}

.conversation-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
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

/* =========================
   STATUS
========================= */

.status {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
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

/* =========================
   META
========================= */

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 40px;
}

.meta-card {
  min-width: 0;
  padding: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}

.meta-card span {
  display: block;
  margin-bottom: 7px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.meta-card strong {
  display: block;
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visitor-id {
  font-family: monospace;
  font-size: 12px !important;
}

/* =========================
   MENSAJES
========================= */

.messages-section {
  margin-bottom: 50px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 6px 0;
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

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  box-shadow: 0 5px 20px rgba(15, 23, 42, 0.025);
}

.message {
  max-width: 78%;
  padding: 15px 17px;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
}

.message-user {
  align-self: flex-start;
  background: #f8fafc;
}

.message-assistant {
  align-self: flex-end;
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.message-system {
  align-self: center;
  max-width: 90%;
  background: #f8fafc;
  border-style: dashed;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 8px;
}

.message-header strong {
  font-size: 12px;
}

.message-header span {
  color: #94a3b8;
  font-size: 11px;
}

.message-assistant .message-header span {
  color: #94a3b8;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.55;
  font-size: 14px;
}

.message-user .message-content {
  color: #334155;
}

.message-assistant .message-content {
  color: #f8fafc;
}

/* =========================
   STATES
========================= */

.messages-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  padding: 30px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  color: #64748b;
}

.messages-state.empty {
  flex-direction: column;
  text-align: center;
}

.messages-state.empty h3 {
  margin: 0;
  color: #0f172a;
}

.messages-state.empty p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #f1f5f9;
  font-size: 22px;
}

.action-error {
  margin: -12px 0 28px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
}

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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 900px) {
  .conversation-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .page-shell {
    width: min(100% - 24px, 680px);
    padding-top: 20px;
  }

  .conversation-header {
    padding: 22px;
  }

  .conversation-header h1 {
    font-size: 26px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .header-actions .button {
    width: 100%;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .messages-container {
    padding: 14px;
  }

  .message {
    max-width: 92%;
  }
}

@media (max-width: 480px) {
  .conversation-header {
    padding: 18px;
  }

  .title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .message {
    max-width: 100%;
  }

  .message-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }
}
</style>
