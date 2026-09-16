```vue
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { SupabaseAuthService } from "../../auth/infrastructure/SupabaseAuthService.js";

const router = useRouter();
const authService = new SupabaseAuthService();

const loading = ref(false);
const error = ref("");

const handleLogout = async () => {
  error.value = "";
  loading.value = true;

  try {
    await authService.logout();

    await router.push("/login");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main>
    <h1>Dashboard</h1>

    <p>Bienvenido a tu panel de control.</p>

    <nav>
      <RouterLink to="/businesses"> Mis negocios </RouterLink>

      <RouterLink to="/businesses/create"> Crear negocio </RouterLink>
    </nav>

    <button type="button" :disabled="loading" @click="handleLogout">
      {{ loading ? "Cerrando sesión..." : "Cerrar sesión" }}
    </button>

    <p v-if="error">
      {{ error }}
    </p>
  </main>
</template>
```
