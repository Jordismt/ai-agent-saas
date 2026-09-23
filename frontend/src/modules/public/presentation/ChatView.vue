<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { PublicChatService } from "../infrastructure/PublicChatService.js";
import { supabase } from "../../../infrastructure/supabase/supabaseClient.js";

const route = useRoute();

const publicChatService = new PublicChatService();

const messages = ref([]);
const businessName = ref("Asistente virtual");

const inputMessage = ref("");
const loading = ref(false);
const initializing = ref(true);
const error = ref(null);

const conversationId = ref(null);
const publicToken = ref(null);

const messagesContainer = ref(null);

let realtimeChannel = null;

const subscribeToMessages = () => {
  if (!conversationId.value) {
    return;
  }

  realtimeChannel = supabase
    .channel(`conversation-${conversationId.value}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId.value}`,
      },
      (payload) => {
        const message = payload.new;

        const alreadyExists = messages.value.some((item) => item.id === message.id);

        if (!alreadyExists) {
          messages.value.push(message);
          scrollToBottom();
        }
      },
    )
    .subscribe();
};

function getVisitorId() {
  const storageKey = "ai_business_agent_visitor_id";

  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = crypto.randomUUID();

    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

async function createConversation() {
  const businessId = route.params.businessId;

  const visitorId = getVisitorId();

  const conversation = await publicChatService.createConversation(businessId, visitorId);

  conversationId.value = conversation.id;
  publicToken.value = conversation.public_token;
}

async function scrollToBottom() {
  await nextTick();

  if (!messagesContainer.value) {
    return;
  }

  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
}

async function sendMessage() {
  const content = inputMessage.value.trim();

  if (!content || loading.value || !conversationId.value || !publicToken.value) {
    return;
  }

  error.value = null;
  inputMessage.value = "";
  loading.value = true;

  /*
   * Mostramos inmediatamente el mensaje
   * del usuario.
   *
   * No esperamos a Supabase Realtime.
   */
  const optimisticMessage = {
    id: `temp-${crypto.randomUUID()}`,
    conversation_id: conversationId.value,
    role: "user",
    content,
    optimistic: true,
  };

  messages.value.push(optimisticMessage);

  await scrollToBottom();

  try {
    /*
     * El backend guarda:
     *
     * 1. mensaje del usuario
     * 2. ejecuta la IA
     * 3. guarda respuesta del asistente
     */
    await publicChatService.sendMessage(conversationId.value, publicToken.value, content);

    /*
     * Después del POST sincronizamos con BD.
     *
     * Así el chat funciona aunque Realtime
     * falle o tarde en entregar eventos.
     */
    const freshMessages = await publicChatService.getMessages(conversationId.value, publicToken.value);

    messages.value = freshMessages;

    await scrollToBottom();
  } catch (err) {
    console.error(err);

    /*
     * Quitamos el mensaje optimista porque
     * el envío ha fallado.
     */
    messages.value = messages.value.filter((message) => message.id !== optimisticMessage.id);

    error.value = "No se ha podido enviar el mensaje. Inténtalo de nuevo.";

    await scrollToBottom();
  } finally {
    loading.value = false;

    await scrollToBottom();
  }
}

const handleKeydown = (event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();

  sendMessage();
};

const getInitial = () => {
  return businessName.value?.trim()?.charAt(0)?.toUpperCase() || "A";
};

onMounted(async () => {
  try {
    initializing.value = true;

    const businessId = route.params.businessId;

    const config = await publicChatService.getBusinessConfig(businessId);

    businessName.value = config.name || "Asistente virtual";

    await createConversation();

    const existingMessages = await publicChatService.getMessages(conversationId.value, publicToken.value);

    if (existingMessages.length > 0) {
      messages.value = existingMessages;
    } else {
      messages.value.push({
        role: "assistant",
        content: config.welcome_message || "Hola 👋 ¿En qué puedo ayudarte?",
      });
    }

    subscribeToMessages();

    await scrollToBottom();
  } catch (err) {
    console.error(err);

    error.value = "No se ha podido iniciar la conversación.";
  } finally {
    initializing.value = false;
  }
});

onBeforeUnmount(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);

    realtimeChannel = null;
  }
});
</script>

