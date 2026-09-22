<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { BusinessAgentConfigService } from "../infrastructure/BusinessAgentConfigService.js";

const route = useRoute();

const businessAgentConfigService = new BusinessAgentConfigService();

const systemInstructions = ref("");
const welcomeMessage = ref("");
const tone = ref("professional");

const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const success = ref(null);

async function loadConfig() {
  try {
    loading.value = true;
    error.value = null;

    const config = await businessAgentConfigService.getConfig(route.params.id);

    systemInstructions.value = config.system_instructions || "";

    welcomeMessage.value = config.welcome_message || "";

    tone.value = config.tone || "professional";
  } catch (err) {
    console.error(err);
    error.value = "No se ha podido cargar la configuración.";
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  try {
    saving.value = true;
    error.value = null;
    success.value = null;

    await businessAgentConfigService.updateConfig(route.params.id, {
      systemInstructions: systemInstructions.value || null,

      welcomeMessage: welcomeMessage.value || null,

      tone: tone.value,
    });

    success.value = "Configuración guardada correctamente.";
  } catch (err) {
    console.error(err);

    error.value = "No se ha podido guardar la configuración.";
  } finally {
    saving.value = false;
  }
}

onMounted(loadConfig);
</script>

<template>
  <main class="agent-config-page">
    <section class="agent-config-container">
      <header class="page-header">
        <div>
          <h1>Configuración del agente</h1>
          <p>Personaliza cómo responde tu asistente virtual.</p>
        </div>
      </header>

      <div v-if="loading" class="loading">Cargando configuración...</div>

      <form v-else class="config-form" @submit.prevent="saveConfig">
        <div class="form-group">
          <label for="systemInstructions"> Instrucciones del agente </label>

          <textarea
            id="systemInstructions"
            v-model="systemInstructions"
            rows="8"
            placeholder="Ej: Atiende a los clientes de forma cercana, profesional y clara..." />

          <small>
            Estas instrucciones permiten personalizar el comportamiento del agente para tu negocio.
          </small>
        </div>

        <div class="form-group">
          <label for="welcomeMessage"> Mensaje de bienvenida </label>

          <textarea
            id="welcomeMessage"
            v-model="welcomeMessage"
            rows="3"
            placeholder="Ej: ¡Hola! 👋 ¿En qué puedo ayudarte?" />
        </div>

        <div class="form-group">
          <label for="tone"> Tono del agente </label>

          <select id="tone" v-model="tone">
            <option value="professional">Profesional</option>

            <option value="friendly">Cercano</option>

            <option value="casual">Casual</option>
          </select>
        </div>

        <p v-if="error" class="error-message">
          {{ error }}
        </p>

        <p v-if="success" class="success-message">
          {{ success }}
        </p>

        <button type="submit" :disabled="saving">
          {{ saving ? "Guardando..." : "Guardar configuración" }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.agent-config-page {
  min-height: 100vh;
  padding: 40px 24px;
  background: #f5f7fb;
}

.agent-config-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
}

.page-header p {
  margin: 8px 0 0;
  color: #6b7280;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
}

.form-group textarea,
.form-group select {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font: inherit;
  outline: none;
}

.form-group textarea {
  resize: vertical;
}

.form-group textarea:focus,
.form-group select:focus {
  border-color: #111827;
}

.form-group small {
  color: #6b7280;
  font-size: 13px;
}

.config-form button {
  align-self: flex-start;
  padding: 12px 20px;
  border: 0;
  border-radius: 10px;
  background: #111827;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.config-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  color: #6b7280;
}

.error-message {
  margin: 0;
  color: #dc2626;
}

.success-message {
  margin: 0;
  color: #16a34a;
}
</style>
