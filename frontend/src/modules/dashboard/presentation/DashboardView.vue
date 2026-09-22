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
    error.value = err.message || "No se ha podido cerrar la sesión.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="dashboard-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <RouterLink to="/dashboard" class="brand">
          <div class="brand-mark">AI</div>

          <div class="brand-text">
            <strong>AgentFlow</strong>
            <span>Business AI</span>
          </div>
        </RouterLink>

        <nav class="sidebar-nav">
          <span class="nav-section-title"> Workspace </span>

          <RouterLink
            to="/dashboard"
            class="nav-item"
            active-class="nav-item-active"
            exact-active-class="nav-item-active">
            <span class="nav-icon">⌂</span>
            <span>Resumen</span>
          </RouterLink>

          <RouterLink to="/businesses" class="nav-item" active-class="nav-item-active">
            <span class="nav-icon">▦</span>
            <span>Negocios</span>
          </RouterLink>

          <span class="nav-section-title nav-section-spaced"> Gestión </span>

          <button class="nav-item nav-item-disabled" type="button">
            <span class="nav-icon">◌</span>
            <span>Conversaciones</span>
            <small>Próximamente</small>
          </button>

          <button class="nav-item nav-item-disabled" type="button">
            <span class="nav-icon">♧</span>
            <span>Leads</span>
            <small>Próximamente</small>
          </button>

          <button class="nav-item nav-item-disabled" type="button">
            <span class="nav-icon">◷</span>
            <span>Reservas</span>
            <small>Próximamente</small>
          </button>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="sidebar-status">
          <span class="status-dot"></span>

          <div>
            <strong>Sistema operativo</strong>
            <span>Todos los servicios activos</span>
          </div>
        </div>

        <button type="button" class="logout-button" :disabled="loading" @click="handleLogout">
          <span>↪</span>
          {{ loading ? "Cerrando sesión..." : "Cerrar sesión" }}
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="dashboard-main">
      <header class="dashboard-header">
        <div>
          <p class="dashboard-eyebrow">Workspace</p>

          <h1>Resumen</h1>

          <p class="dashboard-subtitle">Gestiona tus negocios y agentes de IA desde un único lugar.</p>
        </div>

        <RouterLink to="/businesses/create" class="dashboard-create-button">
          <span>+</span>
          Crear negocio
        </RouterLink>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon stat-icon-blue">▦</div>

          <div>
            <span>Negocios</span>
            <strong>—</strong>
          </div>

          <small> Configura tu primer negocio </small>
        </article>

        <article class="stat-card">
          <div class="stat-icon stat-icon-green">◌</div>

          <div>
            <span>Conversaciones</span>
            <strong>—</strong>
          </div>

          <small> Actividad de tus agentes </small>
        </article>

        <article class="stat-card">
          <div class="stat-icon stat-icon-orange">♧</div>

          <div>
            <span>Leads</span>
            <strong>—</strong>
          </div>

          <small> Clientes captados por IA </small>
        </article>

        <article class="stat-card">
          <div class="stat-icon stat-icon-purple">✦</div>

          <div>
            <span>Automatizaciones</span>
            <strong>—</strong>
          </div>

          <small> Acciones ejecutadas </small>
        </article>
      </section>

      <section class="welcome-grid">
        <article class="welcome-card">
          <div class="welcome-content">
            <span class="welcome-badge"> AI Business Agent </span>

            <h2>
              Tu negocio,
              <br />
              siempre atendido.
            </h2>

            <p>
              Crea un agente de IA capaz de responder a tus clientes, captar leads y derivar conversaciones a
              una persona cuando sea necesario.
            </p>

            <RouterLink to="/businesses/create" class="welcome-button">
              Crear mi primer negocio
              <span>→</span>
            </RouterLink>
          </div>

          <div class="welcome-visual">
            <div class="ai-orb">
              <div class="ai-orb-inner">✦</div>
            </div>

            <div class="floating-card floating-card-top">
              <span class="floating-dot green"></span>
              Agente activo
            </div>

            <div class="floating-card floating-card-bottom">
              <span>✦</span>
              IA trabajando
            </div>
          </div>
        </article>
      </section>

      <section class="quick-section">
        <div class="section-header">
          <div>
            <h2>Acciones rápidas</h2>
            <p>Accede rápidamente a las funciones principales.</p>
          </div>
        </div>

        <div class="quick-grid">
          <RouterLink to="/businesses" class="quick-card">
            <div class="quick-card-icon">▦</div>

            <div>
              <strong>Mis negocios</strong>
              <span> Consulta y gestiona tus negocios. </span>
            </div>

            <span class="quick-arrow">→</span>
          </RouterLink>

          <RouterLink to="/businesses/create" class="quick-card">
            <div class="quick-card-icon">+</div>

            <div>
              <strong>Nuevo negocio</strong>
              <span> Configura un nuevo agente de IA. </span>
            </div>

            <span class="quick-arrow">→</span>
          </RouterLink>
        </div>
      </section>

      <p v-if="error" class="dashboard-error">
        {{ error }}
      </p>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  background: var(--bg);
}