<template>
  <main class="chat-page">
    <!-- BACKGROUND -->

    <div class="background-decoration decoration-one"></div>
    <div class="background-decoration decoration-two"></div>

    <!-- CHAT -->

    <section class="chat-shell">
      <!-- HEADER -->

      <header class="chat-header">
        <div class="business">
          <div class="business-avatar">
            {{ getInitial() }}

            <span class="online-indicator"></span>
          </div>

          <div class="business-info">
            <div class="business-name-row">
              <h1>{{ businessName }}</h1>

              <span class="ai-badge"> IA </span>
            </div>

            <div class="availability">
              <span class="availability-dot"></span>

              <span>Asistente virtual disponible</span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <div class="secure-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8" />

              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round" />
            </svg>

            Conversación privada
          </div>
        </div>
      </header>

      <!-- MESSAGES -->

      <div ref="messagesContainer" class="chat-messages">
        <!-- INITIAL LOADING -->

        <div v-if="initializing" class="initializing">
          <div class="loading-logo">
            <span>✦</span>
          </div>

          <strong>Iniciando asistente</strong>

          <p>Estamos preparando la conversación...</p>

          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <template v-else>
          <!-- INTRO -->

          <div v-if="messages.length > 0" class="conversation-start">
            <span>Ahora</span>
          </div>

          <!-- MESSAGE LIST -->

          <div class="messages-list">
            <article
              v-for="(message, index) in messages"
              :key="message.id || index"
              class="message"
              :class="`message-${message.role}`">
              <!-- ASSISTANT AVATAR -->

              <div v-if="message.role === 'assistant'" class="assistant-avatar">
                <span>✦</span>
              </div>

              <!-- MESSAGE -->

              <div class="message-content">
                <span v-if="message.role === 'assistant'" class="message-author">
                  {{ businessName }}
                </span>

                <div class="message-bubble">
                  {{ message.content }}
                </div>
              </div>
            </article>

            <!-- TYPING -->

            <article v-if="loading" class="message message-assistant">
              <div class="assistant-avatar">
                <span>✦</span>
              </div>

              <div class="message-content">
                <span class="message-author">
                  {{ businessName }}
                </span>

                <div class="message-bubble typing-bubble">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </article>
          </div>
        </template>
      </div>

      <!-- ERROR -->

      <div v-if="error && !initializing" class="error-message">
        <div class="error-icon">!</div>

        <span>{{ error }}</span>

        <button type="button" @click="error = null">×</button>
      </div>

      <!-- COMPOSER -->

      <footer class="chat-footer">
        <form class="composer" @submit.prevent="sendMessage">
          <textarea
            v-model="inputMessage"
            rows="1"
            maxlength="2000"
            placeholder="Escribe tu mensaje..."
            :disabled="loading || initializing"
            aria-label="Escribe tu mensaje"
            @keydown="handleKeydown"></textarea>

          <button
            type="submit"
            class="send-button"
            :disabled="loading || initializing || !inputMessage.trim()"
            aria-label="Enviar mensaje">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="m22 2-7 20-4-9-9-4 20-7Z"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </form>

        <div class="footer-meta">
          <span> Enter para enviar · Shift + Enter para nueva línea </span>

          <div class="powered-by">
            <span class="powered-star">✦</span>

            <span>Powered by</span>

            <strong>AgentFlow</strong>
          </div>
        </div>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.chat-page {
  position: relative;

  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;

  overflow: hidden;

  padding: 28px;

  background:
    radial-gradient(circle at 15% 10%, rgba(59, 130, 246, 0.07), transparent 30%),
    radial-gradient(circle at 90% 85%, rgba(99, 102, 241, 0.06), transparent 28%), #f5f7fa;
}

/* =========================
   BACKGROUND
========================= */

