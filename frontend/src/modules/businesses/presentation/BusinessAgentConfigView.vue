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
  <div class="agent-config-page">
    <div class="page-container">
      <!-- BREADCRUMB -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <RouterLink :to="`/businesses/${route.params.id}`"> Negocio </RouterLink>

        <span>/</span>

        <span>Agente de IA</span>
      </nav>

      <!-- HEADER -->

      <header class="page-header">
        <div class="header-content">
          <div class="agent-mark">✦</div>

          <div>
            <div class="header-meta">
              <span class="status-dot"></span>
              <span>Agente de IA</span>
            </div>

            <h1>Configurar agente</h1>

            <p>Define cómo debe comunicarse y comportarse tu asistente cuando atienda a tus clientes.</p>
          </div>
        </div>

        <RouterLink :to="`/businesses/${route.params.id}`" class="back-button">
          ← Volver al negocio
        </RouterLink>
      </header>

      <!-- LOADING -->

      <section v-if="loading" class="loading-card">
        <div class="spinner"></div>

        <div>
          <strong>Cargando configuración</strong>
          <span>Preparando los ajustes del agente...</span>
        </div>
      </section>

      <!-- CONTENT -->

      <form v-else class="config-layout" @submit.prevent="saveConfig">
        <!-- MAIN CONFIG -->

        <div class="config-main">
          <!-- BEHAVIOUR -->

          <section class="config-card">
            <div class="card-header">
              <div class="card-heading">
                <div class="card-icon">✦</div>

                <div>
                  <h2>Comportamiento del agente</h2>

                  <p>Indica cómo quieres que la IA atienda a tus clientes.</p>
                </div>
              </div>

              <span class="card-step"> Principal </span>
            </div>

            <div class="card-content">
              <div class="field">
                <div class="field-header">
                  <label for="systemInstructions"> Instrucciones del agente </label>

                  <span class="optional"> Opcional </span>
                </div>

                <textarea
                  id="systemInstructions"
                  v-model="systemInstructions"
                  rows="9"
                  placeholder="Ej. Atiende a los clientes de forma cercana, profesional y clara. Responde siempre utilizando la información disponible del negocio. Si el cliente necesita hablar con una persona, ofrece transferir la conversación..."></textarea>

                <div class="field-info">
                  <span class="info-icon">i</span>

                  <p>
                    Estas instrucciones complementan la información del negocio y permiten personalizar el
                    comportamiento del agente.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- WELCOME -->

          <section class="config-card">
            <div class="card-header">
              <div class="card-heading">
                <div class="card-icon secondary">◌</div>

                <div>
                  <h2>Inicio de la conversación</h2>

                  <p>Personaliza el primer mensaje que recibirá el cliente.</p>
                </div>
              </div>
            </div>

            <div class="card-content">
              <div class="field">
                <div class="field-header">
                  <label for="welcomeMessage"> Mensaje de bienvenida </label>

                  <span class="optional"> Opcional </span>
                </div>

                <textarea
                  id="welcomeMessage"
                  v-model="welcomeMessage"
                  rows="4"
                  placeholder="Ej. ¡Hola! 👋 ¿En qué puedo ayudarte?"></textarea>

                <p class="field-help">
                  Será el primer mensaje que verá el cliente al iniciar una nueva conversación.
                </p>
              </div>
            </div>
          </section>

          <!-- TONE -->

          <section class="config-card">
            <div class="card-header">
              <div class="card-heading">
                <div class="card-icon tone-icon">Aa</div>

                <div>
                  <h2>Estilo de comunicación</h2>

                  <p>Elige el tono general que utilizará el agente.</p>
                </div>
              </div>
            </div>

            <div class="card-content">
              <div class="tone-grid">
                <label class="tone-option" :class="{ selected: tone === 'professional' }">
                  <input v-model="tone" type="radio" value="professional" />

                  <div class="tone-option-top">
                    <div class="tone-symbol">P</div>

                    <div class="radio-indicator">
                      <span></span>
                    </div>
                  </div>

                  <strong>Profesional</strong>

                  <p>Comunicación clara, educada y formal para cualquier tipo de negocio.</p>

                  <span class="tone-example"> “Buenos días, ¿en qué puedo ayudarle?” </span>
                </label>

                <label class="tone-option" :class="{ selected: tone === 'friendly' }">
                  <input v-model="tone" type="radio" value="friendly" />

                  <div class="tone-option-top">
                    <div class="tone-symbol">✦</div>

                    <div class="radio-indicator">
                      <span></span>
                    </div>
                  </div>

                  <strong>Cercano</strong>

                  <p>Trato amable y natural manteniendo una imagen profesional.</p>

                  <span class="tone-example"> “¡Hola! Encantado de ayudarte 😊” </span>
                </label>

                <label class="tone-option" :class="{ selected: tone === 'casual' }">
                  <input v-model="tone" type="radio" value="casual" />

                  <div class="tone-option-top">
                    <div class="tone-symbol">:)</div>

                    <div class="radio-indicator">
                      <span></span>
                    </div>
                  </div>

                  <strong>Casual</strong>

                  <p>Conversación informal y relajada para marcas con un estilo más desenfadado.</p>

                  <span class="tone-example"> “¡Hey! 👋 ¿Qué necesitas?” </span>
                </label>
              </div>
            </div>
          </section>

          <!-- FEEDBACK -->

          <div v-if="error" class="feedback feedback-error">
            <div class="feedback-symbol">!</div>

            <div>
              <strong>No se han podido guardar los cambios</strong>
              <span>{{ error }}</span>
            </div>
          </div>

          <div v-if="success" class="feedback feedback-success">
            <div class="feedback-symbol">✓</div>

            <div>
              <strong>Configuración actualizada</strong>
              <span>{{ success }}</span>
            </div>
          </div>

          <!-- SAVE -->

          <div class="save-bar">
            <div>
              <strong>Configuración del agente</strong>

              <span> Guarda los cambios para aplicarlos a las próximas conversaciones. </span>
            </div>

            <button type="submit" class="save-button" :disabled="saving">
              <span v-if="saving" class="button-spinner"></span>

              <span v-else>✓</span>

              {{ saving ? "Guardando..." : "Guardar configuración" }}
            </button>
          </div>
        </div>

        <!-- SIDEBAR / PREVIEW -->

        <aside class="config-sidebar">
          <!-- PREVIEW -->

          <section class="preview-card">
            <div class="preview-header">
              <div>
                <span class="preview-label"> Vista previa </span>

                <h3>Así hablará tu agente</h3>
              </div>

              <span class="live-badge">
                <span></span>
                Preview
              </span>
            </div>

            <div class="chat-preview">
              <div class="chat-agent">
                <div class="chat-avatar">✦</div>

                <div class="chat-bubble">
                  {{ welcomeMessage || "¡Hola! 👋 ¿En qué puedo ayudarte?" }}
                </div>
              </div>

              <div class="chat-user">
                <div class="user-bubble">Hola, quería información sobre vuestros servicios.</div>
              </div>

              <div class="chat-agent">
                <div class="chat-avatar">✦</div>

                <div class="chat-bubble">
                  <template v-if="tone === 'professional'">
                    Por supuesto. Estaré encantado de ayudarle. ¿Sobre qué servicio necesita información?
                  </template>

                  <template v-else-if="tone === 'friendly'">
                    ¡Claro! 😊 Estaré encantado de ayudarte. ¿Sobre qué servicio quieres información?
                  </template>

                  <template v-else> ¡Claro! 😄 Dime qué servicio te interesa y te cuento todo. </template>
                </div>
              </div>
            </div>

            <div class="preview-footer">
              <span class="status-dot"></span>

              <span>
                Tono:
                <strong>
                  {{ tone === "professional" ? "Profesional" : tone === "friendly" ? "Cercano" : "Casual" }}
                </strong>
              </span>
            </div>
          </section>

          <!-- CONFIG STATUS -->

          <section class="status-card">
            <div class="status-card-header">
              <h3>Configuración</h3>

              <span class="configuration-badge">
                {{ systemInstructions || welcomeMessage ? "Personalizado" : "Básico" }}
              </span>
            </div>

            <div class="status-list">
              <div class="status-row">
                <span class="check" :class="{ complete: systemInstructions }">
                  {{ systemInstructions ? "✓" : "·" }}
                </span>

                <div>
                  <strong>Instrucciones</strong>

                  <span>
                    {{ systemInstructions ? "Configuradas" : "Sin personalizar" }}
                  </span>
                </div>
              </div>

              <div class="status-row">
                <span class="check" :class="{ complete: welcomeMessage }">
                  {{ welcomeMessage ? "✓" : "·" }}
                </span>

                <div>
                  <strong>Bienvenida</strong>

                  <span>
                    {{ welcomeMessage ? "Personalizada" : "Mensaje predeterminado" }}
                  </span>
                </div>
              </div>

              <div class="status-row">
                <span class="check complete"> ✓ </span>

                <div>
                  <strong>Tono</strong>

                  <span>
                    {{ tone === "professional" ? "Profesional" : tone === "friendly" ? "Cercano" : "Casual" }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- TIP -->

          <section class="tip-card">
            <div class="tip-icon">i</div>

            <div>
              <strong>Consejo</strong>

              <p>
                Las instrucciones funcionan mejor cuando son claras y concretas. Indica cómo debe responder y
                qué situaciones requieren atención humana.
              </p>
            </div>
          </section>
        </aside>
      </form>
    </div>
  </div>
</template>

<style scoped>
.agent-config-page {
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

  margin-bottom: 28px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.agent-mark {
  width: 50px;
  height: 50px;

  flex: 0 0 50px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 13px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 20px;

  box-shadow: 0 6px 15px rgba(15, 23, 42, 0.15);
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 4px;

  color: #16a34a;

  font-size: 9px;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;

  flex: 0 0 6px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.page-header h1 {
  margin: 0;

  color: var(--text);

  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.page-header p {
  max-width: 600px;

  margin: 5px 0 0;

  color: var(--text-secondary);

  font-size: 11px;
  line-height: 1.5;
}

.back-button {
  min-height: 37px;

  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 12px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: white;
  color: var(--text-secondary);

  font-size: 10px;
  font-weight: 600;

  text-decoration: none;

  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.back-button:hover {
  border-color: #cbd5e1;

  background: var(--surface-soft);
  color: var(--text);
}

/* LAYOUT */

.config-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 18px;
}

.config-main,
.config-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* CONFIG CARD */

.config-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 16px 18px;

  border-bottom: 1px solid var(--border);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 13px;
}

.card-icon.secondary {
  background: #ecfdf3;
  color: #16a34a;
}

.card-icon.tone-icon {
  background: #f5f3ff;
  color: #7c3aed;

  font-size: 10px;
  font-weight: 700;
}

.card-heading h2 {
  margin: 0;

  color: var(--text);

  font-size: 12px;
  letter-spacing: -0.01em;
}

.card-heading p {
  margin: 2px 0 0;

  color: var(--text-muted);

  font-size: 8px;
}

.card-step {
  padding: 4px 7px;

  border-radius: 999px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 8px;
  font-weight: 600;
}

.card-content {
  padding: 18px;
}

/* FIELDS */

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.field label {
  color: var(--text);

  font-size: 10px;
  font-weight: 600;
}

.optional {
  color: var(--text-muted);

  font-size: 8px;
}

.field textarea {
  width: 100%;

  box-sizing: border-box;

  padding: 11px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: white;
  color: var(--text);

  font: inherit;
  font-size: 10px;
  line-height: 1.6;

  outline: none;

  resize: vertical;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.field textarea::placeholder {
  color: #98a2b3;
}

.field textarea:focus {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.field-help {
  margin: 0;

  color: var(--text-muted);

  font-size: 8px;
  line-height: 1.5;
}

.field-info {
  display: flex;
  align-items: flex-start;
  gap: 7px;

  padding: 8px 9px;

  border-radius: 7px;

  background: var(--surface-soft);
}

.info-icon {
  width: 17px;
  height: 17px;

  flex: 0 0 17px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 7px;
  font-weight: 700;
}

.field-info p {
  margin: 1px 0 0;

  color: var(--text-secondary);

  font-size: 8px;
  line-height: 1.5;
}

/* TONES */

.tone-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
}

.tone-option {
  position: relative;

  min-height: 145px;

  display: flex;
  flex-direction: column;

  padding: 12px;

  border: 1px solid var(--border);
  border-radius: 10px;

  background: white;

  cursor: pointer;

  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.tone-option:hover {
  border-color: #cbd5e1;
}

.tone-option.selected {
  border-color: #93c5fd;

  background: #f8fbff;

  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.06);
}

.tone-option > input {
  position: absolute;

  opacity: 0;

  pointer-events: none;
}

.tone-option-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 12px;
}

.tone-symbol {
  width: 27px;
  height: 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: var(--surface-soft);
  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 700;
}

.tone-option.selected .tone-symbol {
  background: var(--primary-soft);
  color: var(--primary);
}

.radio-indicator {
  width: 14px;
  height: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #d0d5dd;
  border-radius: 50%;
}

.tone-option.selected .radio-indicator {
  border-color: var(--primary);
}

.radio-indicator span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: transparent;
}

.tone-option.selected .radio-indicator span {
  background: var(--primary);
}

.tone-option > strong {
  color: var(--text);

  font-size: 10px;
}

.tone-option > p {
  margin: 4px 0 12px;

  color: var(--text-muted);

  font-size: 8px;
  line-height: 1.5;
}

.tone-example {
  margin-top: auto;

  padding-top: 8px;

  border-top: 1px solid var(--border);

  color: var(--text-secondary);

  font-size: 8px;
  font-style: italic;
}

/* PREVIEW */

.preview-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: white;

  box-shadow: var(--shadow-sm);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;

  padding: 14px;

  border-bottom: 1px solid var(--border);
}

.preview-label {
  color: var(--primary);

  font-size: 7px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.preview-header h3 {
  margin: 3px 0 0;

  color: var(--text);

  font-size: 11px;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 5px;

  padding: 4px 6px;

  border-radius: 999px;

  background: #ecfdf3;
  color: #16a34a;

  font-size: 7px;
  font-weight: 600;
}

.live-badge > span {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #22c55e;
}

.chat-preview {
  min-height: 300px;

  display: flex;
  flex-direction: column;
  gap: 12px;

  padding: 16px 13px;

  background: #f8fafc;
}

.chat-agent {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.chat-avatar {
  width: 23px;
  height: 23px;

  flex: 0 0 23px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 8px;
}

.chat-bubble,
.user-bubble {
  max-width: 78%;

  padding: 8px 9px;

  border-radius: 9px;

  font-size: 8px;
  line-height: 1.55;
}

.chat-bubble {
  border: 1px solid var(--border);

  border-top-left-radius: 3px;

  background: white;
  color: var(--text-secondary);
}

.chat-user {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  border-top-right-radius: 3px;

  background: var(--primary);
  color: white;
}

.preview-footer {
  display: flex;
  align-items: center;
  gap: 7px;

  padding: 10px 13px;

  border-top: 1px solid var(--border);

  color: var(--text-muted);

  font-size: 8px;
}

.preview-footer strong {
  color: var(--text-secondary);
}

/* STATUS */

.status-card {
  padding: 14px;

  border: 1px solid var(--border);
  border-radius: 12px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 13px;
}

.status-card-header h3 {
  margin: 0;

  color: var(--text);

  font-size: 10px;
}

.configuration-badge {
  padding: 3px 6px;

  border-radius: 999px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 7px;
  font-weight: 600;
}

.status-list {
  display: flex;
  flex-direction: column;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 9px 0;

  border-bottom: 1px solid var(--border);
}

.status-row:last-child {
  border-bottom: 0;
}

.check {
  width: 19px;
  height: 19px;

  flex: 0 0 19px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #f2f4f7;
  color: var(--text-muted);

  font-size: 8px;
  font-weight: 700;
}

.check.complete {
  background: #ecfdf3;
  color: #16a34a;
}

.status-row > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.status-row strong {
  color: var(--text);

  font-size: 8px;
}

.status-row span:not(.check) {
  color: var(--text-muted);

  font-size: 7px;
}

/* TIP */

.tip-card {
  display: flex;
  align-items: flex-start;
  gap: 9px;

  padding: 12px;

  border: 1px solid #dbeafe;
  border-radius: 10px;

  background: #f8fbff;
}

.tip-icon {
  width: 21px;
  height: 21px;

  flex: 0 0 21px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 8px;
  font-weight: 700;
}

.tip-card strong {
  color: var(--text);

  font-size: 8px;
}

.tip-card p {
  margin: 3px 0 0;

  color: var(--text-secondary);

  font-size: 7px;
  line-height: 1.55;
}

/* FEEDBACK */

.feedback {
  display: flex;
  align-items: flex-start;
  gap: 9px;

  padding: 10px 11px;

  border: 1px solid;
  border-radius: 9px;
}

.feedback-symbol {
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

.feedback > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feedback strong {
  font-size: 9px;
}

.feedback span {
  font-size: 8px;
}

.feedback-error {
  border-color: #fecaca;

  background: var(--danger-soft);
  color: var(--danger);
}

.feedback-error .feedback-symbol {
  background: #fee2e2;
}

.feedback-success {
  border-color: #bbf7d0;

  background: #f0fdf4;
  color: #15803d;
}

.feedback-success .feedback-symbol {
  background: #dcfce7;
}

/* SAVE */

.save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 13px 15px;

  border: 1px solid var(--border);
  border-radius: 11px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.save-bar > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.save-bar strong {
  color: var(--text);

  font-size: 9px;
}

.save-bar span {
  color: var(--text-muted);

  font-size: 8px;
}

.save-button {
  min-height: 37px;

  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 13px;

  border: 0;
  border-radius: 8px;

  background: var(--primary);
  color: white;

  font: inherit;
  font-size: 9px;
  font-weight: 600;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.18);

  cursor: pointer;

  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.save-button:hover:not(:disabled) {
  background: var(--primary-hover);

  transform: translateY(-1px);
}

.save-button:disabled {
  opacity: 0.55;

  cursor: not-allowed;
}

.save-button > span {
  color: inherit;
}

.button-spinner {
  width: 10px;
  height: 10px;

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

/* LOADING */

.loading-card {
  min-height: 180px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.spinner {
  width: 22px;
  height: 22px;

  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

.loading-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loading-card strong {
  color: var(--text);

  font-size: 10px;
}

.loading-card span {
  color: var(--text-muted);

  font-size: 8px;
}

/* RESPONSIVE */

@media (max-width: 1050px) {
  .config-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
  }

  .tone-grid {
    grid-template-columns: 1fr;
  }

  .tone-option {
    min-height: auto;
  }
}

@media (max-width: 900px) {
  .agent-config-page {
    padding: 30px 32px 60px;
  }

  .config-layout {
    grid-template-columns: 1fr;
  }

  .config-sidebar {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    align-items: start;
  }

  .tip-card {
    grid-column: 1 / -1;
  }

  .tone-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .agent-config-page {
    padding: 24px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .back-button {
    width: 100%;

    box-sizing: border-box;
  }

  .config-sidebar {
    display: flex;
  }

  .tone-grid {
    grid-template-columns: 1fr;
  }

  .save-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .save-button {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .header-content {
    align-items: flex-start;
  }

  .agent-mark {
    width: 44px;
    height: 44px;

    flex-basis: 44px;
  }

  .page-header h1 {
    font-size: 25px;
  }

  .card-header {
    align-items: flex-start;
  }

  .card-step {
    display: none;
  }

  .card-content {
    padding: 15px;
  }
}

/* =========================
   AGENT CONFIG TYPOGRAPHY FIX
========================= */

/* BREADCRUMB */

.breadcrumb {
  font-size: 13px;
}

/* =========================
   HEADER
========================= */

.header-meta {
  font-size: 12px;
}

.page-header h1 {
  font-size: 30px;
}

.page-header p {
  max-width: 650px;

  font-size: 15px;
  line-height: 1.6;
}

.back-button {
  min-height: 40px;
  padding: 0 14px;

  font-size: 13px;
}

/* =========================
   CONFIG CARDS
========================= */

.card-icon {
  font-size: 15px;
}

.card-icon.tone-icon {
  font-size: 12px;
}

.card-heading h2 {
  font-size: 16px;
  line-height: 1.35;
}

.card-heading p {
  margin-top: 3px;

  font-size: 12px;
  line-height: 1.45;
}

.card-step {
  padding: 4px 8px;

  font-size: 11px;
}

/* =========================
   FIELDS
========================= */

.field label {
  font-size: 13px;
}

.optional {
  font-size: 11px;
}

.field textarea {
  padding: 12px;

  font-size: 14px;
  line-height: 1.6;
}

.field-help {
  font-size: 12px;
  line-height: 1.55;
}

/* Information box */

.info-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;

  font-size: 9px;
}

.field-info {
  padding: 10px 11px;
}

.field-info p {
  font-size: 12px;
  line-height: 1.55;
}

/* =========================
   TONE OPTIONS
========================= */

.tone-option {
  min-height: 165px;
  padding: 14px;
}

.tone-symbol {
  width: 31px;
  height: 31px;

  font-size: 11px;
}

.radio-indicator {
  width: 16px;
  height: 16px;
}

.radio-indicator span {
  width: 7px;
  height: 7px;
}

.tone-option > strong {
  font-size: 14px;
}

.tone-option > p {
  margin: 5px 0 13px;

  font-size: 12px;
  line-height: 1.55;
}

.tone-example {
  padding-top: 10px;

  font-size: 12px;
  line-height: 1.5;
}

/* =========================
   LIVE PREVIEW
========================= */

.preview-label {
  font-size: 10px;
}

.preview-header h3 {
  font-size: 14px;
}

.live-badge {
  padding: 4px 7px;

  font-size: 10px;
}

.chat-avatar {
  width: 27px;
  height: 27px;
  flex: 0 0 27px;

  font-size: 9px;
}

.chat-bubble,
.user-bubble {
  padding: 9px 10px;

  font-size: 12px;
  line-height: 1.55;
}

.preview-footer {
  font-size: 11px;
}

/* =========================
   CONFIGURATION STATUS
========================= */

.status-card-header h3 {
  font-size: 14px;
}

.configuration-badge {
  padding: 4px 7px;

  font-size: 10px;
}

.check {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;

  font-size: 9px;
}

.status-row strong {
  font-size: 12px;
}

.status-row span:not(.check) {
  margin-top: 2px;

  font-size: 11px;
  line-height: 1.4;
}

/* =========================
   TIP
========================= */

.tip-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;

  font-size: 10px;
}

.tip-card strong {
  font-size: 12px;
}

.tip-card p {
  margin-top: 4px;

  font-size: 11px;
  line-height: 1.55;
}

/* =========================
   FEEDBACK
========================= */

.feedback-symbol {
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

/* =========================
   SAVE BAR
========================= */

.save-bar strong {
  font-size: 13px;
}

.save-bar span {
  font-size: 12px;
}

.save-button {
  min-height: 41px;
  padding: 0 15px;

  font-size: 13px;
}

.button-spinner {
  width: 13px;
  height: 13px;

  border-width: 2px;
}

/* =========================
   LOADING
========================= */

.loading-card strong {
  font-size: 14px;
}

.loading-card span {
  font-size: 12px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 760px) {
  .breadcrumb {
    font-size: 12px;
  }

  .page-header p {
    font-size: 14px;
  }

  .back-button {
    font-size: 13px;
  }

  .card-heading h2 {
    font-size: 15px;
  }

  .field label {
    font-size: 13px;
  }

  .field textarea {
    /*
      16px para evitar el zoom automático
      de Safari/iPhone al enfocar.
    */
    font-size: 16px;
  }

  .tone-option > strong {
    font-size: 14px;
  }

  .tone-option > p,
  .tone-example {
    font-size: 12px;
  }

  .save-button {
    font-size: 14px;
  }
}

@media (max-width: 520px) {
  .page-header h1 {
    font-size: 27px;
  }

  .header-meta {
    font-size: 12px;
  }

  .card-heading p {
    font-size: 12px;
  }
}
</style>
