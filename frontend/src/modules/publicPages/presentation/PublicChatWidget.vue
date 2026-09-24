<script setup>
import { nextTick, onBeforeUnmount, ref } from "vue";

import { PublicChatService } from "../../public/infrastructure/PublicChatService.js";
import { supabase } from "../../../infrastructure/supabase/supabaseClient.js";

const props = defineProps({
  businessId: { type: String, required: true },
  businessName: { type: String, default: "Asistente virtual" },
});

const emit = defineEmits(["close"]);

const publicChatService = new PublicChatService();

const isOpen = ref(false);
const initialized = ref(false);
const initializing = ref(false);
const messages = ref([]);
const inputMessage = ref("");
const loading = ref(false);
const error = ref(null);
const conversationId = ref(null);
const publicToken = ref(null);
const resolvedBusinessName = ref(props.businessName || "Asistente virtual");
const messagesContainer = ref(null);

let realtimeChannel = null;

function getVisitorId() {
  const storageKey = "ai_business_agent_visitor_id";
  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function unsubscribeRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function subscribeToMessages() {
  if (!conversationId.value || realtimeChannel) return;

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
        const exists = messages.value.some((item) => item.id === message.id);

        if (!exists) {
          messages.value.push(message);
          scrollToBottom();
        }
      },
    )
    .subscribe();
}

async function initializeChat() {
  if (initialized.value || initializing.value) return;

  initializing.value = true;
  error.value = null;

  try {
    const config = await publicChatService.getBusinessConfig(props.businessId);
    resolvedBusinessName.value = config.name || props.businessName || "Asistente virtual";

    const conversation = await publicChatService.createConversation(
      props.businessId,
      getVisitorId(),
    );

    conversationId.value = conversation.id;
    publicToken.value = conversation.public_token;

    const existingMessages = await publicChatService.getMessages(
      conversationId.value,
      publicToken.value,
    );

    if (existingMessages.length > 0) {
      messages.value = existingMessages;
    } else {
      messages.value = [
        {
          role: "assistant",
          content: config.welcome_message || "Hola 👋 ¿En qué puedo ayudarte?",
        },
      ];
    }

    subscribeToMessages();
    initialized.value = true;
    await scrollToBottom();
  } catch (err) {
    console.error(err);
    error.value = "No se ha podido iniciar la conversación.";
  } finally {
    initializing.value = false;
  }
}

async function open(prefill = "") {
  isOpen.value = true;

  await initializeChat();

  if (prefill && !inputMessage.value.trim()) {
    inputMessage.value = prefill;
  }

  await scrollToBottom();
}

function close() {
  isOpen.value = false;
  emit("close");
}

async function sendMessage() {
  const content = inputMessage.value.trim();

  if (!content || loading.value || !conversationId.value || !publicToken.value) {
    return;
  }

  error.value = null;
  inputMessage.value = "";
  loading.value = true;

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
    await publicChatService.sendMessage(
      conversationId.value,
      publicToken.value,
      content,
    );

    messages.value = await publicChatService.getMessages(
      conversationId.value,
      publicToken.value,
    );

    await scrollToBottom();
  } catch (err) {
    console.error(err);
    messages.value = messages.value.filter(
      (message) => message.id !== optimisticMessage.id,
    );
    error.value = "No se ha podido enviar el mensaje. Inténtalo de nuevo.";
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}

function handleKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  sendMessage();
}

const getInitial = () =>
  resolvedBusinessName.value?.trim()?.charAt(0)?.toUpperCase() || "A";

defineExpose({ open, close });