.background-decoration {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(1px);
}

.decoration-one {
  top: -180px;
  left: -150px;

  width: 400px;
  height: 400px;

  border: 1px solid rgba(37, 99, 235, 0.06);
}

.decoration-two {
  right: -180px;
  bottom: -220px;

  width: 500px;
  height: 500px;

  border: 1px solid rgba(99, 102, 241, 0.06);
}

/* =========================
   SHELL
========================= */

.chat-shell {
  position: relative;
  z-index: 1;

  width: min(680px, 100%);
  height: min(760px, calc(100vh - 56px));

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border: 1px solid #e2e8f0;
  border-radius: 18px;

  background: #ffffff;

  box-shadow:
    0 30px 70px rgba(15, 23, 42, 0.08),
    0 5px 20px rgba(15, 23, 42, 0.04);
}

/* =========================
   HEADER
========================= */

.chat-header {
  min-height: 74px;

  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 13px 16px;

  border-bottom: 1px solid #e8edf3;

  background: rgba(255, 255, 255, 0.97);
}

.business {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 10px;
}

.business-avatar {
  position: relative;

  width: 40px;
  height: 40px;

  flex: 0 0 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 11px;

  background: linear-gradient(145deg, #172033, #0f172a);

  color: #ffffff;

  font-size: 13px;
  font-weight: 700;

  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.14);
}

.online-indicator {
  position: absolute;
  right: -2px;
  bottom: -1px;

  width: 9px;
  height: 9px;

  box-sizing: border-box;

  border: 2px solid white;
  border-radius: 50%;

  background: #22c55e;
}

.business-info {
  min-width: 0;
}

