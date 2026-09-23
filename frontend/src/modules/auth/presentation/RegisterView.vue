<script setup>
import { computed, ref } from "vue";
import { SupabaseAuthService } from "../infrastructure/SupabaseAuthService.js";

const authService = new SupabaseAuthService();

const email = ref("");
const password = ref("");

const loading = ref(false);
const error = ref("");
const success = ref("");

const showPassword = ref(false);

const passwordStrength = computed(() => {
  const value = password.value;

  if (!value) {
    return {
      level: 0,
      label: "",
    };
  }

  let score = 0;

  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  if (score <= 1) {
    return {
      level: 1,
      label: "Débil",
    };
  }

  if (score <= 2) {
    return {
      level: 2,
      label: "Aceptable",
    };
  }

  if (score === 3) {
    return {
      level: 3,
      label: "Buena",
    };
  }

  return {
    level: 4,
    label: "Muy buena",
  };
});

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
    error.value = err.message || "No se ha podido crear la cuenta.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="auth-page">
    <!-- LEFT -->

    <section class="auth-section">
      <div class="auth-container">
        <!-- BRAND -->

        <RouterLink to="/login" class="brand">
          <div class="brand-mark">
            <span>✦</span>
          </div>

          <span>AgentFlow</span>
        </RouterLink>

        <!-- CONTENT -->

        <div class="auth-content">
          <div class="auth-heading">
            <span class="eyebrow"> Empieza con AgentFlow </span>

            <h1>Crea tu cuenta</h1>

            <p>
              Configura tu negocio y empieza a atender clientes con tu propio agente de inteligencia
              artificial.
            </p>
          </div>

          <!-- SUCCESS -->

          <div v-if="success" class="success-alert">
            <div class="success-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </div>

            <div>
              <strong>Cuenta creada correctamente</strong>

              <span>{{ success }}</span>
            </div>
          </div>

          <!-- ERROR -->

          <div v-if="error" class="error-alert">
            <div class="error-icon">!</div>

            <div>
              <strong>No se ha podido crear la cuenta</strong>

              <span>{{ error }}</span>
            </div>
          </div>

          <!-- FORM -->

          <form class="auth-form" @submit.prevent="handleRegister">
            <!-- EMAIL -->

            <div class="form-group">
              <label for="email"> Email </label>

              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      stroke-width="1.7" />

                    <path d="m3 7 9 6 9-6" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                  </svg>
                </div>

                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="tu@email.com"
                  :disabled="loading || !!success"
                  required />
              </div>
            </div>

            <!-- PASSWORD -->

            <div class="form-group">
              <label for="password"> Contraseña </label>

              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      stroke-width="1.7" />

                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round" />
                  </svg>
                </div>

                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Crea una contraseña"
                  :disabled="loading || !!success"
                  required />

                <button
                  type="button"
                  class="password-toggle"
                  :disabled="loading || !!success"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                      stroke="currentColor"
                      stroke-width="1.7" />

                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" />
                  </svg>

                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a17.8 17.8 0 0 1-2.1 3.2M6.6 6.6C3.6 8.5 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4-.8"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round" />
                  </svg>
                </button>
              </div>

              <!-- PASSWORD STRENGTH -->

              <div v-if="password" class="password-strength">
                <div class="strength-bars">
                  <span
                    v-for="item in 4"
                    :key="item"
                    :class="{
                      active: item <= passwordStrength.level,
                      weak: passwordStrength.level === 1,
                      medium: passwordStrength.level === 2,
                      good: passwordStrength.level === 3,
                      strong: passwordStrength.level === 4,
                    }"></span>
                </div>

                <div class="strength-meta">
                  <span> Seguridad </span>

                  <strong>
                    {{ passwordStrength.label }}
                  </strong>
                </div>
              </div>

              <p class="password-help">Te recomendamos al menos 8 caracteres, números y símbolos.</p>
            </div>

            <!-- SUBMIT -->

            <button v-if="!success" type="submit" class="register-button" :disabled="loading">
              <span v-if="loading" class="button-spinner"></span>

              <span>
                {{ loading ? "Creando cuenta..." : "Crear cuenta" }}
              </span>

              <svg v-if="!loading" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>

            <!-- SUCCESS CTA -->

            <RouterLink v-else to="/login" class="login-after-register">
              Ir a iniciar sesión

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </form>

          <!-- LOGIN -->

          <div class="login-section">
            <span> ¿Ya tienes una cuenta? </span>

            <RouterLink to="/login"> Iniciar sesión </RouterLink>
          </div>
        </div>

        <!-- FOOTER -->

        <footer class="auth-footer">
          <span> © {{ new Date().getFullYear() }} AgentFlow </span>

          <span> Plataforma de agentes IA para negocios </span>
        </footer>
      </div>
    </section>

    <!-- RIGHT -->

    <section class="showcase-section">
      <div class="showcase-glow glow-one"></div>
      <div class="showcase-glow glow-two"></div>

      <div class="showcase-content">
        <div class="showcase-badge">
          <span class="badge-dot"></span>

          Configuración en pocos minutos
        </div>

        <h2>
          Tu próximo empleado
          <span>trabaja con IA.</span>
        </h2>

        <p class="showcase-description">
          Crea tu negocio, configura sus servicios y deja que AgentFlow atienda consultas, capture
          oportunidades y derive conversaciones a tu equipo cuando sea necesario.
        </p>

        <!-- FLOW -->

        <div class="onboarding-card">
          <div class="onboarding-header">
            <div>
              <span class="small-label"> PRIMEROS PASOS </span>

              <strong> Configura tu agente </strong>
            </div>

            <span class="progress-label"> 0% </span>
          </div>

          <div class="progress-bar">
            <span></span>
          </div>

          <div class="steps">
            <div class="step active">
              <div class="step-number">1</div>

              <div class="step-content">
                <strong>Crea tu negocio</strong>

                <p>Añade la información básica de tu empresa.</p>
              </div>

              <span class="step-status"> Primero </span>
            </div>

            <div class="step">
              <div class="step-number">2</div>

              <div class="step-content">
                <strong>Configura servicios y horarios</strong>

                <p>Enséñale al agente cómo funciona tu negocio.</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>

              <div class="step-content">
                <strong>Personaliza tu agente</strong>

                <p>Define su tono, bienvenida e instrucciones.</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>

              <div class="step-content">
                <strong>Empieza a recibir clientes</strong>

                <p>Tu agente ya está listo para conversar.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FEATURES -->

        <div class="features-grid">
          <div class="feature">
            <div class="feature-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2a10 10 0 1 0 10 10"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round" />

                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </div>

            <div>
              <strong>24 / 7</strong>

              <span>Atención automática</span>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  stroke-width="1.7" />

                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.7" />

                <path d="M19 8v6M22 11h-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </div>

            <div>
              <strong>Leads</strong>

              <span>Captura automática</span>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linejoin="round" />
              </svg>
            </div>

            <div>
              <strong>Handoff</strong>

              <span>Control humano</span>
            </div>
          </div>
        </div>
      </div>

      <div class="showcase-footer">
        <span class="status-dot"></span>

        <span>AgentFlow</span>

        <span>·</span>

        <span>Powered by AI</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  width: 100%;
  min-height: 100vh;

  display: grid;
  grid-template-columns:
    minmax(440px, 0.9fr)
    minmax(520px, 1.1fr);

  background: #ffffff;
}

