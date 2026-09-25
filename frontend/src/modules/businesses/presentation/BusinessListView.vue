<script setup>
import { onMounted, ref } from "vue";
import { BillingService } from "../../billing/infrastructure/BillingService.js";
const billingService = new BillingService();
const activeIds = ref(new Set());
const businessTarget = id => activeIds.value.has(id) ? `/businesses/${id}` : `/businesses/${id}/billing`;
import { BusinessService } from "../infrastructure/BusinessService.js";
import { GetBusinesses } from "../application/GetBusinesses.js";

const businessService = new BusinessService();
const getBusinesses = new GetBusinesses(businessService);

const businesses = ref([]);
const loading = ref(true);
const error = ref("");

const loadBusinesses = async () => {
  loading.value = true;
  error.value = "";

  try {
    businesses.value = await getBusinesses.execute();
    const states = await Promise.all(businesses.value.map(async business => {
      try { const {billing}=await billingService.getStatus(business.id); return [business.id,["active","trialing"].includes(billing?.status)]; }
      catch { return [business.id,false]; }
    }));
    activeIds.value = new Set(states.filter(([,active])=>active).map(([id])=>id));
  } catch (err) {
    error.value = err.message || "No se han podido cargar los negocios.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadBusinesses);
</script>

<template>
  <div class="businesses-page">
    <div class="page-container">
      <!-- HEADER -->

      <header class="page-header">
        <div>
          <p class="eyebrow">Workspace</p>

          <h1>Negocios</h1>

          <p class="page-description">Gestiona tus negocios y los agentes de IA asociados a cada uno.</p>
        </div>

        <RouterLink to="/businesses/create" class="create-button">
          <span>+</span>
          Crear negocio
        </RouterLink>
      </header>

      <!-- SUMMARY -->

      <section v-if="!loading && !error" class="summary-bar">
        <div class="summary-item">
          <div class="summary-icon">▦</div>

          <div>
            <span>Total de negocios</span>

            <strong>{{ businesses.length }}</strong>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-status">
          <span class="status-dot"></span>

          <div>
            <strong>
              {{ businesses.length === 0 ? "Sin negocios configurados" : "Workspace operativo" }}
            </strong>

            <span>
              {{
                businesses.length === 0
                  ? "Crea tu primer negocio para empezar"
                  : "Tus negocios están disponibles"
              }}
            </span>
          </div>
        </div>
      </section>

      <!-- LOADING -->

      <section v-if="loading" class="state-card">
        <div class="spinner"></div>

        <p>Cargando negocios...</p>
      </section>

      <!-- ERROR -->

      <section v-else-if="error" class="state-card">
        <div class="state-icon error-icon">!</div>

        <h2>No hemos podido cargar tus negocios</h2>

        <p>{{ error }}</p>

        <button type="button" class="retry-button" @click="loadBusinesses">Reintentar</button>
      </section>

      <!-- EMPTY -->

      <section v-else-if="businesses.length === 0" class="empty-state">
        <div class="empty-visual">
          <div class="empty-orb">
            <span>✦</span>
          </div>

          <div class="empty-floating-card">
            <span class="status-dot"></span>
            Agente preparado
          </div>
        </div>

        <div class="empty-content">
          <span class="empty-badge"> Empieza aquí </span>

          <h2>Crea tu primer negocio</h2>

          <p>
            Configura la información de tu negocio, sus servicios, horarios y el comportamiento de tu agente
            de IA.
          </p>

          <RouterLink to="/businesses/create" class="empty-button">
            <span>+</span>
            Crear mi primer negocio
          </RouterLink>
        </div>
      </section>

      <!-- BUSINESSES -->

      <template v-else>
        <section class="business-section">
          <div class="section-heading">
            <div>
              <h2>Todos los negocios</h2>

              <p>Selecciona un negocio para gestionar su configuración.</p>
            </div>

            <span class="count-badge">
              {{ businesses.length }}
              {{ businesses.length === 1 ? "negocio" : "negocios" }}
            </span>
          </div>

          <div class="business-grid">
            <div
              v-for="business in businesses"
              :key="business.id"
              class="business-card">
              <div class="card-top">
                <div class="business-avatar">
                  {{ business.name?.charAt(0)?.toUpperCase() || "N" }}
                </div>

                <div class="business-status">
                  <span class="status-dot"></span>
                  Activo
                </div>
              </div>

              <div class="business-content">
                <h3>{{ business.name }}</h3>

                <p>
                  {{ business.description || "Sin descripción configurada." }}
                </p>
              </div>

              <div class="business-details">
                <div class="detail-row">
                  <div class="detail-icon">☎</div>

                  <div>
                    <span>Teléfono</span>

                    <strong>
                      {{ business.phone || "No configurado" }}
                    </strong>
                  </div>
                </div>

                <div class="detail-row">
                  <div class="detail-icon">⌖</div>

                  <div>
                    <span>Dirección</span>

                    <strong>
                      {{ business.address || "No configurada" }}
                    </strong>
                  </div>
                </div>
              </div>

              <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
                <RouterLink :to="businessTarget(business.id)" style="color:inherit;font-weight:750">Gestionar negocio →</RouterLink>
                <RouterLink :to="`/businesses/${business.id}/billing`" style="color:#3153ed;font-weight:750">Gestionar suscripción ↗</RouterLink>
              </div>
            </div>

            <!-- CREATE CARD -->

            <RouterLink to="/businesses/create" class="business-card create-card">
              <div class="create-card-icon">+</div>

              <h3>Nuevo negocio</h3>

              <p>Añade otro negocio y configura un nuevo agente de IA.</p>

              <span class="create-card-action"> Crear negocio → </span>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.businesses-page {
  min-height: 100vh;
  padding: 42px 48px 70px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

/* =========================
   HEADER
========================= */

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;

  margin-bottom: 26px;
}

.eyebrow {
  margin: 0 0 7px;

  color: var(--primary);

  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 0;

  color: var(--text);

  font-size: 32px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.page-description {
  margin: 8px 0 0;

  color: var(--text-secondary);

  font-size: 13px;
}

.create-button {
  min-height: 40px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 15px;

  border-radius: 8px;

  background: var(--primary);
  color: white;

  font-size: 12px;
  font-weight: 600;

  text-decoration: none;

  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);

  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.create-button:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.create-button span {
  font-size: 17px;
}

/* =========================
   SUMMARY
========================= */

.summary-bar {
  min-height: 72px;

  display: flex;
  align-items: center;

  margin-bottom: 32px;
  padding: 13px 16px;

  border: 1px solid var(--border);
  border-radius: 12px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 11px;
}

.summary-icon {
  width: 35px;
  height: 35px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 15px;
}

.summary-item > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.summary-item span {
  color: var(--text-muted);
  font-size: 9px;
}

.summary-item strong {
  color: var(--text);
  font-size: 16px;
}

.summary-divider {
  width: 1px;
  height: 34px;

  margin: 0 24px;

  background: var(--border);
}

.summary-status {
  display: flex;
  align-items: flex-start;
  gap: 9px;
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

.summary-status > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-status strong {
  color: var(--text);
  font-size: 10px;
}

.summary-status span {
  color: var(--text-muted);
  font-size: 9px;
}

/* =========================
   SECTION
========================= */

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;

  margin-bottom: 15px;
}

.section-heading h2 {
  margin: 0;

  color: var(--text);

  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.section-heading p {
  margin: 4px 0 0;

  color: var(--text-secondary);

  font-size: 11px;
}

.count-badge {
  padding: 5px 9px;

  border: 1px solid var(--border);
  border-radius: 999px;

  background: var(--surface);
  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 600;
}

/* =========================
   BUSINESS GRID
========================= */

.business-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.business-card {
  min-width: 0;
  min-height: 270px;

  display: flex;
  flex-direction: column;

  padding: 17px;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--surface);
  color: inherit;

  text-decoration: none;

  box-shadow: var(--shadow-sm);

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.business-card:hover {
  border-color: #cbd5e1;

  box-shadow: var(--shadow-md);

  transform: translateY(-2px);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 18px;
}

.business-avatar {
  width: 39px;
  height: 39px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  background: #0f172a;
  color: white;

  font-size: 14px;
  font-weight: 700;

  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.business-status {
  display: flex;
  align-items: center;
  gap: 6px;

  padding: 4px 7px;

  border-radius: 999px;

  background: #ecfdf3;
  color: #16a34a;

  font-size: 8px;
  font-weight: 600;
}

.business-status .status-dot {
  width: 5px;
  height: 5px;

  flex-basis: 5px;

  margin: 0;

  box-shadow: none;
}

.business-content {
  margin-bottom: 18px;
}

.business-content h3 {
  margin: 0;

  overflow: hidden;

  color: var(--text);

  font-size: 14px;
  line-height: 1.3;
  letter-spacing: -0.015em;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-content p {
  height: 34px;

  display: -webkit-box;
  overflow: hidden;

  margin: 5px 0 0;

  color: var(--text-secondary);

  font-size: 10px;
  line-height: 1.6;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.business-details {
  display: flex;
  flex-direction: column;
  gap: 9px;

  margin-bottom: 18px;
}

.detail-row {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  width: 27px;
  height: 27px;

  flex: 0 0 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: var(--surface-soft);
  color: var(--text-muted);

  font-size: 11px;
}

.detail-row > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 1px;
}

.detail-row span {
  color: var(--text-muted);

  font-size: 8px;
}

.detail-row strong {
  overflow: hidden;

  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 500;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin: auto -17px -17px;
  padding: 12px 17px;

  border-top: 1px solid var(--border);

  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 600;
}

.card-arrow {
  color: var(--text-muted);

  font-size: 14px;

  transition:
    transform 0.15s ease,
    color 0.15s ease;
}

.business-card:hover .card-arrow {
  color: var(--primary);
  transform: translateX(3px);
}

/* =========================
   CREATE CARD
========================= */

.create-card {
  align-items: center;
  justify-content: center;

  border-style: dashed;

  background: transparent;

  text-align: center;
}

.create-card:hover {
  border-color: #93c5fd;

  background: rgba(239, 246, 255, 0.4);
}

.create-card-icon {
  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 12px;

  border: 1px solid #dbeafe;
  border-radius: 10px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 20px;
}

.create-card h3 {
  margin: 0;

  color: var(--text);

  font-size: 12px;
}

.create-card p {
  max-width: 220px;

  margin: 6px auto 14px;

  color: var(--text-muted);

  font-size: 9px;
  line-height: 1.55;
}

.create-card-action {
  color: var(--primary);

  font-size: 9px;
  font-weight: 600;
}

/* =========================
   EMPTY STATE
========================= */

.empty-state {
  min-height: 390px;

  display: grid;
  grid-template-columns: 0.8fr 1fr;
  align-items: center;

  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: 16px;

  background: var(--surface);

  box-shadow: var(--shadow-sm);
}

.empty-visual {
  position: relative;

  height: 100%;
  min-height: 390px;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.12), transparent 35%), #f8fafc;
}

.empty-orb {
  width: 115px;
  height: 115px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #dbeafe;
  border-radius: 50%;

  background: radial-gradient(circle at 35% 30%, white, #dbeafe 40%, #bfdbfe 70%);

  box-shadow: 0 20px 50px rgba(37, 99, 235, 0.12);
}

.empty-orb span {
  width: 46px;
  height: 46px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #0f172a;
  color: white;

  font-size: 18px;
}

.empty-floating-card {
  position: absolute;
  right: 35px;
  bottom: 70px;

  display: flex;
  align-items: center;
  gap: 7px;

  padding: 8px 10px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: white;

  color: var(--text-secondary);

  font-size: 9px;
  font-weight: 600;

  box-shadow: var(--shadow-md);
}

.empty-floating-card .status-dot {
  margin: 0;
}

.empty-content {
  max-width: 430px;

  padding: 50px;
}

.empty-badge {
  display: inline-flex;

  margin-bottom: 12px;
  padding: 4px 7px;

  border-radius: 999px;

  background: var(--primary-soft);
  color: var(--primary);

  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.empty-content h2 {
  margin: 0;

  color: var(--text);

  font-size: 25px;
  letter-spacing: -0.035em;
}

.empty-content p {
  margin: 10px 0 20px;

  color: var(--text-secondary);

  font-size: 11px;
  line-height: 1.7;
}

.empty-button {
  min-height: 38px;

  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 0 13px;

  border-radius: 8px;

  background: var(--primary);
  color: white;

  font-size: 10px;
  font-weight: 600;

  text-decoration: none;
}

/* =========================
   STATES
========================= */

.state-card {
  min-height: 300px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 30px;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--surface);

  text-align: center;

  box-shadow: var(--shadow-sm);
}

.state-card h2 {
  margin: 12px 0 4px;

  color: var(--text);

  font-size: 15px;
}

.state-card p {
  margin: 0;

  color: var(--text-secondary);

  font-size: 10px;
}

.spinner {
  width: 23px;
  height: 23px;

  margin-bottom: 10px;

  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

.state-icon {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-weight: 700;
}

.error-icon {
  background: var(--danger-soft);
  color: var(--danger);
}

.retry-button {
  min-height: 35px;

  margin-top: 15px;
  padding: 0 12px;

  border: 0;
  border-radius: 7px;

  background: var(--primary);
  color: white;

  font: inherit;
  font-size: 10px;
  font-weight: 600;

  cursor: pointer;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1100px) {
  .business-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .businesses-page {
    padding: 32px;
  }
}

@media (max-width: 760px) {
  .businesses-page {
    padding: 28px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
  }

  .create-button {
    width: 100%;
  }

  .summary-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 13px;
  }

  .summary-divider {
    width: 100%;
    height: 1px;

    margin: 0;
  }

  .business-grid {
    grid-template-columns: 1fr;
  }

  .empty-state {
    grid-template-columns: 1fr;
  }

  .empty-visual {
    min-height: 220px;
  }

  .empty-content {
    max-width: none;

    padding: 30px;
  }
}

@media (max-width: 520px) {
  .page-header h1 {
    font-size: 28px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .business-card {
    min-height: 260px;
  }
}
/* =========================
   BUSINESS LIST TYPOGRAPHY FIX
========================= */

/* =========================
   HEADER
========================= */

.eyebrow {
  font-size: 12px;
}

.page-header h1 {
  font-size: 32px;
}

.page-description {
  font-size: 15px;
  line-height: 1.6;
}

.create-button {
  min-height: 42px;
  padding: 0 16px;

  font-size: 14px;
}

.create-button span {
  font-size: 18px;
}

/* =========================
   SUMMARY
========================= */

.summary-icon {
  font-size: 16px;
}

.summary-item span {
  font-size: 12px;
}

.summary-item strong {
  font-size: 18px;
}

.summary-status strong {
  font-size: 13px;
}

.summary-status span {
  font-size: 12px;
  line-height: 1.4;
}

/* =========================
   SECTION HEADING
========================= */

.section-heading h2 {
  font-size: 20px;
}

.section-heading p {
  font-size: 14px;
  line-height: 1.5;
}

.count-badge {
  padding: 5px 10px;

  font-size: 12px;
}

/* =========================
   BUSINESS CARDS
========================= */

.business-avatar {
  font-size: 15px;
}

.business-status {
  padding: 4px 8px;

  font-size: 11px;
}

/* Business name */

.business-content h3 {
  font-size: 17px;
  line-height: 1.35;
}

/* Description */

.business-content p {
  /*
    Original height was designed for 10px text.
    Give two 14px lines enough room.
  */
  height: 45px;

  margin-top: 6px;

  font-size: 14px;
  line-height: 1.55;
}

/* =========================
   BUSINESS DETAILS
========================= */

.business-details {
  gap: 11px;
}

.detail-icon {
  width: 30px;
  height: 30px;

  flex: 0 0 30px;

  font-size: 12px;
}

.detail-row span {
  font-size: 11px;
}

.detail-row strong {
  margin-top: 2px;

  font-size: 13px;
  line-height: 1.4;
}

/* =========================
   CARD FOOTER
========================= */

.card-footer {
  font-size: 13px;
}

.card-arrow {
  font-size: 16px;
}

/* =========================
   CREATE BUSINESS CARD
========================= */

.create-card h3 {
  font-size: 16px;
}

.create-card p {
  max-width: 240px;

  font-size: 13px;
  line-height: 1.55;
}

.create-card-action {
  font-size: 13px;
}

/* =========================
   EMPTY STATE
========================= */

.empty-floating-card {
  font-size: 12px;
}

.empty-badge {
  padding: 5px 8px;

  font-size: 11px;
}

.empty-content h2 {
  font-size: 27px;
}

.empty-content p {
  font-size: 14px;
  line-height: 1.7;
}

.empty-button {
  min-height: 42px;
  padding: 0 15px;

  font-size: 14px;
}

/* =========================
   LOADING / ERROR STATES
========================= */

.state-card h2 {
  font-size: 17px;
}

.state-card p {
  font-size: 13px;
  line-height: 1.5;
}

.retry-button {
  min-height: 39px;
  padding: 0 14px;

  font-size: 13px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 760px) {
  .page-description {
    font-size: 14px;
  }

  .create-button {
    min-height: 44px;
    font-size: 14px;
  }

  .summary-item span {
    font-size: 12px;
  }

  .summary-status strong {
    font-size: 13px;
  }

  .summary-status span {
    font-size: 12px;
  }

  .section-heading h2 {
    font-size: 19px;
  }

  .section-heading p {
    font-size: 13px;
  }

  .business-content h3 {
    font-size: 17px;
  }

  .business-content p {
    font-size: 14px;
  }

  .detail-row strong {
    font-size: 13px;
  }

  .card-footer {
    font-size: 13px;
  }
}

@media (max-width: 520px) {
  .page-header h1 {
    font-size: 28px;
  }

  .business-card {
    min-height: 280px;
  }

  .empty-content h2 {
    font-size: 25px;
  }
}
</style>
