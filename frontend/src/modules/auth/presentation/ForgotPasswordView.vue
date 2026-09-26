<script setup>
import { ref } from "vue";
import { SupabaseAuthService } from "../infrastructure/SupabaseAuthService.js";

const authService = new SupabaseAuthService();

const email = ref("");
const loading = ref(false);
const sent = ref(false);
const error = ref("");

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    await authService.requestPasswordReset(email.value);
    sent.value = true;
  } catch (err) {
    error.value = "No hemos podido procesar la solicitud. Inténtalo más tarde.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="recovery-page">
    <div class="recovery-card">
      <RouterLink to="/login" class="brand">✦ Resbix</RouterLink>

      <template v-if="!sent">
        <h1>Recupera tu contraseña</h1>
        <p>Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>

        <form @submit.prevent="handleSubmit">
          <label for="recovery-email">Correo electrónico</label>

          <input
            id="recovery-email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            autocomplete="email"
            required
            :disabled="loading" />

          <p v-if="error" class="error">{{ error }}</p>

          <button type="submit" :disabled="loading">
            {{ loading ? "Enviando..." : "Enviar enlace" }}
          </button>
        </form>
      </template>

      <template v-else>
        <h1>Revisa tu correo</h1>
        <p>Si existe una cuenta asociada a ese correo, recibirás un enlace para recuperar tu contraseña.</p>
      </template>

      <RouterLink to="/login" class="back"> ← Volver al inicio de sesión </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.recovery-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
}

.recovery-card {
  width: 100%;
  max-width: 440px;
  padding: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: white;
  box-shadow: 0 20px 60px #0f172a0a;
}

.brand {
  color: #4f46e5;
  font-size: 24px;
  font-weight: 800;
  text-decoration: none;
}

h1 {
  margin: 32px 0 12px;
  color: #0f172a;
  font-size: 28px;
}

p {
  color: #64748b;
  line-height: 1.6;
}

form {
  display: grid;
  gap: 12px;
  margin-top: 28px;
}

label {
  font-size: 14px;
  font-weight: 600;
}

input {
  padding: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font: inherit;
}

button {
  margin-top: 8px;
  padding: 14px;
  border: 0;
  border-radius: 12px;
  background: #4f46e5;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
}

.back {
  display: inline-block;
  margin-top: 24px;
  color: #4f46e5;
  text-decoration: none;
}
</style>
