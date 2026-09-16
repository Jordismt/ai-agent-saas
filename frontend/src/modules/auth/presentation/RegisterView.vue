<script setup>
import { ref } from "vue";
import { SupabaseAuthService } from "../infrastructure/SupabaseAuthService.js";

const authService = new SupabaseAuthService();

const email = ref("");
const password = ref("");

const loading = ref(false);
const error = ref("");
const success = ref("");

const handleRegister = async () => {
  error.value = "";
  success.value = "";

  if (!email.value || !password.value) {
    error.value = "Email y contraseña son obligatorios";
    return;
  }

  loading.value = true;

  try {
    await authService.register({
      email: email.value,
      password: password.value,
    });

    success.value = "Registro correcto. Revisa tu correo para confirmar la cuenta.";
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main>
    <h1>Crear cuenta</h1>

    <form @submit.prevent="handleRegister">
      <div>
        <label for="email">Email</label>

        <input id="email" v-model="email" type="email" autocomplete="email" required />
      </div>

      <div>
        <label for="password">Contraseña</label>

        <input id="password" v-model="password" type="password" autocomplete="new-password" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Creando cuenta..." : "Crear cuenta" }}
      </button>
    </form>

    <p v-if="error">
      {{ error }}
    </p>

    <p v-if="success">
      {{ success }}
    </p>
  </main>
</template>
