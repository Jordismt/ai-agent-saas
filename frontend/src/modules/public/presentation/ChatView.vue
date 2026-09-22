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

  if (!content || loading.value) {
    return;
  }

  error.value = null;

  inputMessage.value = "";

  await scrollToBottom();

  loading.value = true;

  try {
    const result = await publicChatService.sendMessage(conversationId.value, publicToken.value, content);

    await scrollToBottom();
  } catch (err) {
    console.error(err);

    error.value = "No se ha podido enviar el mensaje. Inténtalo de nuevo.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
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

    // Suscribirse a nuevos mensajes en tiempo real
    subscribeToMessages();

    await scrollToBottom();
  } catch (err) {
    console.error(err);

    error.value = "No se ha podido iniciar la conversación.";
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
    <section class="chat-container">
      <header class="chat-header">
        <div>
          <h1>Asistente virtual</h1>
          <p>Estamos aquí para ayudarte</p>
        </div>
      </header>

      <div ref="messagesContainer" class="chat-messages">
        <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
          <div class="message-bubble">
            {{ message.content }}
          </div>
        </div>

        <div v-if="loading" class="message assistant">
          <div class="message-bubble">Escribiendo...</div>
        </div>
      </div>

      <p v-if="error" class="error-message">
        {{ error }}
      </p>

      <form class="chat-input" @submit.prevent="sendMessage">
        <input v-model="inputMessage" type="text" placeholder="Escribe tu mensaje..." :disabled="loading" />

        <button type="submit" :disabled="loading || !inputMessage.trim()">
          {{ loading ? "..." : "Enviar" }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.chat-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: #f5f7fb;
}

.chat-container {
  width: 100%;
  max-width: 700px;
  height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.chat-header h1 {
  margin: 0;
  font-size: 20px;
}

.chat-header p {
  margin: 4px 0 0;
  color: #6b7280;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message {
  display: flex;
  margin-bottom: 12px;
}

.message.assistant {
  justify-content: flex-start;
}

.message.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 14px;
  white-space: pre-wrap;
}

.message.assistant .message-bubble {
  background: #f1f5f9;
}

.message.user .message-bubble {
  background: #111827;
  color: white;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.chat-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
}

.chat-input input:focus {
  border-color: #111827;
}

.chat-input button {
  padding: 12px 18px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  background: #111827;
  color: white;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin: 0;
  padding: 0 16px 12px;
  color: #dc2626;
  font-size: 14px;
}
</style>