.business-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.business-name-row h1 {
  overflow: hidden;

  margin: 0;

  color: #101828;

  font-size: 12px;
  font-weight: 650;
  letter-spacing: -0.015em;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-badge {
  flex: 0 0 auto;

  padding: 2px 5px;

  border-radius: 999px;

  background: #eef2ff;
  color: #4f46e5;

  font-size: 6px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.availability {
  display: flex;
  align-items: center;
  gap: 5px;

  margin-top: 3px;

  color: #667085;

  font-size: 7px;
}

.availability-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #22c55e;
}

.secure-badge {
  display: flex;
  align-items: center;
  gap: 5px;

  padding: 5px 7px;

  border: 1px solid #e5e7eb;
  border-radius: 7px;

  background: #fafafa;
  color: #667085;

  font-size: 6px;
  font-weight: 500;
}

/* =========================
   MESSAGES
========================= */

.chat-messages {
  flex: 1;

  overflow-y: auto;
  overscroll-behavior: contain;

  padding: 20px 18px;

  background: linear-gradient(180deg, #fbfcfe 0%, #f8fafc 100%);

  scroll-behavior: smooth;
}

.conversation-start {
  display: flex;
  align-items: center;
  gap: 10px;

  margin: 0 0 20px;

  color: #98a2b3;

  font-size: 6px;
  font-weight: 500;
}

.conversation-start::before,
.conversation-start::after {
  content: "";

  flex: 1;

  height: 1px;

  background: #e8edf3;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* MESSAGE */

.message {
  width: 100%;

  display: flex;
  align-items: flex-end;
  gap: 7px;
}

.message-assistant {
  justify-content: flex-start;
}

.message-user {
  justify-content: flex-end;
}

.assistant-avatar {
  width: 25px;
  height: 25px;

  flex: 0 0 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 1px;

  border-radius: 7px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 8px;

  box-shadow: 0 2px 5px rgba(15, 23, 42, 0.08);
}

.message-content {
  max-width: min(76%, 460px);

  display: flex;
  flex-direction: column;
}

.message-user .message-content {
  align-items: flex-end;
}

.message-author {
  margin: 0 0 4px 2px;

  color: #667085;

  font-size: 6px;
  font-weight: 600;
}

.message-bubble {
  padding: 9px 11px;

  font-size: 9px;
  line-height: 1.55;

  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message-assistant .message-bubble {
  border: 1px solid #e5e9ef;
  border-radius: 10px 10px 10px 3px;

  background: #ffffff;
  color: #344054;

  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.02);
}

.message-user .message-bubble {
  border-radius: 10px 10px 3px 10px;

  background: #0f172a;
  color: #f8fafc;

  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.1);
}

/* =========================
   TYPING
========================= */

.typing-bubble {
  min-width: 45px;

  display: flex;
  align-items: center;
  gap: 3px;

  padding-top: 12px;
  padding-bottom: 12px;
}

.typing-bubble > span {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: #98a2b3;

  animation: typing 1.2s infinite ease-in-out;
}

.typing-bubble > span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-bubble > span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

/* =========================
   INITIAL LOADING
========================= */

.initializing {
  min-height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;
}

.loading-logo {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 11px;

  border-radius: 11px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 13px;

  box-shadow: 0 5px 15px rgba(15, 23, 42, 0.12);
}

.initializing strong {
  color: #101828;

  font-size: 10px;
}

.initializing p {
  margin: 4px 0 10px;

  color: #98a2b3;

  font-size: 8px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: #98a2b3;

  animation: loading-dot 1.2s infinite ease-in-out;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes loading-dot {
  0%,
  60%,
  100% {
    opacity: 0.3;
  }

  30% {
    opacity: 1;
  }
}

/* =========================
   ERROR
========================= */

.error-message {
  flex: 0 0 auto;

  display: flex;
  align-items: center;
  gap: 7px;

  margin: 0 12px 8px;
  padding: 7px 8px;

  border: 1px solid #fecaca;
  border-radius: 7px;

  background: #fff5f5;
  color: #b42318;

  font-size: 7px;
}

.error-icon {
  width: 17px;
  height: 17px;

  flex: 0 0 17px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #fee2e2;

  font-size: 7px;
  font-weight: 700;
}

.error-message > span {
  flex: 1;
}

.error-message button {
  padding: 0;

  border: 0;

  background: transparent;
  color: currentColor;

  font-size: 13px;

  cursor: pointer;
}

/* =========================
   FOOTER
========================= */

.chat-footer {
  flex: 0 0 auto;

  padding: 11px 12px 9px;

  border-top: 1px solid #e8edf3;

  background: #ffffff;
}

.composer {
  min-height: 48px;

  display: flex;
  align-items: flex-end;
  gap: 7px;

  padding: 6px;

  border: 1px solid #dfe4ea;
  border-radius: 10px;

  background: #ffffff;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.composer:focus-within {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.06);
}

.composer textarea {
  flex: 1;

  min-height: 34px;
  max-height: 100px;

  box-sizing: border-box;

  padding: 8px 7px;

  border: 0;

  background: transparent;
  color: #101828;

  font: inherit;
  font-size: 9px;
  line-height: 1.45;

  outline: none;

  resize: none;
}

.composer textarea::placeholder {
  color: #98a2b3;
}

.composer textarea:disabled {
  cursor: not-allowed;
}

.send-button {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 0;
  border-radius: 8px;

  background: #2563eb;
  color: #ffffff;

  cursor: pointer;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);

  transition:
    background 0.15s ease,
    transform 0.15s ease,
    opacity 0.15s ease;
}

.send-button:hover:not(:disabled) {
  background: #1d4ed8;

  transform: translateY(-1px);
}

.send-button:disabled {
  opacity: 0.35;

  box-shadow: none;

  cursor: not-allowed;
}

.footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  margin-top: 6px;
  padding: 0 3px;

  color: #98a2b3;

  font-size: 6px;
}

.powered-by {
  display: flex;
  align-items: center;
  gap: 3px;

  white-space: nowrap;
}

.powered-by strong {
  color: #667085;

  font-weight: 600;
}

.powered-star {
  color: #6366f1;

  font-size: 7px;
}

/* =========================
   SCROLLBAR
========================= */

.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background: #d0d5dd;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #b8c0cc;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 700px) {
  .chat-page {
    padding: 0;

    background: white;
  }

  .chat-shell {
    width: 100%;
    height: 100dvh;

    border: 0;
    border-radius: 0;

    box-shadow: none;
  }

  .chat-header {
    min-height: 68px;

    padding: 11px 13px;
  }

  .chat-messages {
    padding: 18px 13px;
  }

  .message-content {
    max-width: 82%;
  }

  .chat-footer {
    padding: 9px 10px max(8px, env(safe-area-inset-bottom));
  }
}