onBeforeUnmount(() => {
  unsubscribeRealtime();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="chat-fade">
      <div v-if="isOpen" class="widget-layer">
        <button
          type="button"
          class="widget-backdrop"
          aria-label="Cerrar asistente"
          @click="close"></button>

        <section class="chat-widget" role="dialog" aria-modal="true" aria-label="Asistente virtual">
          <header class="chat-header">
            <div class="business">
              <div class="business-avatar">
                {{ getInitial() }}
                <span class="online-indicator"></span>
              </div>

              <div class="business-info">
                <div class="business-name-row">
                  <h2>{{ resolvedBusinessName }}</h2>
                  <span class="ai-badge">IA</span>
                </div>

                <div class="availability">
                  <span class="availability-dot"></span>
                  <span>Asistente virtual disponible</span>
                </div>
              </div>
            </div>

            <button type="button" class="close-button" aria-label="Cerrar chat" @click="close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </header>

          <div ref="messagesContainer" class="chat-messages">
            <div v-if="initializing" class="initializing">
              <div class="loading-logo">✦</div>
              <strong>Iniciando asistente</strong>
              <p>Estamos preparando la conversación...</p>
              <div class="loading-dots"><span></span><span></span><span></span></div>
            </div>

            <template v-else>
              <div v-if="messages.length" class="conversation-start"><span>Ahora</span></div>

              <div class="messages-list">
                <article
                  v-for="(message, index) in messages"
                  :key="message.id || index"
                  class="message"
                  :class="`message-${message.role}`">
                  <div v-if="message.role === 'assistant'" class="assistant-avatar">✦</div>

                  <div class="message-content">
                    <span v-if="message.role === 'assistant'" class="message-author">
                      {{ resolvedBusinessName }}
                    </span>
                    <div class="message-bubble">{{ message.content }}</div>
                  </div>
                </article>

                <article v-if="loading" class="message message-assistant">
                  <div class="assistant-avatar">✦</div>
                  <div class="message-content">
                    <span class="message-author">{{ resolvedBusinessName }}</span>
                    <div class="message-bubble typing-bubble">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </article>
              </div>
            </template>
          </div>

          <div v-if="error && !initializing" class="error-message">
            <span>{{ error }}</span>
            <button type="button" @click="error = null">×</button>
          </div>

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
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="m22 2-7 20-4-9-9-4 20-7Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </form>

            <div class="footer-meta">
              <span>Enter para enviar · Shift + Enter para nueva línea</span>
              <span class="powered">✦ Powered by <strong>Resbix</strong></span>
            </div>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.widget-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.widget-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(2px);
  pointer-events: auto;
  cursor: default;
}

.chat-widget {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: min(430px, calc(100vw - 48px));
  height: min(680px, calc(100dvh - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2), 0 8px 30px rgba(15, 23, 42, 0.08);
  pointer-events: auto;
}

.chat-header {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 15px;
  border-bottom: 1px solid #e8edf3;
  background: rgba(255,255,255,.98);
}

.business { min-width: 0; display: flex; align-items: center; gap: 10px; }
.business-avatar {
  position: relative; width: 42px; height: 42px; flex: 0 0 42px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px; background: #0f172a; color: white; font-size: 15px; font-weight: 800;
}
.online-indicator {
  position: absolute; right: -2px; bottom: -1px; width: 10px; height: 10px;
  box-sizing: border-box; border: 2px solid white; border-radius: 50%; background: #22c55e;
}
.business-info { min-width: 0; }
.business-name-row { display: flex; align-items: center; gap: 7px; }
.business-name-row h2 {
  overflow: hidden; margin: 0; color: #101828; font-size: 15px; font-weight: 700;
  text-overflow: ellipsis; white-space: nowrap;
}
.ai-badge { padding: 3px 7px; border-radius: 999px; background: #eef2ff; color: #4f46e5; font-size: 9px; font-weight: 800; }
.availability { display: flex; align-items: center; gap: 5px; margin-top: 4px; color: #667085; font-size: 11px; }
.availability-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
.close-button {
  width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center;
  border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; color: #64748b; cursor: pointer;
}
.close-button:hover { background: #f8fafc; color: #0f172a; }

.chat-messages {
  flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 20px 16px;
  background: linear-gradient(180deg, #fbfcfe 0%, #f8fafc 100%); scroll-behavior: smooth;
}
.conversation-start { display: flex; align-items: center; gap: 10px; margin: 0 0 18px; color: #98a2b3; font-size: 10px; }
.conversation-start::before, .conversation-start::after { content: ""; flex: 1; height: 1px; background: #e8edf3; }
.messages-list { display: flex; flex-direction: column; gap: 14px; }
.message { width: 100%; display: flex; align-items: flex-end; gap: 7px; }
.message-assistant { justify-content: flex-start; }
.message-user { justify-content: flex-end; }
.assistant-avatar {
  width: 28px; height: 28px; flex: 0 0 28px; display: grid; place-items: center;
  margin-bottom: 1px; border-radius: 8px; background: #0f172a; color: #93c5fd; font-size: 9px;
}
.message-content { max-width: 82%; display: flex; flex-direction: column; }
.message-user .message-content { align-items: flex-end; }
.message-author { margin: 0 0 5px 2px; color: #667085; font-size: 10px; font-weight: 650; }
.message-bubble { padding: 10px 12px; font-size: 13px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.message-assistant .message-bubble { border: 1px solid #e5e9ef; border-radius: 11px 11px 11px 3px; background: white; color: #344054; }
.message-user .message-bubble { border-radius: 11px 11px 3px 11px; background: #0f172a; color: #f8fafc; }

.typing-bubble { min-width: 48px; display: flex; align-items: center; gap: 4px; padding-top: 14px; padding-bottom: 14px; }
.typing-bubble > span, .loading-dots span {
  width: 5px; height: 5px; border-radius: 50%; background: #98a2b3; animation: typing 1.2s infinite ease-in-out;
}
.typing-bubble > span:nth-child(2), .loading-dots span:nth-child(2) { animation-delay: .15s; }
.typing-bubble > span:nth-child(3), .loading-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes typing { 0%,60%,100% { opacity:.35; transform:translateY(0); } 30% { opacity:1; transform:translateY(-2px); } }

.initializing { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.loading-logo { width: 44px; height: 44px; display: grid; place-items: center; margin-bottom: 11px; border-radius: 12px; background: #0f172a; color: #93c5fd; }
.initializing strong { color: #101828; font-size: 14px; }
.initializing p { margin: 5px 0 12px; color: #98a2b3; font-size: 11px; }
.loading-dots { display: flex; gap: 4px; }

.error-message {
  display: flex; align-items: center; gap: 8px; margin: 0 12px 8px; padding: 9px 10px;
  border: 1px solid #fecaca; border-radius: 9px; background: #fff5f5; color: #b42318; font-size: 11px;
}
.error-message > span { flex: 1; }
.error-message button { border: 0; background: transparent; color: currentColor; font-size: 16px; cursor: pointer; }

.chat-footer { padding: 11px 12px 9px; border-top: 1px solid #e8edf3; background: white; }
.composer {
  min-height: 52px; display: flex; align-items: flex-end; gap: 7px; padding: 6px;
  border: 1px solid #dfe4ea; border-radius: 11px; background: white;
}
.composer:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37,99,235,.06); }
.composer textarea {
  flex: 1; min-height: 38px; max-height: 100px; box-sizing: border-box; padding: 9px 8px;
  border: 0; background: transparent; color: #101828; font: inherit; font-size: 13px; line-height: 1.5;
  outline: none; resize: none;
}
.composer textarea::placeholder { color: #98a2b3; }
.send-button {
  width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center;
  border: 0; border-radius: 9px; background: #2563eb; color: white; cursor: pointer;
}
.send-button:hover:not(:disabled) { background: #1d4ed8; }
.send-button:disabled { opacity: .35; cursor: not-allowed; }
.footer-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 7px; padding: 0 3px; color: #98a2b3; font-size: 9px; }
.powered { white-space: nowrap; }
.powered strong { color: #667085; }

.chat-fade-enter-active, .chat-fade-leave-active { transition: opacity .18s ease; }
.chat-fade-enter-active .chat-widget, .chat-fade-leave-active .chat-widget { transition: transform .22s ease, opacity .18s ease; }
.chat-fade-enter-from, .chat-fade-leave-to { opacity: 0; }
.chat-fade-enter-from .chat-widget, .chat-fade-leave-to .chat-widget { transform: translateY(18px) scale(.98); opacity: 0; }

.chat-messages::-webkit-scrollbar { width: 5px; }
.chat-messages::-webkit-scrollbar-thumb { border-radius: 999px; background: #d0d5dd; }

@media (max-width: 640px) {
  .widget-backdrop { background: rgba(15,23,42,.18); }
  .chat-widget {
    inset: 0; width: 100%; height: 100dvh; max-width: none;
    border: 0; border-radius: 0; box-shadow: none;
  }
  .chat-header { padding-top: max(14px, env(safe-area-inset-top)); }
  .chat-footer { padding-bottom: max(9px, env(safe-area-inset-bottom)); }
  .composer textarea { font-size: 16px; }
  .footer-meta > span:first-child { display: none; }
  .footer-meta { justify-content: flex-end; }
}
</style>