/* LEFT */

.auth-section {
  min-height: 100vh;

  display: flex;
  justify-content: center;

  box-sizing: border-box;

  padding: 32px 48px;

  background: #ffffff;
}

.auth-container {
  width: min(390px, 100%);

  display: flex;
  flex-direction: column;
}

.brand {
  align-self: flex-start;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  color: #101828;

  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;

  text-decoration: none;
}

.brand-mark {
  width: 29px;
  height: 29px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 10px;

  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.13);
}

.auth-content {
  width: 100%;

  margin: auto 0;
  padding: 55px 0;
}

.auth-heading {
  margin-bottom: 24px;
}

.eyebrow {
  display: block;

  margin-bottom: 7px;

  color: #2563eb;

  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.auth-heading h1 {
  margin: 0;

  color: #101828;

  font-size: 27px;
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.auth-heading p {
  max-width: 355px;

  margin: 8px 0 0;

  color: #667085;

  font-size: 10px;
  line-height: 1.6;
}

/* FORM */

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #344054;

  font-size: 8px;
  font-weight: 600;
}

.input-wrapper {
  position: relative;

  min-height: 43px;

  display: flex;
  align-items: center;

  border: 1px solid #dfe4ea;
  border-radius: 9px;

  background: #ffffff;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.input-wrapper:focus-within {
  border-color: #93c5fd;

  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.07);
}

