<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";

import { apiFetch } from "../../../infrastructure/http/apiClient.js";
import { supabase } from "../../../infrastructure/supabase/supabaseClient.js";

const router = useRouter();

const email = ref("");
const businesses = ref([]);
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const password = ref("");
const confirmation = ref("");
const showConfirm = ref(false);

const canDelete = computed(
  () => confirmation.value === "ELIMINAR" && password.value.length > 0 && !submitting.value,
);

async function loadAccount() {
  loading.value = true;
  error.value = "";

  try {
    const data = await apiFetch("/account/summary");

    email.value = data.email || "";
    businesses.value = Array.isArray(data.businesses) ? data.businesses : [];
  } catch (e) {
    error.value = e.message || "No se pudo cargar tu cuenta.";
  } finally {
    loading.value = false;
  }
}

function closeConfirmation() {
  if (submitting.value) return;

  showConfirm.value = false;
  password.value = "";
  confirmation.value = "";
  error.value = "";
}

async function deleteAccount() {
  if (!canDelete.value) return;

  submitting.value = true;
  error.value = "";

  try {
    await apiFetch("/account/delete", {
      method: "POST",
      body: JSON.stringify({
        confirmation: confirmation.value,
        password: password.value,
      }),
    });

    await supabase.auth.signOut();
    await router.replace("/login?deleted=1");
  } catch (e) {
    error.value = e.message || "No se pudo completar la eliminación.";
  } finally {
    submitting.value = false;
  }
}

onMounted(loadAccount);
</script>

<template>
  <main class="account-settings">
    <header class="page-header">
      <div class="header-icon">⚙</div>

      <div>
        <span class="eyebrow">MI CUENTA</span>
        <h1>Configuración</h1>
        <p>Gestiona tu información personal y los negocios asociados a tu cuenta.</p>
      </div>
    </header>

    <!-- CARGA -->
    <div v-if="loading" class="loading-card">
      <div class="spinner"></div>
      <p>Cargando tu configuración...</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="error && !email" class="alert-error" role="alert">
      <strong>No se pudo cargar la cuenta</strong>
      <p>{{ error }}</p>

      <button class="retry-button" @click="loadAccount">Reintentar</button>
    </div>

    <template v-else>
      <!-- INFORMACIÓN PERSONAL -->
      <section class="settings-card">
        <div class="section-header">
          <div class="section-icon">♙</div>

          <div>
            <h2>Información personal</h2>
            <p>Datos de acceso a Resbix.</p>
          </div>
        </div>

        <div class="card-content">
          <div class="field">
            <label>Correo electrónico</label>

            <div class="field-value">
              {{ email }}
            </div>
          </div>
        </div>
      </section>

      <!-- NEGOCIOS -->
      <section class="settings-card">
        <div class="section-header">
          <div class="section-icon">▦</div>

          <div>
            <h2>Mis Negocios</h2>
            <p>Negocios vinculados a tu cuenta.</p>
          </div>

          <span class="count-badge">
            {{ businesses.length }}
          </span>
        </div>

        <div class="card-content">
          <div v-if="businesses.length === 0" class="empty-state">
            <div class="empty-icon">▦</div>
            <h3>Sin negocios</h3>
            <p>Todavía no tienes negocios asociados a esta cuenta.</p>
          </div>

          <div v-else class="business-list">
            <div v-for="business in businesses" :key="business.id" class="business-item">
              <div class="business-avatar">
                {{ business.name?.charAt(0)?.toUpperCase() || "N" }}
              </div>

              <div class="business-info">
                <strong>{{ business.name }}</strong>
                <span>Negocio asociado</span>
              </div>

              <span class="business-tag"> Registrado </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ZONA DE PELIGRO -->
      <section class="danger-card">
        <div class="danger-header">
          <div class="danger-icon">!</div>

          <div>
            <h2>Zona de peligro</h2>
            <p>Acciones irreversibles.</p>
          </div>
        </div>

        <div class="danger-content">
          <h3>Eliminar cuenta</h3>

          <p>
            Al eliminar tu cuenta, se cancelarán las suscripciones de todos tus negocios y se eliminarán
            permanentemente sus datos asociados.
          </p>

          <div class="warning-box">
            <span>⚠</span>

            <div>
              <strong>Esta acción es irreversible.</strong>
              <p>Perderás el acceso a tus negocios, reservas, conversaciones, leads y configuraciones.</p>
            </div>
          </div>

          <button v-if="!showConfirm" class="delete-button" @click="showConfirm = true">
            Eliminar mi cuenta
          </button>

          <!-- CONFIRMACIÓN -->
          <form v-else class="confirmation-form" @submit.prevent="deleteAccount">
            <div class="confirmation-heading">
              <h3>Confirmar eliminación</h3>

              <button
                type="button"
                class="close-button"
                :disabled="submitting"
                @click="closeConfirmation"
                aria-label="Cerrar">
                ×
              </button>
            </div>

            <p>
              Introduce tu contraseña y escribe
              <strong>ELIMINAR</strong>
              para confirmar.
            </p>

            <div class="form-field">
              <label for="account-password"> Contraseña actual </label>

              <input
                id="account-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="Tu contraseña"
                :disabled="submitting"
                required />
            </div>

            <div class="form-field">
              <label for="delete-confirmation"> Confirmación </label>

              <input
                id="delete-confirmation"
                v-model="confirmation"
                type="text"
                autocomplete="off"
                placeholder="Escribe ELIMINAR"
                :disabled="submitting"
                required />
            </div>

            <p v-if="error" class="form-error" role="alert">
              {{ error }}
            </p>

            <div class="form-actions">
              <button type="button" class="cancel-button" :disabled="submitting" @click="closeConfirmation">
                Cancelar
              </button>

              <button type="submit" class="delete-button" :disabled="!canDelete">
                {{ submitting ? "Eliminando..." : "Eliminar definitivamente" }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.account-settings {
  --settings-text: #0f172a;
  --settings-muted: #64748b;
  --settings-border: #e2e8f0;

  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  color: var(--settings-text);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 32px;
}

.header-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 18px;
  font-size: 30px;
}

