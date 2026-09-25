<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
import { BusinessService } from "../infrastructure/BusinessService";
import { CreateBusiness } from "../application/CreateBusiness";

const businessService = new BusinessService();
const createBusiness = new CreateBusiness(businessService);

const name = ref("");
const description = ref("");
const phone = ref("");
const address = ref("");

const loading = ref(false);
const error = ref("");
const success = ref("");

const handleSubmit = async () => {
  error.value = "";
  success.value = "";

  if (!name.value.trim()) {
    error.value = "El nombre del negocio es obligatorio.";
    return;
  }

  loading.value = true;

  try {
    const business = await createBusiness.execute({
      name: name.value.trim(),
      description: description.value.trim() || null,
      phone: phone.value.trim() || null,
      address: address.value.trim() || null,
    });

    if (!business?.id) throw new Error("No se recibió el identificador del negocio.");
    await router.push({name:"business-billing",params:{id:business.id}});
    success.value = "Negocio creado. Completa tu suscripción.";

    name.value = "";
    description.value = "";
    phone.value = "";
    address.value = "";
  } catch (err) {
    error.value = err.response?.data?.message || "No se ha podido crear el negocio.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="create-business-page">
    <div class="page-container">
      <!-- BREADCRUMB -->

      <nav class="breadcrumb">
        <RouterLink to="/businesses"> Negocios </RouterLink>

        <span>/</span>

        <span>Nuevo negocio</span>
      </nav>

      <!-- HEADER -->

      <header class="page-header">
        <div>
          <p class="eyebrow">Configuración</p>

          <h1>Crear negocio</h1>

          <p class="page-description">
            Añade la información básica del negocio para empezar a configurar su agente de IA.
          </p>
        </div>
      </header>

      <!-- CONTENT -->

      <div class="create-layout">
        <!-- FORM -->

        <section class="form-card">
          <div class="card-header">
            <div class="header-icon">▦</div>

            <div>
              <h2>Información del negocio</h2>

              <p>Podrás modificar y ampliar esta información más adelante.</p>
            </div>
          </div>

          <form class="business-form" @submit.prevent="handleSubmit">
            <!-- NAME -->

            <div class="field">
              <div class="field-header">
                <label for="name"> Nombre del negocio </label>

                <span class="required"> Obligatorio </span>
              </div>

              <input
                id="name"
                v-model="name"
                type="text"
                required
                autocomplete="organization"
                placeholder="Ej. Peluquería Laura" />

              <p class="field-help">Es el nombre que utilizará el agente para identificar tu negocio.</p>
            </div>

            <!-- DESCRIPTION -->

            <div class="field">
              <label for="description"> Descripción </label>

              <textarea
                id="description"
                v-model="description"
                rows="4"
                placeholder="Ej. Peluquería y barbería especializada en cortes, barba y tratamientos capilares."></textarea>

              <div class="field-bottom">
                <p class="field-help">Describe brevemente qué hace el negocio.</p>

                <span class="optional"> Opcional </span>
              </div>
            </div>

            <!-- CONTACT GRID -->

            <div class="fields-grid">
              <div class="field">
                <label for="phone"> Teléfono </label>

                <div class="input-with-icon">
                  <span>☎</span>

                  <input id="phone" v-model="phone" type="tel" autocomplete="tel" placeholder="600 000 000" />
                </div>

                <p class="field-help">Teléfono de contacto del negocio.</p>
              </div>

              <div class="field">
                <label for="address"> Dirección </label>

                <div class="input-with-icon">
                  <span>⌖</span>

                  <input
                    id="address"
                    v-model="address"
                    type="text"
                    autocomplete="street-address"
                    placeholder="Calle Mayor 10" />
                </div>

                <p class="field-help">Ubicación física del establecimiento.</p>
              </div>
            </div>

            <!-- ERROR -->

            <div v-if="error" class="feedback feedback-error">
              <div class="feedback-icon">!</div>

              <div>
                <strong>No se ha podido crear el negocio</strong>
                <span>{{ error }}</span>
              </div>
            </div>

            <!-- SUCCESS -->

            <div v-if="success" class="feedback feedback-success">
              <div class="feedback-icon">✓</div>

              <div>
                <strong>Negocio creado</strong>
                <span>{{ success }}</span>
              </div>
            </div>

            <!-- ACTIONS -->

            <div class="form-actions">
              <RouterLink to="/businesses" class="cancel-button"> Cancelar </RouterLink>

              <button type="submit" class="submit-button" :disabled="loading">
                <span v-if="!loading">+</span>

                <span v-else class="button-spinner"></span>

                {{ loading ? "Creando negocio..." : "Crear negocio" }}
              </button>
            </div>
          </form>
        </section>

        <!-- SIDE PANEL -->

        <aside class="side-panel">
          <div class="side-card agent-card">
            <div class="agent-card-top">
              <div class="agent-icon">✦</div>

              <span class="agent-status">
                <span></span>
                Preparado
              </span>
            </div>

            <h3>Tu agente empieza aquí</h3>

            <p>
              Después de crear el negocio podrás configurar toda la información que necesita la IA para
              atender correctamente a tus clientes.
            </p>

            <div class="agent-preview">
              <div class="preview-row">
                <div class="preview-icon">◷</div>

                <div>
                  <strong>Horarios</strong>
                  <span>Define cuándo está abierto</span>
                </div>
              </div>

              <div class="preview-row">
                <div class="preview-icon">✦</div>

                <div>
                  <strong>Servicios</strong>
                  <span>Precios, duración y descripción</span>
                </div>
              </div>

              <div class="preview-row">
                <div class="preview-icon">◌</div>

                <div>
                  <strong>Agente de IA</strong>
                  <span>Personaliza su comportamiento</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-icon">i</div>

            <div>
              <strong>No hace falta tenerlo todo ahora</strong>

              <p>
                Solo necesitas el nombre para crear el negocio. El resto de la configuración puede completarse
                después.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-business-page {
  min-height: 100vh;
  padding: 34px 48px 80px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

/* =========================
   BREADCRUMB
========================= */

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

/* =========================
   HEADER
========================= */

.page-header {
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 7px;

  color: var(--primary);

  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 0;

  color: var(--text);

  font-size: 30px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.page-description {
  max-width: 620px;

  margin: 8px 0 0;

  color: var(--text-secondary);

  font-size: 12px;
  line-height: 1.6;
}

/* =========================
   LAYOUT
========================= */

.create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 18px;
}

/* =========================
   FORM CARD
========================= */

.form-card {
  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 18px 20px;

  border-bottom: 1px solid var(--border);
}

.header-icon {
  width: 36px;
  height: 36px;

  flex: 0 0 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 15px;
}

.card-header h2 {
  margin: 0;

  color: var(--text);

  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.card-header p {
  margin: 3px 0 0;

  color: var(--text-muted);

  font-size: 9px;
}

/* =========================
   FORM
========================= */

.business-form {
  display: flex;
  flex-direction: column;
  gap: 22px;

  padding: 22px 20px 20px;
}

.field {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-header,
.field-bottom {
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

.required {
  color: var(--primary);

  font-size: 8px;
  font-weight: 600;
}

.optional {
  color: var(--text-muted);

  font-size: 8px;
}

.field input,
.field textarea {
  width: 100%;

  box-sizing: border-box;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: #ffffff;
  color: var(--text);

  font: inherit;
  font-size: 11px;

  outline: none;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.field input {
  min-height: 41px;

  padding: 0 11px;
}

.field textarea {
  min-height: 100px;

  padding: 11px;

  line-height: 1.55;

  resize: vertical;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #98a2b3;
}

.field input:focus,
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

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.input-with-icon {
  position: relative;
}

.input-with-icon > span {
  position: absolute;
  top: 50%;
  left: 11px;

  z-index: 1;

  transform: translateY(-50%);

  color: var(--text-muted);

  font-size: 12px;

  pointer-events: none;
}

.input-with-icon input {
  padding-left: 34px;
}

/* =========================
   FEEDBACK
========================= */

.feedback {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  padding: 11px 12px;

  border: 1px solid;
  border-radius: 9px;
}

.feedback-icon {
  width: 21px;
  height: 21px;

  flex: 0 0 21px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-size: 9px;
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
  font-size: 9px;
}

.feedback-error {
  border-color: #fecaca;

  background: var(--danger-soft);
  color: var(--danger);
}

.feedback-error .feedback-icon {
  background: #fee2e2;
}

.feedback-success {
  border-color: #bbf7d0;

  background: #f0fdf4;
  color: #15803d;
}

.feedback-success .feedback-icon {
  background: #dcfce7;
}

/* =========================
   ACTIONS
========================= */

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  margin: 2px -20px -20px;
  padding: 14px 20px;

  border-top: 1px solid var(--border);

  background: #fcfcfd;
}

.cancel-button,
.submit-button {
  min-height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 13px;

  border-radius: 8px;

  font: inherit;
  font-size: 10px;
  font-weight: 600;

  text-decoration: none;
}

.cancel-button {
  border: 1px solid var(--border);

  background: white;
  color: var(--text-secondary);
}

.cancel-button:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.submit-button {
  border: 1px solid transparent;

  background: var(--primary);
  color: white;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.18);

  cursor: pointer;

  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.submit-button:hover:not(:disabled) {
  background: var(--primary-hover);

  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.button-spinner {
  width: 11px;
  height: 11px;

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
   SIDE PANEL
========================= */

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-card {
  overflow: hidden;

  padding: 18px;

  border-radius: 14px;

  background:
    radial-gradient(circle at 85% 10%, rgba(96, 165, 250, 0.2), transparent 30%),
    linear-gradient(145deg, #0f172a 0%, #172554 100%);

  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

.agent-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 20px;
}

.agent-icon {
  width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;

  background: rgba(255, 255, 255, 0.07);
  color: #bfdbfe;

  font-size: 14px;
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 6px;

  padding: 4px 7px;

  border: 1px solid rgba(74, 222, 128, 0.15);
  border-radius: 999px;

  background: rgba(34, 197, 94, 0.08);
  color: #86efac;

  font-size: 8px;
  font-weight: 600;
}

.agent-status > span {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #4ade80;
}

.agent-card > h3 {
  margin: 0;

  color: white;

  font-size: 16px;
  letter-spacing: -0.02em;
}

.agent-card > p {
  margin: 7px 0 18px;

  color: #cbd5e1;

  font-size: 9px;
  line-height: 1.65;
}

.agent-preview {
  overflow: hidden;

  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;

  background: rgba(15, 23, 42, 0.35);
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 9px;

  padding: 10px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.preview-row:last-child {
  border-bottom: 0;
}

.preview-icon {
  width: 26px;
  height: 26px;

  flex: 0 0 26px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: rgba(255, 255, 255, 0.06);
  color: #93c5fd;

  font-size: 10px;
}

.preview-row > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.preview-row strong {
  color: #f8fafc;

  font-size: 9px;
  font-weight: 600;
}

.preview-row span {
  color: #94a3b8;

  font-size: 8px;
}

/* INFO CARD */

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  padding: 13px;

  border: 1px solid var(--border);
  border-radius: 11px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.info-card-icon {
  width: 24px;
  height: 24px;

  flex: 0 0 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 9px;
  font-weight: 700;
}

.info-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-card strong {
  color: var(--text);

  font-size: 9px;
}

.info-card p {
  margin: 0;

  color: var(--text-muted);

  font-size: 8px;
  line-height: 1.5;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1000px) {
  .create-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

@media (max-width: 900px) {
  .create-business-page {
    padding: 30px 32px 60px;
  }

  .create-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

@media (max-width: 760px) {
  .create-business-page {
    padding: 24px 20px 50px;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .side-panel {
    display: flex;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .cancel-button,
  .submit-button {
    width: 100%;
    box-sizing: border-box;
  }
}

@media (max-width: 520px) {
  .page-header h1 {
    font-size: 27px;
  }

  .card-header {
    align-items: flex-start;
  }

  .business-form {
    padding: 18px 16px 16px;
  }

  .form-actions {
    margin-right: -16px;
    margin-bottom: -16px;
    margin-left: -16px;

    padding: 13px 16px;
  }
}
/* =========================
   CREATE BUSINESS TYPOGRAPHY FIX
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

  font-size: 15px;
  line-height: 1.65;
}

/* =========================
   FORM CARD HEADER
========================= */

.header-icon {
  font-size: 16px;
}

.card-header h2 {
  font-size: 16px;
  line-height: 1.35;
}

.card-header p {
  margin-top: 4px;

  font-size: 12px;
  line-height: 1.5;
}

/* =========================
   FORM
========================= */

.field label {
  font-size: 13px;
}

.required {
  font-size: 11px;
}

.optional {
  font-size: 11px;
}

/* Inputs */

.field input,
.field textarea {
  font-size: 14px;
}

.field input {
  min-height: 44px;
  padding: 0 12px;
}

.field textarea {
  min-height: 110px;

  padding: 12px;

  line-height: 1.6;
}

/* Help text */

.field-help {
  font-size: 12px;
  line-height: 1.55;
}

/* Input icons */

.input-with-icon > span {
  font-size: 14px;
}

.input-with-icon input {
  padding-left: 36px;
}

/* =========================
   FEEDBACK
========================= */

.feedback-icon {
  width: 23px;
  height: 23px;

  flex: 0 0 23px;

  font-size: 10px;
}

.feedback strong {
  font-size: 13px;
}

.feedback span {
  font-size: 12px;
  line-height: 1.45;
}

/* =========================
   ACTION BUTTONS
========================= */

.cancel-button,
.submit-button {
  min-height: 42px;

  padding: 0 15px;

  font-size: 14px;
}

.button-spinner {
  width: 13px;
  height: 13px;

  border-width: 2px;
}

/* =========================
   AGENT SIDE CARD
========================= */

.agent-icon {
  font-size: 15px;
}

.agent-status {
  padding: 4px 8px;

  font-size: 11px;
}

.agent-card > h3 {
  font-size: 18px;
  line-height: 1.35;
}

.agent-card > p {
  margin: 8px 0 18px;

  font-size: 13px;
  line-height: 1.65;
}

/* =========================
   AGENT PREVIEW
========================= */

.preview-icon {
  width: 29px;
  height: 29px;

  flex: 0 0 29px;

  font-size: 11px;
}

.preview-row strong {
  font-size: 12px;
}

.preview-row span {
  margin-top: 2px;

  font-size: 11px;
  line-height: 1.4;
}

/* =========================
   INFO CARD
========================= */

.info-card-icon {
  width: 26px;
  height: 26px;

  flex: 0 0 26px;

  font-size: 10px;
}

.info-card strong {
  font-size: 13px;
}

.info-card p {
  font-size: 12px;
  line-height: 1.55;
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

  .page-description {
    font-size: 14px;
  }

  .card-header h2 {
    font-size: 15px;
  }

  .field label {
    font-size: 13px;
  }

  /*
    16px en móvil para evitar que Safari/iPhone
    haga zoom al enfocar el input.
  */
  .field input,
  .field textarea {
    font-size: 16px;
  }

  .cancel-button,
  .submit-button {
    min-height: 44px;

    font-size: 14px;
  }

  .agent-card > h3 {
    font-size: 17px;
  }

  .agent-card > p {
    font-size: 13px;
  }
}

@media (max-width: 520px) {
  .page-header h1 {
    font-size: 27px;
  }

  .card-header p {
    font-size: 12px;
  }

  .field-help {
    font-size: 12px;
  }
}
</style>
