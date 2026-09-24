<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { EmployeeService } from "../infrastructure/EmployeeService.js";

const route = useRoute();
const router = useRouter();
const employeeService = new EmployeeService();

const employees = ref([]);
const loading = ref(true);
const error = ref("");
const createOpen = ref(false);
const creating = ref(false);
const createError = ref("");

const form = ref({
  name: "",
  email: "",
  phone: "",
});

const businessId = computed(() => route.params.id);
const activeEmployees = computed(() => employees.value.filter((employee) => employee.active));
const inactiveEmployees = computed(() => employees.value.filter((employee) => !employee.active));

const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "E";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

const loadEmployees = async () => {
  loading.value = true;
  error.value = "";

  try {
    employees.value = await employeeService.getByBusinessId(businessId.value);
  } catch (err) {
    error.value = err.message || "No se ha podido cargar el equipo.";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = { name: "", email: "", phone: "" };
  createError.value = "";
};

const closeCreate = () => {
  if (creating.value) return;
  createOpen.value = false;
  resetForm();
};

const handleCreate = async () => {
  createError.value = "";

  const name = form.value.name.trim();
  if (!name) {
    createError.value = "Introduce el nombre del empleado.";
    return;
  }

  creating.value = true;

  try {
    const employee = await employeeService.create(businessId.value, {
      name,
      email: form.value.email.trim() || null,
      phone: form.value.phone.trim() || null,
    });

    createOpen.value = false;
    resetForm();

    await router.push(`/businesses/${businessId.value}/employees/${employee.id}`);
  } catch (err) {
    createError.value = err.message || "No se ha podido crear el empleado.";
  } finally {
    creating.value = false;
  }
};

onMounted(loadEmployees);
</script>

<template>
  <div class="employees-page">
    <div class="page-container">
      <div class="breadcrumb">
        <RouterLink :to="`/businesses/${businessId}`">Negocio</RouterLink>
        <span>/</span>
        <strong>Equipo</strong>
      </div>

      <header class="page-header">
        <div>
          <p class="eyebrow">Gestión</p>
          <h1>Equipo</h1>
          <p class="page-description">
            Gestiona las personas que pueden recibir reservas, sus servicios, horarios y ausencias.
          </p>
        </div>

        <button type="button" class="primary-button" @click="createOpen = true">
          <span>+</span>
          Añadir empleado
        </button>
      </header>

      <section v-if="!loading && !error" class="summary-grid">
        <article class="summary-card">
          <span>Total</span>
          <strong>{{ employees.length }}</strong>
          <small>Personas configuradas</small>
        </article>

        <article class="summary-card">
          <span>Activos</span>
          <strong>{{ activeEmployees.length }}</strong>
          <small>Disponibles para reservas</small>
        </article>

        <article class="summary-card">
          <span>Inactivos</span>
          <strong>{{ inactiveEmployees.length }}</strong>
          <small>No reciben nuevas reservas</small>
        </article>
      </section>

      <section v-if="loading" class="state-card">
        <div class="spinner"></div>
        <p>Cargando equipo...</p>
      </section>

      <section v-else-if="error" class="state-card">
        <div class="state-icon error">!</div>
        <h2>No hemos podido cargar el equipo</h2>
        <p>{{ error }}</p>
        <button type="button" class="secondary-button" @click="loadEmployees">Reintentar</button>
      </section>

      <section v-else-if="employees.length === 0" class="empty-state">
        <div class="empty-icon">♙</div>
        <h2>Aún no hay empleados</h2>
        <p>
          Añade la primera persona del equipo y configura qué servicios realiza y cuándo está disponible.
        </p>
        <button type="button" class="primary-button" @click="createOpen = true">
          <span>+</span>
          Añadir primer empleado
        </button>
      </section>

      <section v-else class="employees-section">
        <div class="section-heading">
          <div>
            <h2>Personas del equipo</h2>
            <p>Entra en un empleado para configurar servicios, horario y ausencias.</p>
          </div>
          <span class="count-badge">{{ employees.length }} {{ employees.length === 1 ? "persona" : "personas" }}</span>
        </div>

        <div class="employee-grid">
          <RouterLink
            v-for="employee in employees"
            :key="employee.id"
            :to="`/businesses/${businessId}/employees/${employee.id}`"
            class="employee-card"
            :class="{ inactive: !employee.active }">
            <div class="card-top">
              <div class="avatar">{{ initials(employee.name) }}</div>
              <span class="status-badge" :class="{ inactive: !employee.active }">
                <span class="status-dot"></span>
                {{ employee.active ? "Activo" : "Inactivo" }}
              </span>
            </div>

            <div class="card-content">
              <h3>{{ employee.name }}</h3>
              <p>{{ employee.email || "Sin email" }}</p>
            </div>

            <div class="meta-list">
              <div>
                <span>Teléfono</span>
                <strong>{{ employee.phone || "No configurado" }}</strong>
              </div>
              <div>
                <span>Reservas</span>
                <strong>{{ employee.active ? "Habilitadas" : "Deshabilitadas" }}</strong>
              </div>
            </div>

            <footer>
              <span>Gestionar empleado</span>
              <span>→</span>
            </footer>
          </RouterLink>
        </div>
      </section>
    </div>

    <div v-if="createOpen" class="modal-backdrop" @click.self="closeCreate">
      <form class="modal-card" @submit.prevent="handleCreate">
        <div class="modal-header">
          <div>
            <span class="eyebrow">Nuevo miembro</span>
            <h2>Añadir empleado</h2>
          </div>
          <button type="button" class="close-button" aria-label="Cerrar" @click="closeCreate">×</button>
        </div>

        <p class="modal-description">
          Después podrás asignarle servicios, horario semanal y vacaciones o ausencias.
        </p>

        <div class="field">
          <label for="employee-name">Nombre *</label>
          <input id="employee-name" v-model="form.name" maxlength="100" autocomplete="name" placeholder="Ej. Laura García" />
        </div>

        <div class="field">
          <label for="employee-email">Email</label>
          <input id="employee-email" v-model="form.email" type="email" autocomplete="email" placeholder="laura@negocio.com" />
        </div>

        <div class="field">
          <label for="employee-phone">Teléfono</label>
          <input id="employee-phone" v-model="form.phone" maxlength="30" autocomplete="tel" placeholder="600 000 000" />
        </div>

        <p v-if="createError" class="form-error">{{ createError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" :disabled="creating" @click="closeCreate">Cancelar</button>
          <button type="submit" class="primary-button" :disabled="creating">
            {{ creating ? "Creando..." : "Crear y configurar" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.employees-page {
  min-height: 100vh;
  padding: 38px 48px 70px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.breadcrumb a {
  color: var(--text-secondary);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--primary);
}

.breadcrumb strong {
  color: var(--text-secondary);
  font-weight: 600;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 25px;
}

.eyebrow {
  margin: 0 0 7px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1,
.modal-header h2 {
  margin: 0;
  color: var(--text);
  letter-spacing: -0.035em;
}

.page-header h1 {
  font-size: 32px;
}

.page-description {
  max-width: 700px;
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
}

.primary-button,
.secondary-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 15px;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.18);
}

.primary-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.secondary-button {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-secondary);
}

.secondary-button:hover:not(:disabled) {
  background: var(--surface-soft);
  color: var(--text);
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 32px;
}

.summary-card {
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.summary-card span,
.summary-card small {
  display: block;
}

.summary-card span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.summary-card strong {
  display: block;
  margin: 5px 0 2px;
  color: var(--text);
  font-size: 25px;
  letter-spacing: -0.03em;
}

.summary-card small {
  color: var(--text-muted);
  font-size: 12px;
}

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
  font-size: 20px;
}

.section-heading p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.count-badge {
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.employee-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: 0.15s ease;
}

.employee-card:hover {
  border-color: #cbd5e1;
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.employee-card.inactive {
  background: #fcfcfd;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 17px;
}

.avatar {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #0f172a;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #16a34a;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.inactive {
  background: #f2f4f7;
  color: var(--text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.card-content h3 {
  margin: 0;
  color: var(--text);
  font-size: 17px;
}

.card-content p {
  margin: 5px 0 17px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-list {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.meta-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.meta-list span {
  color: var(--text-muted);
  font-size: 12px;
}

.meta-list strong {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: auto -18px -18px;
  padding: 13px 18px;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.employee-card:hover footer {
  color: var(--primary);
}

.state-card,
.empty-state {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.state-card h2,
.empty-state h2 {
  margin: 13px 0 5px;
  color: var(--text);
  font-size: 19px;
}

.state-card p,
.empty-state p {
  max-width: 500px;
  margin: 0 0 18px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.state-icon,
.empty-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
}

.state-icon.error {
  background: var(--danger-soft);
  color: var(--danger);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(3px);
}

.modal-card {
  width: min(500px, 100%);
  padding: 23px;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.modal-header h2 {
  font-size: 23px;
}

.close-button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 23px;
  cursor: pointer;
}

.close-button:hover {
  background: var(--surface-soft);
}

.modal-description {
  margin: 9px 0 20px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 13px;
}

.field label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.field input {
  min-height: 42px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  outline: none;
}

.field input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-error {
  margin: 4px 0 0;
  color: var(--danger);
  font-size: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 21px;
  padding-top: 17px;
  border-top: 1px solid var(--border);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1050px) {
  .employee-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .employees-page {
    padding: 28px 20px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header .primary-button {
    width: 100%;
  }

  .summary-grid,
  .employee-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .field input {
    font-size: 16px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>
