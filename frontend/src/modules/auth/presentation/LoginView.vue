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
const showPassword = ref(false);

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
    error.value = err.message || "No se ha podido iniciar sesión.";
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

          <span>Resbix</span>
        </RouterLink>

        <!-- FORM AREA -->

        <div class="auth-content">
          <div class="auth-heading">
            <span class="eyebrow"> Bienvenido de nuevo </span>

            <h1>Inicia sesión en tu cuenta</h1>

            <p>Gestiona tus agentes, conversaciones, leads y negocios desde un único lugar.</p>
          </div>

          <!-- ERROR -->

          <div v-if="error" class="error-alert">
            <div class="error-icon">!</div>

            <div>
              <strong>No se ha podido iniciar sesión</strong>

              <span>{{ error }}</span>
            </div>
          </div>

          <!-- FORM -->

          <form class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="email"> Email </label>

              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                  :disabled="loading"
                  required />
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="password"> Contraseña </label>
                <div class="forgot-password">
                  <RouterLink to="/forgot-password"> ¿Has olvidado tu contraseña? </RouterLink>
                </div>
              </div>

              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                  autocomplete="current-password"
                  placeholder="Introduce tu contraseña"
                  :disabled="loading"
                  required />

                <button
                  type="button"
                  class="password-toggle"
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
            </div>

            <button type="submit" class="login-button" :disabled="loading">
              <span v-if="loading" class="button-spinner"></span>

              <span>
                {{ loading ? "Iniciando sesión..." : "Iniciar sesión" }}
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
          </form>

          <!-- REGISTER -->

          <div class="register-section">
            <span> ¿Todavía no tienes una cuenta? </span>

            <RouterLink to="/register"> Crear cuenta </RouterLink>
          </div>
        </div>

        <!-- FOOTER -->

        <footer class="auth-footer">
          <span>© {{ new Date().getFullYear() }} Resbix</span>

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

          Tu negocio, siempre disponible
        </div>

        <h2>
          Convierte conversaciones
          <span>en oportunidades.</span>
        </h2>

        <p class="showcase-description">
          Un agente inteligente que atiende clientes, responde preguntas y captura oportunidades mientras tú
          te centras en tu negocio.
        </p>

        <!-- MOCK DASHBOARD -->

        <div class="dashboard-preview">
          <div class="preview-sidebar">
            <div class="preview-logo">✦</div>

            <div class="preview-nav active">
              <span></span>
              <i></i>
            </div>

            <div class="preview-nav">
              <span></span>
              <i></i>
            </div>

            <div class="preview-nav">
              <span></span>
              <i></i>
            </div>

            <div class="preview-nav">
              <span></span>
              <i></i>
            </div>
          </div>

          <div class="preview-content">
            <div class="preview-top">
              <div>
                <span class="preview-small-line"></span>
                <span class="preview-title-line"></span>
              </div>

              <div class="preview-avatar"></div>
            </div>

            <div class="preview-stats">
              <div class="preview-stat">
                <div class="preview-stat-icon blue">↗</div>

                <div>
                  <span>Conversaciones</span>
                  <strong>128</strong>
                </div>
              </div>

              <div class="preview-stat">
                <div class="preview-stat-icon purple">✦</div>

                <div>
                  <span>Leads</span>
                  <strong>34</strong>
                </div>
              </div>

              <div class="preview-stat">
                <div class="preview-stat-icon green">✓</div>

                <div>
                  <span>Conversión</span>
                  <strong>26%</strong>
                </div>
              </div>
            </div>

            <div class="preview-main">
              <div class="preview-chart">
                <div class="preview-chart-header">
                  <div>
                    <span></span>
                    <strong></strong>
                  </div>

                  <i></i>
                </div>

                <div class="chart-bars">
                  <span style="height: 30%"></span>
                  <span style="height: 46%"></span>
                  <span style="height: 38%"></span>
                  <span style="height: 68%"></span>
                  <span style="height: 55%"></span>
                  <span style="height: 80%"></span>
                  <span style="height: 72%"></span>
                  <span style="height: 94%"></span>
                </div>
              </div>

              <div class="preview-activity">
                <span class="activity-heading"></span>

                <div v-for="item in 4" :key="item" class="activity-item">
                  <i></i>

                  <div>
                    <span></span>
                    <small></small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FEATURES -->

        <div class="showcase-features">
          <div>
            <span>✓</span>
            <p>Atención automática 24/7</p>
          </div>

          <div>
            <span>✓</span>
            <p>Captura de leads</p>
          </div>

          <div>
            <span>✓</span>
            <p>Control humano cuando lo necesites</p>
          </div>
        </div>
      </div>

      <div class="showcase-footer">
        <span class="footer-status"></span>

        <span>Resbix</span>

        <span>·</span>

        <span>Powered by Resbix</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  width: 100%;
  min-height: 100vh;

  display: grid;
  grid-template-columns: minmax(440px, 0.9fr) minmax(520px, 1.1fr);

  background: #ffffff;
}

