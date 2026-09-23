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
    active: "IA activa",
    human: "Atención humana",
    closed: "Cerrada",
  };

  return labels[conversation.value?.status] || conversation.value?.status || "";
});

const statusClass = computed(() => {
  return `status-${conversation.value?.status}`;
});

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
    assistant: "Agente IA",
    system: "Sistema",
  };

  return labels[role] || role;
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

const goBack = () => {
  router.push(`/businesses/${businessId}/conversations`);
};

onMounted(async () => {
  await loadConversation();
  await loadMessages();
});
</script>

<template>
  <div class="conversation-page">
    <div class="page-container">
      <!-- BREADCRUMB -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <button type="button" @click="goBack">Conversaciones</button>

        <span>/</span>

        <span> #{{ conversation?.id?.slice(0, 8) || "Detalle" }} </span>
      </nav>

      <!-- LOADING -->

      <section v-if="loading" class="state-card">
        <div class="spinner"></div>

        <div>
          <strong>Cargando conversación</strong>
          <span>Obteniendo la información más reciente...</span>
        </div>
      </section>

      <!-- ERROR -->

      <section v-else-if="error && !conversation" class="state-card error-state">
        <div class="state-icon">!</div>

        <h2>No se ha podido cargar</h2>

        <p>{{ error }}</p>

        <button type="button" class="primary-button" @click="loadConversation">Reintentar</button>
      </section>

      <!-- CONVERSATION -->

      <template v-else-if="conversation">
        <!-- TOP HEADER -->

        <header class="conversation-header">
          <div class="conversation-identity">
            <div class="conversation-avatar" :class="`avatar-${conversation.status}`">
              <span v-if="isActive">✦</span>

              <svg v-else-if="isHuman" width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round" />
              </svg>

              <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 12 2 2 4-4"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round" />

                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
              </svg>
            </div>

            <div>
              <div class="conversation-title">
                <h1>Conversación #{{ conversation.id.slice(0, 8) }}</h1>

                <span class="status-badge" :class="statusClass">
                  <i></i>

                  {{ statusLabel }}
                </span>
              </div>

              <div class="header-meta">
                <span>
                  {{ getChannelLabel(conversation.channel) }}
                </span>

                <i></i>

                <span> Iniciada {{ formatDate(conversation.created_at) }} </span>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button
              v-if="isHuman"
              type="button"
              class="primary-button"
              :disabled="updatingStatus"
              @click="handleReturnToAI">
              <span>✦</span>

              {{ updatingStatus ? "Actualizando..." : "Devolver a IA" }}
            </button>

            <button
              v-if="isActive || isHuman"
              type="button"
              class="secondary-button"
              :disabled="updatingStatus"
              @click="handleClose">
              Cerrar conversación
            </button>

            <button
              v-if="isClosed"
              type="button"
              class="primary-button"
              :disabled="updatingStatus"
              @click="handleReopen">
              {{ updatingStatus ? "Actualizando..." : "Reabrir conversación" }}
            </button>
          </div>
        </header>

        <!-- ERROR ACTION -->

        <div v-if="actionError" class="action-error">
          <span>!</span>

          <div>
            <strong>No se ha podido completar la acción</strong>
            <p>{{ actionError }}</p>
          </div>
        </div>

        <!-- HUMAN ALERT -->

        <div v-if="isHuman" class="human-notice">
          <div class="notice-icon">!</div>

          <div>
            <strong>Esta conversación necesita atención</strong>

            <p>
              El agente ha transferido la conversación. Puedes responder al cliente manualmente o devolver el
              control a la IA.
            </p>
          </div>

          <span class="waiting-badge"> Cliente esperando </span>
        </div>

        <!-- CLOSED ALERT -->

        <div v-if="isClosed" class="closed-notice">
          <div class="closed-icon">✓</div>

          <div>
            <strong>Conversación cerrada</strong>

            <p>Esta conversación está finalizada. Puedes consultar todo el historial o volver a abrirla.</p>
          </div>
        </div>

        <!-- MAIN APP -->

        <div class="conversation-workspace">
          <!-- CHAT -->

          <section class="chat-panel">
            <!-- CHAT HEADER -->

            <div class="chat-header">
              <div>
                <div class="chat-title">
                  <h2>Mensajes</h2>

                  <span class="message-count">
                    {{ messages.length }}
                  </span>
                </div>

                <p>Historial completo de la conversación</p>
              </div>

              <div class="chat-status">
                <span
                  class="live-dot"
                  :class="{
                    human: isHuman,
                    closed: isClosed,
                  }"></span>

                <span>
                  {{ isActive ? "Gestionando la IA" : isHuman ? "Atención manual" : "Finalizada" }}
                </span>
              </div>
            </div>

            <!-- MESSAGES -->

            <div class="messages-area">
              <div v-if="messagesLoading" class="messages-state">
                <div class="spinner small"></div>

                <span>Cargando mensajes...</span>
              </div>

              <div v-else-if="messages.length === 0" class="messages-state empty">
                <div class="empty-message-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linejoin="round" />
                  </svg>
                </div>

                <strong>No hay mensajes todavía</strong>

                <span> Esta conversación todavía no contiene mensajes. </span>
              </div>

              <div v-else class="messages-list">
                <article
                  v-for="message in messages"
                  :key="message.id"
                  class="message-wrapper"
                  :class="`wrapper-${message.role}`">
                  <!-- SYSTEM -->

                  <div v-if="message.role === 'system'" class="system-message">
                    <span>i</span>

                    <p>{{ message.content }}</p>

                    <time>
                      {{ formatDate(message.created_at) }}
                    </time>
                  </div>

                  <!-- NORMAL -->

                  <template v-else>
                    <div class="message-avatar" :class="`message-avatar-${message.role}`">
                      <span v-if="message.role === 'assistant'"> ✦ </span>

                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round" />
                      </svg>
                    </div>

                    <div class="message-column">
                      <div class="message-meta">
                        <strong>
                          {{ getRoleLabel(message.role) }}
                        </strong>

                        <span>
                          {{ formatDate(message.created_at) }}
                        </span>
                      </div>

                      <div class="message-bubble" :class="`bubble-${message.role}`">
                        {{ message.content }}
                      </div>
                    </div>
                  </template>
                </article>
              </div>
            </div>

            <!-- COMPOSER -->

            <div class="composer-container" :class="{ closed: isClosed }">
              <div v-if="isActive" class="composer-context ai-context">
                <span>✦</span>

                <p>
                  La IA está gestionando esta conversación. Puedes enviar un mensaje manual si necesitas
                  intervenir.
                </p>
              </div>

              <div v-else-if="isHuman" class="composer-context human-context">
                <span>●</span>

                <p>Estás respondiendo manualmente al cliente.</p>
              </div>

              <div v-else class="composer-context closed-context">
                <span>✓</span>

                <p>Reabre la conversación para continuar respondiendo.</p>
              </div>

              <form class="message-form" @submit.prevent="handleSendMessage">
                <textarea
                  v-model="newMessage"
                  rows="3"
                  :disabled="sendingMessage || isClosed"
                  :placeholder="
                    isClosed
                      ? 'La conversación está cerrada'
                      : isHuman
                        ? 'Escribe una respuesta al cliente...'
                        : 'Escribe un mensaje manual...'
                  "></textarea>

                <div class="composer-footer">
                  <div class="composer-info">
                    <span
                      class="composer-status-dot"
                      :class="{
                        human: isHuman,
                        closed: isClosed,
                      }"></span>

                    <span>
                      {{
                        isClosed
                          ? "Conversación cerrada"
                          : isHuman
                            ? "Respuesta humana"
                            : "Intervención manual"
                      }}
                    </span>
                  </div>

                  <button
                    type="submit"
                    class="send-button"
                    :disabled="sendingMessage || !newMessage.trim() || isClosed">
                    <span v-if="sendingMessage" class="button-spinner"></span>

                    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="m22 2-7 20-4-9-9-4 20-7Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>

                    {{ sendingMessage ? "Enviando..." : "Enviar" }}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <!-- DETAILS SIDEBAR -->

          <aside class="details-panel">
            <div class="details-header">
              <div>
                <span class="details-eyebrow"> Información </span>

                <h2>Detalles</h2>
              </div>

              <span class="mini-status" :class="statusClass">
                <i></i>

                {{ statusLabel }}
              </span>
            </div>

            <!-- CUSTOMER -->

            <div class="detail-section">
              <span class="section-label"> Cliente </span>

              <div class="customer-card">
                <div class="customer-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round" />
                  </svg>
                </div>

                <div>
                  <strong>Visitante</strong>

                  <span> ID {{ conversation.visitor_id?.slice(0, 12) || "—" }} </span>
                </div>
              </div>
            </div>

            <!-- INFO -->

            <div class="detail-section">
              <span class="section-label"> Conversación </span>

              <div class="detail-list">
                <div class="detail-row">
                  <div class="detail-row-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linejoin="round" />
                    </svg>
                  </div>

                  <div>
                    <span>Canal</span>

                    <strong>
                      {{ getChannelLabel(conversation.channel) }}
                    </strong>
                  </div>
                </div>

                <div class="detail-row">
                  <div class="detail-row-icon">◷</div>

                  <div>
                    <span>Iniciada</span>

                    <strong>
                      {{ formatDate(conversation.created_at) }}
                    </strong>
                  </div>
                </div>

                <div class="detail-row">
                  <div class="detail-row-icon">↻</div>

                  <div>
                    <span>Última actividad</span>

                    <strong>
                      {{ formatDate(conversation.updated_at || conversation.created_at) }}
                    </strong>
                  </div>
                </div>

                <div class="detail-row">
                  <div class="detail-row-icon">#</div>

                  <div>
                    <span>ID conversación</span>

                    <strong class="monospace">
                      {{ conversation.id.slice(0, 12) }}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- STATUS DESCRIPTION -->

            <div class="detail-section">
              <span class="section-label"> Gestión </span>

              <div class="management-card" :class="`management-${conversation.status}`">
                <div class="management-icon" :class="`management-icon-${conversation.status}`">
                  <span v-if="isActive">✦</span>
                  <span v-else-if="isHuman">!</span>
                  <span v-else>✓</span>
                </div>

                <div>
                  <strong>
                    {{ isActive ? "Gestionada por IA" : isHuman ? "Gestión manual" : "Finalizada" }}
                  </strong>

                  <p>
                    {{
                      isActive
                        ? "El agente está respondiendo automáticamente al cliente."
                        : isHuman
                          ? "El agente ha transferido la conversación para atención humana."
                          : "La conversación ya no acepta nuevos mensajes."
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ACTIONS -->

            <div class="detail-actions">
              <button
                v-if="isHuman"
                type="button"
                class="detail-primary-button"
                :disabled="updatingStatus"
                @click="handleReturnToAI">
                <span>✦</span>

                Devolver a IA
              </button>

              <button
                v-if="isActive || isHuman"
                type="button"
                class="detail-secondary-button"
                :disabled="updatingStatus"
                @click="handleClose">
                Cerrar conversación
              </button>

              <button
                v-if="isClosed"
                type="button"
                class="detail-primary-button"
                :disabled="updatingStatus"
                @click="handleReopen">
                Reabrir conversación
              </button>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.conversation-page {
  min-height: 100vh;
  padding: 28px 40px 60px;
}

.page-container {
  width: min(1240px, 100%);
  margin: 0 auto;
}

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-bottom: 20px;

  color: var(--text-muted);

  font-size: 10px;
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

/* =========================
   HEADER
========================= */

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;

  margin-bottom: 14px;
  padding: 14px 16px;

  border: 1px solid var(--border);
  border-radius: 12px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.conversation-identity {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 11px;
}

.conversation-avatar {
  width: 38px;
  height: 38px;

  flex: 0 0 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  font-size: 13px;
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

.conversation-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conversation-title h1 {
  margin: 0;

  color: var(--text);

  font-size: 13px;
  letter-spacing: -0.015em;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-top: 4px;

  color: var(--text-muted);

  font-size: 8px;
}

.header-meta > i {
  width: 3px;
  height: 3px;

  border-radius: 50%;

  background: #d0d5dd;
}

.status-badge,
.mini-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  padding: 3px 6px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 600;
}

.status-badge i,
.mini-status i {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

/* BUTTONS */

.primary-button,
.secondary-button,
.detail-primary-button,
.detail-secondary-button {
  min-height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 0 10px;

  border-radius: 7px;

  font: inherit;
  font-size: 8px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.primary-button,
.detail-primary-button {
  border: 1px solid transparent;

  background: var(--primary);
  color: white;
}

.primary-button:hover:not(:disabled),
.detail-primary-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.secondary-button,
.detail-secondary-button {
  border: 1px solid var(--border);

  background: white;
  color: var(--text-secondary);
}

.secondary-button:hover:not(:disabled),
.detail-secondary-button:hover:not(:disabled) {
  border-color: #cbd5e1;

  background: var(--surface-soft);
  color: var(--text);
}

.primary-button:disabled,
.secondary-button:disabled,
.detail-primary-button:disabled,
.detail-secondary-button:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}

/* =========================
   NOTICES
========================= */

.human-notice,
.closed-notice {
  display: flex;
  align-items: center;
  gap: 10px;

  margin-bottom: 14px;
  padding: 10px 12px;

  border: 1px solid;
  border-radius: 9px;
}

.human-notice {
  border-color: #fed7aa;

  background: #fffaf5;
}

.closed-notice {
  border-color: #e2e8f0;

  background: #f8fafc;
}

.notice-icon,
.closed-icon {
  width: 25px;
  height: 25px;

  flex: 0 0 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  font-size: 9px;
  font-weight: 700;
}

.notice-icon {
  background: #ffedd5;
  color: #c2410c;
}

.closed-icon {
  background: #e2e8f0;
  color: #475569;
}

.human-notice > div:nth-child(2),
.closed-notice > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.human-notice strong,
.closed-notice strong {
  color: var(--text);

  font-size: 8px;
}

.human-notice p,
.closed-notice p {
  margin: 0;

  color: var(--text-secondary);

  font-size: 7px;
}

.waiting-badge {
  margin-left: auto;
  padding: 4px 7px;

  border-radius: 999px;

  background: #ffedd5;
  color: #c2410c;

  font-size: 7px;
  font-weight: 600;
}

/* =========================
   WORKSPACE
========================= */

.conversation-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 285px;

  overflow: hidden;

  min-height: 680px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

/* =========================
   CHAT
========================= */

.chat-panel {
  min-width: 0;

  display: flex;
  flex-direction: column;

  border-right: 1px solid var(--border);
}

.chat-header {
  min-height: 59px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 10px 15px;

  border-bottom: 1px solid var(--border);

  background: white;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-title h2 {
  margin: 0;

  color: var(--text);

  font-size: 10px;
}

.message-count {
  min-width: 17px;
  height: 17px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 4px;

  border-radius: 999px;

  background: var(--surface-soft);
  color: var(--text-muted);

  font-size: 7px;
}

.chat-header p {
  margin: 3px 0 0;

  color: var(--text-muted);

  font-size: 7px;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 5px;

  color: var(--text-muted);

  font-size: 7px;
}

.live-dot,
.composer-status-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #6366f1;
}

.live-dot.human,
.composer-status-dot.human {
  background: #f97316;
}

.live-dot.closed,
.composer-status-dot.closed {
  background: #98a2b3;
}

/* MESSAGES */

.messages-area {
  flex: 1;

  min-height: 450px;
  max-height: 600px;

  overflow-y: auto;

  padding: 22px 20px;

  background: #f8fafc;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 7px;
}

.wrapper-user {
  justify-content: flex-start;
}

.wrapper-assistant {
  justify-content: flex-end;
}

.wrapper-system {
  justify-content: center;
}

.message-avatar {
  width: 25px;
  height: 25px;

  flex: 0 0 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  font-size: 8px;
}

.message-avatar-user {
  background: #e2e8f0;
  color: #475569;
}

.message-avatar-assistant {
  order: 2;

  background: #0f172a;
  color: #93c5fd;
}

.message-column {
  max-width: 72%;
}

.wrapper-assistant .message-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 4px;
}

.message-meta strong {
  color: var(--text-secondary);

  font-size: 7px;
}

.message-meta span {
  color: var(--text-muted);

  font-size: 6px;
}

.message-bubble {
  padding: 9px 11px;

  border-radius: 10px;

  font-size: 9px;
  line-height: 1.6;

  white-space: pre-wrap;
}

.bubble-user {
  border: 1px solid var(--border);
  border-bottom-left-radius: 3px;

  background: white;
  color: var(--text-secondary);
}

.bubble-assistant {
  border-bottom-right-radius: 3px;

  background: #0f172a;
  color: #f8fafc;
}

.system-message {
  max-width: 80%;

  display: flex;
  align-items: center;
  gap: 7px;

  padding: 7px 9px;

  border: 1px dashed #d0d5dd;
  border-radius: 8px;

  background: rgba(255, 255, 255, 0.7);

  color: var(--text-muted);
}

.system-message > span {
  width: 16px;
  height: 16px;

  flex: 0 0 16px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #f2f4f7;

  font-size: 6px;
  font-weight: 700;
}

.system-message p {
  flex: 1;

  margin: 0;

  font-size: 7px;
  line-height: 1.5;
}

.system-message time {
  font-size: 6px;
}

/* =========================
   COMPOSER
========================= */

.composer-container {
  padding: 10px 12px 12px;

  border-top: 1px solid var(--border);

  background: white;
}

.composer-container.closed {
  background: #fafafa;
}

.composer-context {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 7px;
  padding: 6px 8px;

  border-radius: 6px;
}

.composer-context > span {
  font-size: 7px;
}

.composer-context p {
  margin: 0;

  font-size: 7px;
}

.ai-context {
  background: #f5f3ff;
  color: #6d28d9;
}

.human-context {
  background: #fff7ed;
  color: #c2410c;
}

.closed-context {
  background: #f2f4f7;
  color: #667085;
}

.message-form {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 9px;

  background: white;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.message-form:focus-within {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.06);
}

.message-form textarea {
  width: 100%;
  min-height: 64px;

  box-sizing: border-box;

  display: block;

  padding: 9px 10px;

  border: 0;

  background: transparent;
  color: var(--text);

  font: inherit;
  font-size: 9px;
  line-height: 1.5;

  outline: none;

  resize: none;
}

.message-form textarea::placeholder {
  color: #98a2b3;
}

.message-form textarea:disabled {
  cursor: not-allowed;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  padding: 7px 8px;

  border-top: 1px solid var(--border);

  background: #fcfcfd;
}

.composer-info {
  display: flex;
  align-items: center;
  gap: 5px;

  color: var(--text-muted);

  font-size: 7px;
}

.send-button {
  min-height: 30px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  padding: 0 9px;

  border: 0;
  border-radius: 6px;

  background: var(--primary);
  color: white;

  font: inherit;
  font-size: 8px;
  font-weight: 600;

  cursor: pointer;
}

.send-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.send-button:disabled {
  opacity: 0.45;

  cursor: not-allowed;
}

/* =========================
   DETAILS
========================= */

.details-panel {
  min-width: 0;

  background: white;
}

.details-header {
  min-height: 59px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  padding: 10px 13px;

  border-bottom: 1px solid var(--border);
}

.details-eyebrow {
  color: var(--text-muted);

  font-size: 6px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.details-header h2 {
  margin: 2px 0 0;

  color: var(--text);

  font-size: 10px;
}

.detail-section {
  padding: 14px 13px;

  border-bottom: 1px solid var(--border);
}

.section-label {
  display: block;

  margin-bottom: 9px;

  color: var(--text-muted);

  font-size: 6px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.customer-card {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-avatar {
  width: 31px;
  height: 31px;

  flex: 0 0 31px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: var(--surface-soft);
  color: var(--text-secondary);
}

.customer-card > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-card strong {
  color: var(--text);

  font-size: 8px;
}

.customer-card span {
  overflow: hidden;

  color: var(--text-muted);

  font-family: monospace;
  font-size: 7px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.detail-row {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-row-icon {
  width: 25px;
  height: 25px;

  flex: 0 0 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: var(--surface-soft);
  color: var(--text-muted);

  font-size: 8px;
}

.detail-row > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 1px;
}

.detail-row span {
  color: var(--text-muted);

  font-size: 6px;
}

.detail-row strong {
  overflow: hidden;

  color: var(--text-secondary);

  font-size: 7px;
  font-weight: 500;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.monospace {
  font-family: monospace;
}

/* MANAGEMENT */

.management-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  padding: 9px;

  border: 1px solid;
  border-radius: 8px;
}

.management-active {
  border-color: #e0e7ff;

  background: #f8f9ff;
}

.management-human {
  border-color: #fed7aa;

  background: #fffaf5;
}

.management-closed {
  border-color: #e2e8f0;

  background: #f8fafc;
}

.management-icon {
  width: 23px;
  height: 23px;

  flex: 0 0 23px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  font-size: 8px;
  font-weight: 700;
}

.management-icon-active {
  background: #eef2ff;
  color: #4f46e5;
}

.management-icon-human {
  background: #ffedd5;
  color: #c2410c;
}

.management-icon-closed {
  background: #e2e8f0;
  color: #667085;
}

.management-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.management-card strong {
  color: var(--text);

  font-size: 7px;
}

.management-card p {
  margin: 0;

  color: var(--text-secondary);

  font-size: 6px;
  line-height: 1.5;
}

/* DETAIL ACTIONS */

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;

  padding: 13px;
}

.detail-primary-button,
.detail-secondary-button {
  width: 100%;
}

/* =========================
   ACTION ERROR
========================= */

.action-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  margin-bottom: 12px;
  padding: 9px 10px;

  border: 1px solid #fecaca;
  border-radius: 8px;

  background: var(--danger-soft);
  color: var(--danger);
}

.action-error > span {
  width: 18px;
  height: 18px;

  flex: 0 0 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #fee2e2;

  font-size: 7px;
  font-weight: 700;
}

.action-error strong {
  display: block;

  font-size: 8px;
}

.action-error p {
  margin: 2px 0 0;

  font-size: 7px;
}

/* =========================
   STATES
========================= */

.state-card {
  min-height: 300px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 30px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.state-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.state-card strong {
  color: var(--text);

  font-size: 9px;
}

.state-card span {
  color: var(--text-muted);

  font-size: 8px;
}

.error-state {
  flex-direction: column;

  text-align: center;
}

.error-state h2 {
  margin: 7px 0 0;

  color: var(--text);

  font-size: 13px;
}

.error-state p {
  margin: 0 0 8px;

  color: var(--text-muted);

  font-size: 9px;
}

.state-icon {
  width: 35px;
  height: 35px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: var(--danger-soft);
  color: var(--danger);

  font-size: 10px;
  font-weight: 700;
}

.messages-state {
  min-height: 300px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  color: var(--text-muted);

  font-size: 8px;
}

.messages-state.empty {
  flex-direction: column;

  text-align: center;
}

.empty-message-icon {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 3px;

  border-radius: 10px;

  background: white;
  color: var(--text-muted);

  box-shadow: var(--shadow-sm);
}

.messages-state strong {
  color: var(--text);

  font-size: 9px;
}

.spinner {
  width: 20px;
  height: 20px;

  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

.spinner.small {
  width: 15px;
  height: 15px;
}

.button-spinner {
  width: 9px;
  height: 9px;

  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   SCROLLBAR
========================= */

.messages-area::-webkit-scrollbar {
  width: 5px;
}

.messages-area::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background: #d0d5dd;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1000px) {
  .conversation-workspace {
    grid-template-columns: minmax(0, 1fr) 250px;
  }
}

@media (max-width: 850px) {
  .conversation-page {
    padding: 26px 28px 50px;
  }

  .conversation-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .conversation-workspace {
    grid-template-columns: 1fr;
  }

  .chat-panel {
    border-right: 0;
  }

  .details-panel {
    border-top: 1px solid var(--border);
  }

  .detail-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .detail-actions {
    flex-direction: row;
  }
}

@media (max-width: 650px) {
  .conversation-page {
    padding: 22px 18px 40px;
  }

  .conversation-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .header-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .header-meta > i {
    display: none;
  }

  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions button {
    width: 100%;
  }

  .human-notice {
    align-items: flex-start;
  }

  .waiting-badge {
    display: none;
  }

  .messages-area {
    padding: 18px 12px;
  }

  .message-column {
    max-width: 85%;
  }

  .detail-list {
    display: flex;
  }

  .detail-actions {
    flex-direction: column;
  }
}

@media (max-width: 450px) {
  .conversation-identity {
    align-items: flex-start;
  }

  .conversation-avatar {
    width: 34px;
    height: 34px;

    flex-basis: 34px;
  }

  .message-column {
    max-width: calc(100% - 34px);
  }

  .system-message {
    max-width: 100%;
  }

  .chat-status {
    display: none;
  }
}

/* =========================
   CONVERSATION DETAIL TYPOGRAPHY FIX
========================= */

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  font-size: 13px;
}

/* =========================
   CONVERSATION HEADER
========================= */

.conversation-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;

  font-size: 14px;
}

.conversation-title h1 {
  font-size: 17px;
  line-height: 1.3;
}

.header-meta {
  margin-top: 5px;

  font-size: 11px;
  line-height: 1.4;
}

.status-badge,
.mini-status {
  padding: 4px 7px;

  font-size: 10px;
}

.status-badge i,
.mini-status i {
  width: 5px;
  height: 5px;
}

/* =========================
   HEADER BUTTONS
========================= */

.primary-button,
.secondary-button,
.detail-primary-button,
.detail-secondary-button {
  min-height: 40px;

  padding: 0 13px;

  font-size: 13px;
}

/* =========================
   NOTICES
========================= */

.notice-icon,
.closed-icon {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;

  font-size: 11px;
}

.human-notice strong,
.closed-notice strong {
  font-size: 13px;
}

.human-notice p,
.closed-notice p {
  margin-top: 2px;

  font-size: 11px;
  line-height: 1.45;
}

.waiting-badge {
  padding: 5px 8px;

  font-size: 10px;
}

/* =========================
   CHAT HEADER
========================= */

.chat-title h2 {
  font-size: 15px;
}

.message-count {
  min-width: 21px;
  height: 21px;

  padding: 0 6px;

  font-size: 10px;
}

.chat-header p {
  margin-top: 4px;

  font-size: 11px;
}

.chat-status {
  font-size: 11px;
}

/* =========================
   MESSAGES
========================= */

.messages-list {
  gap: 19px;
}

.message-wrapper {
  gap: 9px;
}

.message-avatar {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;

  font-size: 10px;
}

.message-column {
  max-width: 76%;
}

.message-meta {
  margin-bottom: 5px;
}

.message-meta strong {
  font-size: 11px;
}

.message-meta span {
  font-size: 10px;
}

.message-bubble {
  padding: 10px 13px;

  font-size: 14px;
  line-height: 1.55;
}

/* =========================
   SYSTEM MESSAGES
========================= */

.system-message {
  padding: 8px 10px;
}

.system-message > span {
  width: 19px;
  height: 19px;
  flex: 0 0 19px;

  font-size: 8px;
}

.system-message p {
  font-size: 11px;
  line-height: 1.5;
}

.system-message time {
  font-size: 10px;
}

/* =========================
   COMPOSER CONTEXT
========================= */

.composer-context {
  padding: 7px 9px;
}

.composer-context > span {
  font-size: 10px;
}

.composer-context p {
  font-size: 11px;
  line-height: 1.45;
}

/* =========================
   MESSAGE COMPOSER
========================= */

.message-form textarea {
  min-height: 76px;

  padding: 11px 12px;

  font-size: 14px;
  line-height: 1.55;
}

.composer-info {
  font-size: 11px;
}

.send-button {
  min-height: 36px;

  padding: 0 12px;

  font-size: 13px;
}

/* =========================
   DETAILS PANEL
========================= */

.details-eyebrow {
  font-size: 10px;
}

.details-header h2 {
  margin-top: 3px;

  font-size: 15px;
}

.section-label {
  margin-bottom: 10px;

  font-size: 10px;
}

/* CUSTOMER */

.customer-avatar {
  width: 35px;
  height: 35px;
  flex: 0 0 35px;

  font-size: 12px;
}

.customer-card strong {
  font-size: 13px;
}

.customer-card span {
  font-size: 10px;
}

/* =========================
   DETAIL ROWS
========================= */

.detail-list {
  gap: 13px;
}

.detail-row-icon {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;

  font-size: 10px;
}

.detail-row span {
  font-size: 10px;
}

.detail-row strong {
  margin-top: 2px;

  font-size: 12px;
  line-height: 1.4;
}

/* =========================
   MANAGEMENT
========================= */

.management-card {
  padding: 11px;
}

.management-icon {
  width: 27px;
  height: 27px;
  flex: 0 0 27px;

  font-size: 10px;
}

.management-card strong {
  font-size: 12px;
}

.management-card p {
  margin-top: 2px;

  font-size: 11px;
  line-height: 1.5;
}

/* =========================
   ACTION ERROR
========================= */

.action-error > span {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;

  font-size: 9px;
}

.action-error strong {
  font-size: 12px;
}

.action-error p {
  margin-top: 3px;

  font-size: 11px;
  line-height: 1.45;
}

/* =========================
   LOADING / ERROR / EMPTY
========================= */

.state-card strong {
  font-size: 13px;
}

.state-card span {
  font-size: 11px;
}

.error-state h2 {
  font-size: 17px;
}

.error-state p {
  font-size: 12px;
  line-height: 1.5;
}

.messages-state {
  font-size: 12px;
}

.messages-state strong {
  font-size: 13px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 650px) {
  .breadcrumb {
    font-size: 12px;
  }

  .conversation-title h1 {
    font-size: 16px;
  }

  .header-meta {
    font-size: 11px;
  }

  .primary-button,
  .secondary-button,
  .detail-primary-button,
  .detail-secondary-button {
    min-height: 42px;

    font-size: 13px;
  }

  .chat-title h2 {
    font-size: 15px;
  }

  .message-column {
    max-width: 87%;
  }

  .message-bubble {
    padding: 10px 12px;

    font-size: 14px;
    line-height: 1.55;
  }

  .message-meta strong {
    font-size: 11px;
  }

  .message-meta span {
    font-size: 10px;
  }

  /*
    16px evita el zoom automático de Safari
    al enfocar el textarea en iPhone.
  */
  .message-form textarea {
    font-size: 16px;
  }

  .send-button {
    min-height: 38px;

    font-size: 13px;
  }

  .details-header h2 {
    font-size: 15px;
  }

  .customer-card strong {
    font-size: 13px;
  }

  .detail-row strong {
    font-size: 12px;
  }
}
</style>