@media (max-width: 480px) {
  .business-avatar {
    width: 36px;
    height: 36px;

    flex-basis: 36px;

    border-radius: 9px;
  }

  .secure-badge {
    display: none;
  }

  .business-name-row h1 {
    max-width: 180px;
  }

  .message-content {
    max-width: 86%;
  }

  .assistant-avatar {
    width: 23px;
    height: 23px;

    flex-basis: 23px;
  }

  .footer-meta > span:first-child {
    display: none;
  }

  .footer-meta {
    justify-content: flex-end;
  }
}

/* =========================
   CHAT TYPOGRAPHY FIX
========================= */

/* =========================
   HEADER
========================= */

.business-avatar {
  font-size: 15px;
}

.business-name-row h1 {
  font-size: 16px;
  line-height: 1.3;
}

.ai-badge {
  padding: 3px 7px;
  font-size: 10px;
}

.availability {
  margin-top: 3px;
  font-size: 12px;
}

.secure-badge {
  padding: 6px 9px;
  font-size: 11px;
}

/* =========================
   CONVERSATION
========================= */

.conversation-start {
  font-size: 11px;
}

/* Assistant avatar */

.assistant-avatar {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;

  font-size: 10px;
}

/* Author */

.message-author {
  margin-bottom: 5px;

  font-size: 11px;
  line-height: 1.3;
}

/* Actual message */

.message-bubble {
  padding: 10px 13px;

  font-size: 14px;
  line-height: 1.55;
}

/*
  Give messages a little more room now that
  the text is actually readable.
*/

.message-content {
  max-width: min(78%, 500px);
}

/* =========================
   INITIAL LOADING
========================= */

.loading-logo {
  font-size: 15px;
}

.initializing strong {
  font-size: 15px;
}

.initializing p {
  margin-top: 5px;

  font-size: 12px;
  line-height: 1.5;
}

/* =========================
   ERROR
========================= */

.error-message {
  padding: 9px 10px;

  font-size: 12px;
  line-height: 1.45;
}

.error-icon {
  font-size: 10px;
}

/* =========================
   COMPOSER
========================= */

.composer {
  min-height: 52px;
}

.composer textarea {
  min-height: 38px;

  padding: 9px 8px;

  font-size: 14px;
  line-height: 1.5;
}

/* Slightly larger send target */

.send-button {
  width: 38px;
  height: 38px;

  flex: 0 0 38px;
}

/* =========================
   FOOTER
========================= */

.footer-meta {
  margin-top: 7px;

  font-size: 11px;
}

.powered-star {
  font-size: 10px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 700px) {
  .chat-header {
    min-height: 72px;
  }

  .business-name-row h1 {
    font-size: 15px;
  }

  .availability {
    font-size: 12px;
  }

  .chat-messages {
    padding: 18px 14px;
  }

  .message-bubble {
    font-size: 14px;
    line-height: 1.55;
  }

  .message-author {
    font-size: 11px;
  }

  /*
    Important on iPhone:
    16px prevents Safari from zooming
    when the textarea gets focus.
  */
  .composer textarea {
    font-size: 16px;
  }

  .footer-meta {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .business-name-row h1 {
    max-width: 180px;
    font-size: 15px;
  }

  .ai-badge {
    font-size: 9px;
  }

  .message-content {
    max-width: 87%;
  }

  .assistant-avatar {
    width: 27px;
    height: 27px;

    flex-basis: 27px;
  }

  .message-bubble {
    padding: 10px 12px;
  }
}
</style>