.input-icon {
  width: 39px;

  flex: 0 0 39px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #98a2b3;
}

.input-wrapper input {
  width: 100%;
  min-width: 0;

  padding: 0 12px 0 0;

  border: 0;

  background: transparent;
  color: #101828;

  font: inherit;
  font-size: 9px;

  outline: none;
}

.input-wrapper input::placeholder {
  color: #98a2b3;
}

.input-wrapper input:disabled {
  color: #667085;

  cursor: not-allowed;
}

.password-toggle {
  width: 39px;
  height: 41px;

  flex: 0 0 39px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 0;

  background: transparent;
  color: #98a2b3;

  cursor: pointer;
}

.password-toggle:hover:not(:disabled) {
  color: #475467;
}

.password-toggle:disabled {
  cursor: not-allowed;
}

/* PASSWORD STRENGTH */

.password-strength {
  margin-top: 1px;
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
}

.strength-bars span {
  height: 3px;

  border-radius: 999px;

  background: #e5e7eb;
}

.strength-bars span.active.weak {
  background: #ef4444;
}

.strength-bars span.active.medium {
  background: #f59e0b;
}

.strength-bars span.active.good {
  background: #3b82f6;
}

.strength-bars span.active.strong {
  background: #22c55e;
}

.strength-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 4px;

  color: #98a2b3;

  font-size: 6px;
}

.strength-meta strong {
  color: #667085;

  font-weight: 600;
}

.password-help {
  margin: 0;

  color: #98a2b3;

  font-size: 6px;
  line-height: 1.45;
}

/* BUTTON */

.register-button,
.login-after-register {
  min-height: 43px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  margin-top: 3px;

  border: 0;
  border-radius: 9px;

  background: #2563eb;
  color: #ffffff;

  font: inherit;
  font-size: 9px;
  font-weight: 600;

  text-decoration: none;

  cursor: pointer;

  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.18);

  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.register-button:hover:not(:disabled),
.login-after-register:hover {
  background: #1d4ed8;

  transform: translateY(-1px);

  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
}

.register-button:disabled {
  opacity: 0.6;

  cursor: not-allowed;

  transform: none;
}

.button-spinner {
  width: 11px;
  height: 11px;

  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

/* ALERTS */

.error-alert,
.success-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  margin-bottom: 17px;
  padding: 9px 10px;

  border-radius: 8px;
}

.error-alert {
  border: 1px solid #fecaca;

  background: #fff5f5;
  color: #b42318;
}

.success-alert {
  border: 1px solid #bbf7d0;

  background: #f0fdf4;
  color: #15803d;
}

.error-icon,
.success-icon {
  width: 19px;
  height: 19px;

  flex: 0 0 19px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-size: 7px;
  font-weight: 700;
}

.error-icon {
  background: #fee2e2;
}

.success-icon {
  background: #dcfce7;
}

.error-alert > div:last-child,
.success-alert > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-alert strong,
.success-alert strong {
  font-size: 8px;
}

.error-alert span,
.success-alert span {
  font-size: 7px;
  line-height: 1.45;
}

/* LOGIN LINK */

