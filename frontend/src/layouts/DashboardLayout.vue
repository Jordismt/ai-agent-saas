<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { SupabaseAuthService } from "../modules/auth/infrastructure/SupabaseAuthService.js";

const route = useRoute();
const router = useRouter();

const authService = new SupabaseAuthService();

const activeBusinessId = computed(() => {
  return route.params.id || null;
});

const hasActiveBusiness = computed(() => {
  return Boolean(activeBusinessId.value);
});

const businessRoute = (section) => {
  if (!activeBusinessId.value) {
    return "/businesses";
  }

  return `/businesses/${activeBusinessId.value}/${section}`;
};

const logoutLoading = ref(false);
const logoutError = ref("");
const mobileMenuOpen = ref(false);

const handleLogout = async () => {
  logoutError.value = "";
  logoutLoading.value = true;

  try {
    await authService.logout();
    await router.push("/login");
  } catch (err) {
    logoutError.value = err.message || "No se ha podido cerrar la sesión.";
  } finally {
    logoutLoading.value = false;
  }
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ 'sidebar-open': mobileMenuOpen }">
      <div class="sidebar-top">
        <div class="sidebar-mobile-header">
          <RouterLink to="/dashboard" class="brand" @click="closeMobileMenu">
            <div class="brand-mark">R</div>

            <div class="brand-text">
              <strong>Resbix</strong>
              <span>Business AI</span>
            </div>
          </RouterLink>

          <button type="button" class="mobile-close" aria-label="Cerrar menú" @click="mobileMenuOpen = false">
            ×
          </button>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-section-title">Workspace</span>

          <RouterLink
            to="/dashboard"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">⌂</span>
            <span>Resumen</span>
          </RouterLink>

          <RouterLink
            to="/businesses"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">▦</span>
            <span>Negocios</span>
          </RouterLink>

          <span class="nav-section-title nav-section-spaced"> Gestión </span>

          <RouterLink
            v-if="hasActiveBusiness"
            :to="businessRoute('conversations')"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">◌</span>
            <span>Conversaciones</span>
          </RouterLink>

          <div
            v-else
            class="nav-item nav-item-disabled"
            title="Selecciona un negocio para ver sus conversaciones">
            <span class="nav-icon">◌</span>
            <span>Conversaciones</span>
            <small>Selecciona negocio</small>
          </div>

          <RouterLink
            v-if="hasActiveBusiness"
            :to="businessRoute('leads')"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">♧</span>
            <span>Leads</span>
          </RouterLink>

          <div v-else class="nav-item nav-item-disabled" title="Selecciona un negocio para ver sus leads">
            <span class="nav-icon">♧</span>
            <span>Leads</span>
            <small>Selecciona negocio</small>
          </div>

          <RouterLink
            v-if="hasActiveBusiness"
            :to="businessRoute('bookings')"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8" />

                <path
                  d="M16 3v4M8 3v4M3 10h18"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round" />

                <path
                  d="m9 15 2 2 4-4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </span>

            <span>Reservas</span>
          </RouterLink>

          <div v-else class="nav-item nav-item-disabled" title="Selecciona un negocio para ver sus reservas">
            <span class="nav-icon">◷</span>
            <span>Reservas</span>
            <small>Selecciona negocio</small>
          </div>

          <RouterLink
            v-if="hasActiveBusiness"
            :to="businessRoute('employees')"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </span>
            <span>Equipo</span>
          </RouterLink>

          <div v-else class="nav-item nav-item-disabled" title="Selecciona un negocio para ver su equipo">
            <span class="nav-icon">♙</span>
            <span>Equipo</span>
            <small>Selecciona negocio</small>
          </div>
          <RouterLink
            v-if="hasActiveBusiness"
            :to="businessRoute('public-page')"
            class="nav-item"
            active-class="nav-item-active"
            @click="closeMobileMenu">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />

                <path
                  d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round" />
              </svg>
            </span>

            <span>Web pública</span>
          </RouterLink>

          <div
            v-else
            class="nav-item nav-item-disabled"
            title="Selecciona un negocio para configurar su web pública">
            <span class="nav-icon">◎</span>
            <span>Web pública</span>
            <small>Selecciona negocio</small>
          </div>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <RouterLink to="/settings" class="nav-item" active-class="nav-item-active" @click="closeMobileMenu">
          <span class="nav-icon">⚙</span>
          <span>Configuración</span>
        </RouterLink>
        <div class="sidebar-status">
          <span class="status-dot"></span>

          <div>
            <strong>Sistema operativo</strong>
            <span>Todos los servicios activos</span>
          </div>
        </div>

        <p v-if="logoutError" class="logout-error">
          {{ logoutError }}
        </p>

        <button type="button" class="logout-button" :disabled="logoutLoading" @click="handleLogout">
          <span>↪</span>

          {{ logoutLoading ? "Cerrando sesión..." : "Cerrar sesión" }}
        </button>
      </div>
    </aside>

    <div v-if="mobileMenuOpen" class="sidebar-overlay" @click="mobileMenuOpen = false"></div>

    <div class="app-content">
      <header class="mobile-topbar">
        <RouterLink to="/dashboard" class="mobile-brand">
          <div class="brand-mark">AI</div>
          <strong>AgentFlow</strong>
        </RouterLink>

        <button
          type="button"
          class="mobile-menu-button"
          aria-label="Abrir menú"
          @click="mobileMenuOpen = true">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--bg);
}

