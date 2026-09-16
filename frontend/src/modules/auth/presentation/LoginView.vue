```vue
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { SupabaseAuthService } from "../infrastructure/SupabaseAuthService.js";
import { apiFetch } from "../../../infrastructure/http/apiClient.js";

const authService = new SupabaseAuthService();
const router = useRouter();

const email = ref("");
const password = ref("");

const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Email y contraseña son obligatorios";
    return;
  }

  loading.value = true;

  try {
    await authService.login({
      email: email.value,
      password: password.value,
    });

    const data = await apiFetch("/me");

    console.log("Usuario autenticado:", data);

    await router.push("/dashboard");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main>
    <h1>Iniciar sesión</h1>

    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">Email</label>

        <input id="email" v-model="email" type="email" autocomplete="email" required />
      </div>

      <div>
        <label for="password">Contraseña</label>

        <input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Iniciando sesión..." : "Iniciar sesión" }}
      </button>
    </form>

    <p v-if="error">
      {{ error }}
    </p>
  </main>
</template>
```
