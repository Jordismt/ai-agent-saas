<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../../infrastructure/supabase/supabaseClient.js";
import { SupabaseAuthService } from "../infrastructure/SupabaseAuthService.js";

const router = useRouter();
const authService = new SupabaseAuthService();

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const checking = ref(true);
const authorized = ref(false);
const error = ref("");
const success = ref(false);

let subscription;

onMounted(async () => {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      authorized.value = true;
      checking.value = false;
    }
  });

  subscription = data.subscription;

  // La recuperación puede establecer la sesión
  // antes de que el componente termine de montarse.
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData.session) {
    authorized.value = true;
  }

  checking.value = false;
});

onUnmounted(() => {
  subscription?.unsubscribe();
});

async function handleReset() {
  error.value = "";

  if (password.value.length < 8) {
    error.value = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }

  loading.value = true;

  try {
    await authService.updatePassword(password.value);
    success.value = true;

    // Cerrar la sesión temporal de recuperación.
    await supabase.auth.signOut();
  } catch (err) {
    error.value = err.message || "No se pudo cambiar la contraseña.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="recovery-page">
    <div class="recovery-card">
      <RouterLink to="/login" class="brand">✦ Resbix</RouterLink>

      <p v-if="checking">Verificando enlace...</p>

      <template v-else-if="success">
        <h1>Contraseña actualizada</h1>
        <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <button @click="router.push('/login')">Iniciar sesión</button>
      </template>

      <template v-else-if="!authorized">
        <h1>Enlace no válido</h1>
        <p>El enlace ha caducado o no se ha podido verificar.</p>
        <RouterLink to="/forgot-password"> Solicitar otro enlace </RouterLink>
      </template>

      <template v-else>
        <h1>Nueva contraseña</h1>
        <p>Introduce la contraseña que quieres utilizar.</p>

        <form @submit.prevent="handleReset">
          <label for="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required />

          <label for="confirm-password"> Repetir contraseña </label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required />

          <p v-if="error" class="error">{{ error }}</p>

          <button type="submit" :disabled="loading">
            {{ loading ? "Guardando..." : "Cambiar contraseña" }}
          </button>
        </form>
      </template>
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