.eyebrow {
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.8px;
}

.page-header h1 {
  margin: 5px 0;
  font-size: clamp(27px, 4vw, 36px);
  font-weight: 800;
  letter-spacing: -1px;
}

.page-header p,
.section-header p,
.danger-header p {
  margin: 5px 0 0;
  color: var(--settings-muted);
  font-size: 14px;
  line-height: 1.6;
}

.settings-card,
.danger-card {
  margin-bottom: 22px;
  background: #fff;
  border: 1px solid var(--settings-border);
  border-radius: 18px;
  overflow: hidden;
}

.section-header,
.danger-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 23px 25px;
  border-bottom: 1px solid var(--settings-border);
}

.section-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 23px;
}

.section-header h2,
.danger-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}

.card-content {
  padding: 25px;
}

.field label {
  display: block;
  margin-bottom: 9px;
  font-size: 12px;
  font-weight: 700;
  color: var(--settings-muted);
}

.field-value {
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid var(--settings-border);
  border-radius: 10px;
  font-size: 14px;
}

.count-badge {
  margin-left: auto;
  padding: 5px 12px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
}

.business-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.business-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid var(--settings-border);
  border-radius: 12px;
}

.business-avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 12px;
  font-weight: 800;
}

.business-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.business-info strong {
  overflow-wrap: anywhere;
  font-size: 14px;
}

.business-info span {
  font-size: 12px;
  color: var(--settings-muted);
}

.business-tag {
  padding: 6px 10px;
  border-radius: 20px;
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 700;
}

.empty-state {
  padding: 22px;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  color: #94a3b8;
}

.empty-state h3 {
  margin: 12px 0 5px;
}

.empty-state p {
  color: var(--settings-muted);
  font-size: 13px;
}

.danger-card {
  border-color: #fecaca;
}

.danger-header {
  background: #fff7f7;
  border-bottom-color: #fee2e2;
}

.danger-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 22px;
  font-weight: 800;
}

.danger-header h2 {
  color: #b91c1c;
}

.danger-content {
  padding: 25px;
}

.danger-content h3 {
  margin: 0 0 9px;
  font-size: 16px;
}

.danger-content > p {
  max-width: 650px;
  color: var(--settings-muted);
  font-size: 14px;
  line-height: 1.7;
}

.warning-box {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  background: #fff7ed;
  color: #9a3412;
}

.warning-box p {
  margin: 5px 0 0;
  font-size: 13px;
  line-height: 1.6;
}

button {
  font-family: inherit;
  cursor: pointer;
  transition: 0.2s ease;
}

.delete-button {
  padding: 12px 19px;
  border: 0;
  border-radius: 10px;
  background: #dc2626;
  color: white;
  font-size: 13px;
  font-weight: 750;
}

.delete-button:hover:not(:disabled) {
  background: #b91c1c;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirmation-form {
  margin-top: 25px;
  padding: 22px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fffafa;
}

.confirmation-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.confirmation-heading h3 {
  margin: 0;
}

.close-button {
  border: 0;
  background: transparent;
  font-size: 25px;
  color: #64748b;
}

.confirmation-form > p {
  font-size: 13px;
  line-height: 1.6;
}

.form-field {
  margin-top: 19px;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.form-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  font: inherit;
  font-size: 14px;
}

.form-field input:focus {
  outline: 2px solid #fca5a5;
  border-color: #dc2626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
  flex-wrap: wrap;
}

.cancel-button,
.retry-button {
  padding: 12px 19px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  color: #334155;
  font-weight: 700;
}

.form-error {
  color: #b91c1c;
  font-size: 13px;
}

.alert-error {
  padding: 24px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fff7f7;
}

.alert-error p {
  overflow-wrap: anywhere;
}

.retry-button {
  margin-top: 12px;
}

.loading-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 30px;
  background: white;
  border: 1px solid var(--settings-border);
  border-radius: 16px;
}

.spinner {
  width: 23px;
  height: 23px;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .account-settings {
    padding: 22px 15px 60px;
  }

  .page-header {
    align-items: flex-start;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .section-header,
  .danger-header,
  .card-content,
  .danger-content {
    padding: 18px;
  }

  .business-tag {
    display: none;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