/* SIDEBAR */

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;

  width: 248px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 20px 14px;

  background: #ffffff;
  border-right: 1px solid var(--border);
}

.sidebar-top {
  min-height: 0;
}

.sidebar-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 8px 10px 22px;

  color: var(--text);
  text-decoration: none;
}

.brand-mark {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: var(--primary);
  color: #ffffff;

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
  color: var(--text);
  font-size: 14px;
  letter-spacing: -0.01em;
}

.brand-text span {
  color: var(--text-muted);
  font-size: 10px;
}

.mobile-close {
  display: none;
}

/* NAVIGATION */

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

  box-sizing: border-box;

  padding: 0 11px;

  border-radius: 8px;

  color: #667085;
  background: transparent;

  font-size: 13px;
  font-weight: 500;

  text-decoration: none;

  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover:not(.nav-item-disabled) {
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

  flex: 0 0 20px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 16px;
}

.nav-item-disabled {
  opacity: 0.55;
  cursor: default;
}

.nav-item-disabled small {
  margin-left: auto;

  color: var(--text-muted);

  font-size: 9px;
  font-weight: 500;
}

/* SIDEBAR FOOTER */

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

  flex: 0 0 7px;

  margin-top: 4px;

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

.sidebar-status div span {
  color: var(--text-muted);
  font-size: 9px;
}

.logout-button {
  min-height: 38px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 0 11px;

  border: 0;
  border-radius: 8px;

  background: transparent;
  color: #667085;

  font: inherit;
  font-size: 12px;
  font-weight: 500;

  cursor: pointer;

  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.logout-button:hover:not(:disabled) {
  background: var(--danger-soft);
  color: var(--danger);
}

.logout-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logout-error {
  margin: 0;

  padding: 8px 10px;

  border-radius: 7px;

  background: var(--danger-soft);
  color: var(--danger);

  font-size: 10px;
}

/* CONTENT */

.app-content {
  min-height: 100vh;
  margin-left: 248px;
}

.app-main {
  min-height: 100vh;
}

.mobile-topbar {
  display: none;
}

.sidebar-overlay {
  display: none;
}

/* RESPONSIVE */

@media (max-width: 900px) {
  .sidebar {
    width: 220px;
  }

  .app-content {
    margin-left: 220px;
  }
}

@media (max-width: 760px) {
  .sidebar {
    width: min(290px, 86vw);

    transform: translateX(-100%);

    box-shadow: 20px 0 50px rgba(15, 23, 42, 0.12);

    transition: transform 0.22s ease;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .app-content {
    margin-left: 0;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;

    display: block;

    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(2px);
  }

  .mobile-close {
    width: 34px;
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 0;
    border-radius: 8px;

    background: transparent;
    color: var(--text-secondary);

    font-size: 24px;

    cursor: pointer;
  }

  .mobile-topbar {
    height: 64px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 20px;

    border-bottom: 1px solid var(--border);

    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 9px;

    color: var(--text);

    font-size: 13px;

    text-decoration: none;
  }

  .mobile-brand .brand-mark {
    width: 30px;
    height: 30px;
    flex-basis: 30px;
  }

  .mobile-menu-button {
    width: 38px;
    height: 38px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    border: 1px solid var(--border);
    border-radius: 8px;

    background: white;

    cursor: pointer;
  }

  .mobile-menu-button span {
    width: 16px;
    height: 1.5px;

    border-radius: 10px;

    background: var(--text);
  }
}

/* =========================
   DASHBOARD LAYOUT TYPOGRAPHY FIX
========================= */

/* =========================
   BRAND
========================= */

.brand-text strong {
  font-size: 16px;
}

.brand-text span {
  margin-top: 1px;

  font-size: 12px;
  line-height: 1.35;
}

.brand-mark {
  font-size: 12px;
}

/* =========================
   NAVIGATION
========================= */

.nav-section-title {
  font-size: 11px;
}

.nav-item {
  min-height: 42px;

  font-size: 14px;
}

.nav-icon {
  font-size: 16px;
}

/* "Próximamente" */

.nav-item-disabled small {
  font-size: 10px;
}

/* =========================
   SIDEBAR STATUS
========================= */

.sidebar-status {
  padding: 12px;
}

.sidebar-status strong {
  font-size: 12px;
  line-height: 1.35;
}

.sidebar-status div span {
  font-size: 11px;
  line-height: 1.4;
}

/* =========================
   LOGOUT
========================= */

.logout-button {
  min-height: 42px;

  font-size: 13px;
}

.logout-error {
  padding: 9px 10px;

  font-size: 12px;
  line-height: 1.45;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 760px) {
  .brand-text strong {
    font-size: 16px;
  }

  .brand-text span {
    font-size: 12px;
  }

  .nav-section-title {
    font-size: 11px;
  }

  .nav-item {
    min-height: 44px;

    font-size: 14px;
  }

  .nav-item-disabled small {
    font-size: 10px;
  }

  .sidebar-status strong {
    font-size: 12px;
  }

  .sidebar-status div span {
    font-size: 11px;
  }

  .logout-button {
    min-height: 44px;

    font-size: 14px;
  }

  .mobile-brand {
    font-size: 15px;
    font-weight: 600;
  }
}
.nav-item-disabled small {
  margin-left: auto;

  color: var(--text-muted);

  font-size: 9px;
  font-weight: 500;

  white-space: nowrap;
}
</style>