.login-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  margin-top: 20px;

  color: #98a2b3;

  font-size: 8px;
}

.login-section a {
  color: #2563eb;

  font-weight: 600;

  text-decoration: none;
}

.login-section a:hover {
  text-decoration: underline;
}

.auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  color: #98a2b3;

  font-size: 6px;
}

/* RIGHT */

.showcase-section {
  position: relative;

  min-height: 100vh;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  box-sizing: border-box;

  padding: 60px 64px 28px;

  background:
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.16), transparent 28%),
    radial-gradient(circle at 20% 90%, rgba(99, 102, 241, 0.11), transparent 28%), #0b1120;

  color: #ffffff;
}

.showcase-glow {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;
}

.glow-one {
  top: -200px;
  right: -180px;

  width: 480px;
  height: 480px;

  border: 1px solid rgba(96, 165, 250, 0.1);
}

.glow-two {
  bottom: -250px;
  left: -180px;

  width: 520px;
  height: 520px;

  border: 1px solid rgba(129, 140, 248, 0.08);
}

.showcase-content {
  position: relative;
  z-index: 1;

  width: min(580px, 100%);

  margin: auto;
}

.showcase-badge {
  width: fit-content;

  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 15px;
  padding: 5px 8px;

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;

  font-size: 7px;

  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #22c55e;
}

.showcase-content > h2 {
  max-width: 510px;

  margin: 0;

  color: white;

  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.02;
  letter-spacing: -0.055em;
}

.showcase-content > h2 span {
  display: block;

  color: #93c5fd;
}

.showcase-description {
  max-width: 500px;

  margin: 14px 0 24px;

  color: #94a3b8;

  font-size: 10px;
  line-height: 1.7;
}

/* ONBOARDING CARD */

.onboarding-card {
  padding: 16px;

  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 12px;

  background: rgba(255, 255, 255, 0.055);

  box-shadow: 0 24px 55px rgba(0, 0, 0, 0.2);

  backdrop-filter: blur(12px);
}

.onboarding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.onboarding-header > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.small-label {
  color: #64748b;

  font-size: 5px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.onboarding-header strong {
  color: #f8fafc;

  font-size: 9px;
}

.progress-label {
  color: #93c5fd;

  font-size: 7px;
  font-weight: 600;
}

.progress-bar {
  height: 3px;

  overflow: hidden;

  margin: 10px 0 13px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.08);
}

.progress-bar span {
  width: 7%;
  height: 100%;

  display: block;

  border-radius: inherit;

  background: #3b82f6;
}

.steps {
  display: flex;
  flex-direction: column;
}

.step {
  position: relative;

  min-height: 52px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 7px 8px;

  border-radius: 8px;
}

.step.active {
  border: 1px solid rgba(96, 165, 250, 0.12);

  background: rgba(59, 130, 246, 0.07);
}

.step-number {
  width: 24px;
  height: 24px;

  flex: 0 0 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;

  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;

  font-size: 7px;
  font-weight: 600;
}

.step.active .step-number {
  border-color: rgba(59, 130, 246, 0.25);

  background: #2563eb;
  color: white;
}

.step-content {
  min-width: 0;

  flex: 1;
}

.step-content strong {
  display: block;

  color: #e2e8f0;

  font-size: 7px;
}

.step-content p {
  margin: 2px 0 0;

  color: #64748b;

  font-size: 6px;
}

.step-status {
  padding: 3px 5px;

  border-radius: 999px;

  background: rgba(59, 130, 246, 0.1);
  color: #93c5fd;

  font-size: 5px;
  font-weight: 600;
}

/* FEATURES */

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  margin-top: 14px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 7px;

  padding: 9px;

  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;

  background: rgba(255, 255, 255, 0.03);
}

.feature-icon {
  width: 27px;
  height: 27px;

  flex: 0 0 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: rgba(59, 130, 246, 0.08);
  color: #93c5fd;
}

.feature > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature strong {
  color: #e2e8f0;

  font-size: 7px;
}