/* =========================
   LEFT
========================= */

.auth-section {
  min-height: 100vh;

  display: flex;
  justify-content: center;

  padding: 32px 48px;

  box-sizing: border-box;

  background: #ffffff;
}

.auth-container {
  width: min(390px, 100%);

  display: flex;
  flex-direction: column;
}

/* BRAND */

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

/* CONTENT */

.auth-content {
  width: 100%;

  margin: auto 0;

  padding: 70px 0;
}

.auth-heading {
  margin-bottom: 26px;
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
  max-width: 350px;

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

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.password-toggle:hover {
  color: #475467;
}

/* LOGIN BUTTON */

.login-button {
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

  cursor: pointer;

  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.18);

  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.login-button:hover:not(:disabled) {
  background: #1d4ed8;

  transform: translateY(-1px);

  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
}

.login-button:disabled {
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

/* ERROR */

.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  margin-bottom: 17px;
  padding: 9px 10px;

  border: 1px solid #fecaca;
  border-radius: 8px;

  background: #fff5f5;
  color: #b42318;
}

.error-icon {
  width: 19px;
  height: 19px;

  flex: 0 0 19px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #fee2e2;

  font-size: 7px;
  font-weight: 700;
}

.error-alert > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-alert strong {
  font-size: 8px;
}

.error-alert span {
  font-size: 7px;
  line-height: 1.45;
}

/* REGISTER */

.register-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  margin-top: 20px;

  color: #98a2b3;

  font-size: 8px;
}

.register-section a {
  color: #2563eb;

  font-weight: 600;

  text-decoration: none;
}

.register-section a:hover {
  text-decoration: underline;
}

/* FOOTER */

.auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  color: #98a2b3;

  font-size: 6px;
}

/* =========================
   SHOWCASE
========================= */

.showcase-section {
  position: relative;

  min-height: 100vh;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  padding: 60px 64px 28px;

  box-sizing: border-box;

  background:
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.16), transparent 28%),
    radial-gradient(circle at 20% 90%, rgba(99, 102, 241, 0.11), transparent 28%), #0b1120;

  color: white;
}

.showcase-glow {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(1px);
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

  width: min(600px, 100%);

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
  font-weight: 500;

  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.showcase-content > h2 {
  max-width: 520px;

  margin: 0;

  color: #ffffff;

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

  margin: 14px 0 25px;

  color: #94a3b8;

  font-size: 10px;
  line-height: 1.7;
}

/* =========================
   FAKE DASHBOARD
========================= */

.dashboard-preview {
  width: 100%;
  height: 270px;

  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);

  overflow: hidden;

  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;

  background: #ffffff;

  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);

  transform: perspective(1200px) rotateX(1deg);
}

.preview-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  padding: 12px 7px;

  background: #0f172a;
}

.preview-logo {
  width: 23px;
  height: 23px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 9px;

  border-radius: 6px;

  background: #2563eb;
  color: white;

  font-size: 7px;
}

.preview-nav {
  width: 31px;
  height: 25px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;

  border-radius: 5px;
}

.preview-nav.active {
  background: rgba(255, 255, 255, 0.08);
}

.preview-nav span {
  width: 5px;
  height: 5px;

  border-radius: 2px;

  background: #64748b;
}

.preview-nav i {
  width: 13px;
  height: 3px;

  border-radius: 999px;

  background: #475569;
}

.preview-nav.active span,
.preview-nav.active i {
  background: #93c5fd;
}

.preview-content {
  min-width: 0;

  padding: 14px;

  background: #f8fafc;
}

.preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 13px;
}

.preview-top > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-small-line {
  width: 32px;
  height: 3px;

  border-radius: 999px;

  background: #93c5fd;
}

.preview-title-line {
  width: 85px;
  height: 7px;

  border-radius: 3px;

  background: #1e293b;
}

.preview-avatar {
  width: 18px;
  height: 18px;

  border-radius: 5px;

  background: #e2e8f0;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;

  margin-bottom: 9px;
}