/* =========================
   SIDEBAR
========================= */

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;

  width: 248px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 20px 14px;

  background: #ffffff;
  border-right: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 8px 10px 22px;

  text-decoration: none;
  color: var(--text);
}

.brand-mark {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: var(--primary);
  color: white;

  font-size: 11px;
  font-weight: 800;

  box-shadow: 0 5px 12px rgba(37, 99, 235, 0.2);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-text strong {
  font-size: 14px;
  letter-spacing: -0.01em;
}

.brand-text span {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 500;
}

/* =========================
   NAV
========================= */

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-section-title {
  padding: 10px 11px 7px;

  color: var(--text-muted);

  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-section-spaced {
  margin-top: 16px;
}

.nav-item {
  width: 100%;
  min-height: 40px;

  display: flex;
  align-items: center;
  gap: 11px;

  padding: 0 11px;

  border-radius: 8px;

  background: transparent;
  color: #667085;

  font-size: 13px;
  font-weight: 500;

  text-decoration: none;
  text-align: left;

  cursor: pointer;

  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover {
  background: #f8fafc;
  color: var(--text);
}

.nav-item-active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.nav-icon {
  width: 20px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 16px;
}

.nav-item-disabled {
  position: relative;
  cursor: default;
  opacity: 0.65;
}

.nav-item-disabled:hover {
  background: transparent;
  color: #667085;
}

.nav-item-disabled small {
  margin-left: auto;

  color: var(--text-muted);

  font-size: 9px;
  font-weight: 500;
}

/* =========================
   SIDEBAR BOTTOM
========================= */

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-status {
  display: flex;
  align-items: flex-start;
  gap: 9px;

  padding: 11px;

  border: 1px solid var(--border);
  border-radius: 10px;

  background: var(--surface-soft);
}

.status-dot {
  width: 7px;
  height: 7px;

  margin-top: 4px;

  flex: 0 0 auto;

  border-radius: 50%;
  background: #22c55e;

  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.sidebar-status div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-status strong {
  color: var(--text);
  font-size: 10px;
}

.sidebar-status span:not(.status-dot) {
  color: var(--text-muted);
  font-size: 9px;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 9px;

  min-height: 38px;
  padding: 0 11px;

  border-radius: 8px;

  background: transparent;
  color: #667085;

  font-size: 12px;
  font-weight: 500;

  cursor: pointer;
}

.logout-button:hover:not(:disabled) {
  background: var(--danger-soft);
  color: var(--danger);
}

.logout-button:disabled {
  opacity: 0.5;
}

/* =========================
   MAIN
========================= */

.dashboard-main {
  width: calc(100% - 248px);
  min-height: 100vh;

  margin-left: 248px;

  padding: 42px 48px 70px;
}

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;

  max-width: 1180px;
  margin: 0 auto 32px;
}

.dashboard-eyebrow {
  margin-bottom: 7px;

  color: var(--primary);

  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-header h1 {
  color: var(--text);

  font-size: 32px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.dashboard-subtitle {
  margin-top: 8px;

  color: var(--text-secondary);

  font-size: 14px;
}

.dashboard-create-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  min-height: 40px;
  padding: 0 15px;

  border-radius: 8px;

  background: var(--primary);
  color: white;

  font-size: 13px;
  font-weight: 600;

  text-decoration: none;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);

  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.dashboard-create-button:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.dashboard-create-button span {
  font-size: 18px;
  line-height: 1;
}

/* =========================
   STATS
========================= */

.stats-grid {
  width: min(1180px, 100%);
  margin: 0 auto 24px;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  position: relative;

  min-height: 142px;
  padding: 18px;

  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;

  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 16px;

  border-radius: 9px;

  font-size: 15px;
  font-weight: 700;
}

.stat-icon-blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon-green {
  background: #ecfdf3;
  color: #16a34a;
}

.stat-icon-orange {
  background: #fffaeb;
  color: #d97706;
}

.stat-icon-purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.stat-card > div:nth-child(2) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.stat-card span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.stat-card strong {
  color: var(--text);
  font-size: 22px;
  font-weight: 700;
}

.stat-card small {
  position: absolute;
  left: 18px;
  bottom: 16px;

  color: var(--text-muted);

  font-size: 10px;
}

/* =========================
   WELCOME
========================= */

.welcome-grid {
  width: min(1180px, 100%);
  margin: 0 auto 30px;
}

.welcome-card {
  position: relative;

  min-height: 300px;

  display: flex;
  overflow: hidden;

  border-radius: 18px;

  background:
    radial-gradient(circle at 78% 35%, rgba(96, 165, 250, 0.2), transparent 28%),
    linear-gradient(135deg, #0f172a 0%, #172554 100%);

  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
}

.welcome-content {
  position: relative;
  z-index: 2;

  width: 58%;

  padding: 42px;
}

.welcome-badge {
  display: inline-flex;

  margin-bottom: 18px;
  padding: 5px 9px;

  border: 1px solid rgba(147, 197, 253, 0.25);
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.06);
  color: #bfdbfe;

  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.welcome-content h2 {
  color: white;

  font-size: 34px;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.welcome-content p {
  max-width: 540px;

  margin-top: 14px;

  color: #cbd5e1;

  font-size: 13px;
  line-height: 1.65;
}

.welcome-button {
  display: inline-flex;
  align-items: center;
  gap: 9px;

  margin-top: 24px;
  padding: 10px 14px;

  border-radius: 8px;

  background: white;
  color: #0f172a;

  font-size: 12px;
  font-weight: 600;

  text-decoration: none;

  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.welcome-button:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.welcome-button span {
  font-size: 16px;
}

.welcome-visual {
  position: absolute;
  inset: 0 0 0 auto;

  width: 42%;
}

.ai-orb {
  position: absolute;
  top: 50%;
  left: 50%;

  width: 145px;
  height: 145px;

  display: flex;
  align-items: center;
  justify-content: center;

  transform: translate(-50%, -50%);

  border-radius: 50%;

  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.95),
    rgba(96, 165, 250, 0.8) 18%,
    rgba(37, 99, 235, 0.2) 50%,
    transparent 72%
  );

  box-shadow: 0 0 80px rgba(59, 130, 246, 0.45);
}

.ai-orb-inner {
  width: 62px;
  height: 62px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);

  color: white;

  font-size: 25px;
}

.floating-card {
  position: absolute;

  display: flex;
  align-items: center;
  gap: 7px;

  padding: 9px 12px;

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9px;

  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);

  color: #e2e8f0;

  font-size: 10px;
  font-weight: 600;
}

.floating-card-top {
  top: 58px;
  right: 28px;
}

.floating-card-bottom {
  right: 58px;
  bottom: 54px;
}

.floating-card-bottom span {
  color: #93c5fd;
}

.floating-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.floating-dot.green {
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
}

/* =========================
   QUICK ACTIONS
========================= */

.quick-section {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.section-header {
  margin-bottom: 14px;
}

.section-header h2 {
  color: var(--text);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.section-header p {
  margin-top: 4px;

  color: var(--text-secondary);
  font-size: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 13px;

  padding: 17px;

  border: 1px solid var(--border);
  border-radius: 13px;

  background: var(--surface);

  text-decoration: none;

  box-shadow: var(--shadow-sm);

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.quick-card:hover {
  border-color: #cbd5e1;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.quick-card-icon {
  width: 36px;
  height: 36px;

  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 17px;
  font-weight: 700;
}

.quick-card > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 3px;

  min-width: 0;
}

.quick-card strong {
  color: var(--text);
  font-size: 12px;
}

.quick-card span:not(.quick-arrow) {
  color: var(--text-secondary);
  font-size: 11px;
}

.quick-arrow {
  margin-left: auto;

  color: var(--text-muted);

  font-size: 17px;

  transition: transform 0.15s ease;
}

.quick-card:hover .quick-arrow {
  transform: translateX(3px);
  color: var(--primary);
}

.dashboard-error {
  width: min(1180px, 100%);
  margin: 18px auto 0;

  padding: 12px 14px;

  border: 1px solid #fecaca;
  border-radius: 9px;

  background: var(--danger-soft);
  color: var(--danger);

  font-size: 12px;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1000px) {
  .sidebar {
    width: 220px;
  }

  .dashboard-main {
    width: calc(100% - 220px);
    margin-left: 220px;
    padding: 32px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .dashboard-layout {
    display: block;
  }

  .sidebar {
    position: relative;
    inset: auto;

    width: 100%;
    min-height: auto;

    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-bottom {
    display: none;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-section-title,
  .nav-section-spaced,
  .nav-item-disabled {
    display: none;
  }

  .nav-item {
    width: auto;
    flex: 0 0 auto;
  }

  .dashboard-main {
    width: 100%;
    margin-left: 0;
    padding: 28px 20px 50px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-create-button {
    width: 100%;
  }

  .welcome-content {
    width: 100%;
    padding: 30px;
  }

  .welcome-content h2 {
    font-size: 29px;
  }

  .welcome-visual {
    display: none;
  }
}

@media (max-width: 520px) {
  .stats-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header h1 {
    font-size: 28px;
  }

  .welcome-card {
    min-height: auto;
  }

  .welcome-content {
    padding: 26px;
  }
}
</style>