.feature span {
  color: #64748b;

  font-size: 5px;
}

.showcase-footer {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;

  margin-top: 25px;

  color: #64748b;

  font-size: 6px;
}

.status-dot {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: #22c55e;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 1050px) {
  .auth-page {
    grid-template-columns:
      minmax(400px, 0.9fr)
      minmax(460px, 1.1fr);
  }

  .showcase-section {
    padding: 50px 40px 25px;
  }
}

@media (max-width: 900px) {
  .auth-page {
    display: block;
  }

  .auth-section {
    min-height: 100vh;

    padding: 28px 30px;
  }

  .auth-container {
    width: min(410px, 100%);
  }

  .showcase-section {
    display: none;
  }
}

@media (max-width: 520px) {
  .auth-section {
    padding: 22px 20px max(20px, env(safe-area-inset-bottom));
  }

  .auth-content {
    padding: 45px 0;
  }

  .auth-heading h1 {
    font-size: 25px;
  }

  .auth-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
/* =========================
   REGISTER TYPOGRAPHY FIX
========================= */

/* BRAND */

.brand {
  font-size: 15px;
}

.brand-mark {
  font-size: 12px;
}

/* HEADING */

.eyebrow {
  font-size: 12px;
}

.auth-heading h1 {
  font-size: 32px;
}

.auth-heading p {
  max-width: 370px;
  font-size: 14px;
  line-height: 1.65;
}

/* FORM */

.form-group label {
  font-size: 13px;
}

.input-wrapper {
  min-height: 46px;
}

.input-wrapper input {
  font-size: 14px;
}

.password-toggle {
  height: 44px;
}

/* PASSWORD STRENGTH */

.strength-bars span {
  height: 4px;
}

.strength-meta {
  margin-top: 6px;
  font-size: 12px;
}

.strength-meta strong {
  font-size: 12px;
}

.password-help {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.5;
}

/* REGISTER BUTTON */

.register-button,
.login-after-register {
  min-height: 46px;
  font-size: 14px;
}

.button-spinner {
  width: 14px;
  height: 14px;
}

/* ALERTS */

.error-icon,
.success-icon {
  font-size: 11px;
}

.error-alert strong,
.success-alert strong {
  font-size: 13px;
}

.error-alert span,
.success-alert span {
  font-size: 12px;
  line-height: 1.5;
}

/* LOGIN LINK */

.login-section {
  font-size: 13px;
}

/* FOOTER */

.auth-footer {
  font-size: 11px;
}

/* =========================
   RIGHT SHOWCASE
========================= */

.showcase-badge {
  font-size: 12px;
}

.showcase-description {
  font-size: 14px;
  line-height: 1.65;
}

/* ONBOARDING */

.small-label {
  font-size: 10px;
}

.onboarding-header strong {
  font-size: 14px;
}

.progress-label {
  font-size: 11px;
}

.step-number {
  font-size: 11px;
}

.step-content strong {
  font-size: 12px;
}

.step-content p {
  font-size: 11px;
  line-height: 1.45;
}

.step-status {
  font-size: 10px;
}

/* FEATURE CARDS */

.feature strong {
  font-size: 12px;
}

.feature span {
  font-size: 10px;
  line-height: 1.4;
}

.showcase-footer {
  font-size: 11px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 520px) {
  .auth-heading h1 {
    font-size: 29px;
  }

  .auth-heading p {
    font-size: 14px;
  }

  .eyebrow {
    font-size: 11px;
  }

  .form-group label {
    font-size: 13px;
  }

  /*
    16px evita además el zoom automático
    de Safari/iPhone al enfocar inputs.
  */
  .input-wrapper input {
    font-size: 16px;
  }

  .register-button,
  .login-after-register {
    font-size: 14px;
  }

  .strength-meta,
  .strength-meta strong,
  .password-help {
    font-size: 12px;
  }

  .login-section {
    font-size: 13px;
  }

  .auth-footer {
    font-size: 11px;
  }
}
</style>