.preview-stat {
  display: flex;
  align-items: center;
  gap: 6px;

  padding: 8px;

  border: 1px solid #e2e8f0;
  border-radius: 6px;

  background: white;
}

.preview-stat-icon {
  width: 19px;
  height: 19px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 5px;

  font-size: 6px;
  font-weight: 700;
}

.preview-stat-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.preview-stat-icon.purple {
  background: #eef2ff;
  color: #4f46e5;
}

.preview-stat-icon.green {
  background: #ecfdf3;
  color: #16a34a;
}

.preview-stat > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.preview-stat span {
  color: #94a3b8;

  font-size: 4px;
}

.preview-stat strong {
  color: #0f172a;

  font-size: 8px;
}

.preview-main {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr;
  gap: 8px;

  height: 145px;
}

.preview-chart,
.preview-activity {
  border: 1px solid #e2e8f0;
  border-radius: 7px;

  background: white;
}

.preview-chart {
  display: flex;
  flex-direction: column;

  padding: 9px;
}

.preview-chart-header {
  display: flex;
  justify-content: space-between;
}

.preview-chart-header > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preview-chart-header span {
  width: 28px;
  height: 3px;

  border-radius: 999px;

  background: #cbd5e1;
}

.preview-chart-header strong {
  width: 48px;
  height: 5px;

  border-radius: 999px;

  background: #64748b;
}

.preview-chart-header i {
  width: 17px;
  height: 8px;

  border-radius: 3px;

  background: #f1f5f9;
}

.chart-bars {
  flex: 1;

  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 5px;

  padding-top: 13px;
}

.chart-bars span {
  flex: 1;

  min-height: 10px;

  border-radius: 2px 2px 0 0;

  background: linear-gradient(180deg, #60a5fa, #2563eb);

  opacity: 0.85;
}

.preview-activity {
  padding: 9px;
}

.activity-heading {
  width: 45px;
  height: 5px;

  display: block;

  margin-bottom: 11px;

  border-radius: 999px;

  background: #64748b;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 5px;

  margin-bottom: 9px;
}

.activity-item > i {
  width: 14px;
  height: 14px;

  flex: 0 0 14px;

  border-radius: 4px;

  background: #eff6ff;
}

.activity-item > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.activity-item span {
  width: 45px;
  height: 3px;

  border-radius: 999px;

  background: #cbd5e1;
}

.activity-item small {
  width: 30px;
  height: 2px;

  border-radius: 999px;

  background: #e2e8f0;
}

/* FEATURES */

.showcase-features {
  display: flex;
  align-items: center;
  gap: 17px;

  margin-top: 19px;
}

.showcase-features > div {
  display: flex;
  align-items: center;
  gap: 5px;
}

.showcase-features span {
  width: 15px;
  height: 15px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;

  font-size: 6px;
}

.showcase-features p {
  margin: 0;

  color: #94a3b8;

  font-size: 6px;
}

.showcase-footer {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;

  margin-top: 30px;

  color: #64748b;

  font-size: 6px;
}

.footer-status {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: #22c55e;
}

/* =========================
   ANIMATIONS
========================= */

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1050px) {
  .auth-page {
    grid-template-columns: minmax(400px, 0.9fr) minmax(460px, 1.1fr);
  }

  .showcase-section {
    padding: 55px 40px 25px;
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
    padding: 55px 0;
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
   LOGIN TYPOGRAPHY FIX
========================= */

/* Brand */

.brand {
  font-size: 15px;
}

.brand-mark {
  font-size: 12px;
}

/* Heading */

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

/* Form */

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

/* Login button */

.login-button {
  min-height: 46px;
  font-size: 14px;
}

.button-spinner {
  width: 14px;
  height: 14px;
}

/* Error */

.error-icon {
  font-size: 11px;
}

.error-alert strong {
  font-size: 13px;
}

.error-alert span {
  font-size: 12px;
}

/* Register */

.register-section {
  font-size: 13px;
}

/* Footer */

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

/*
  El dashboard-preview es una representación
  miniatura de la aplicación, así que NO escalamos
  todos sus textos.
*/

.showcase-features span {
  font-size: 9px;
}

.showcase-features p {
  font-size: 12px;
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

  .input-wrapper input {
    font-size: 16px;
  }

  .login-button {
    font-size: 14px;
  }

  .register-section {
    font-size: 13px;
  }

  .auth-footer {
    font-size: 11px;
  }
}
.forgot-password {
  margin-top: 8px;
  text-align: right;
}

.forgot-password a {
  color: #6366f1;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.forgot-password a:hover {
  text-decoration: underline;
}
</style>
