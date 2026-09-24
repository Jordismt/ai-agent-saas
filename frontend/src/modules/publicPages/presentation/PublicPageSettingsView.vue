<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

import { BusinessService } from "../../businesses/infrastructure/BusinessService.js";
import { PublicPageService } from "../infrastructure/PublicPageService.js";

const route = useRoute();

const businessService = new BusinessService();
const publicPageService = new PublicPageService();

const business = ref(null);
const existingPage = ref(null);

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const saveError = ref("");
const saveSuccess = ref("");

const form = reactive({
  slug: "",
  published: false,
  headline: "",
  description: "",
  about: "",
  logoUrl: "",
  coverImageUrl: "",
  publicPhone: "",
  publicEmail: "",
  publicAddress: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  websiteUrl: "",
  mapsUrl: "",
  showServices: true,
  showTeam: true,
  showHours: true,
  showAbout: true,
  showContact: true,
});

const businessId = computed(() => String(route.params.id || ""));

const frontendBaseUrl = computed(() => {
  const configured = String(import.meta.env.VITE_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
});

const publicUrl = computed(() => {
  if (!form.slug) return "";

  return `${frontendBaseUrl.value}/${form.slug}`;
});

const hasExistingPage = computed(() => Boolean(existingPage.value?.id));

const statusLabel = computed(() => (form.published ? "Publicada" : "Borrador"));

const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "")
    .slice(0, 80);

const normalizeNullable = (value) => {
  const normalized = String(value ?? "").trim();

  return normalized || null;
};

const hydrateForm = (page) => {
  form.slug = page?.slug || slugify(business.value?.name || "");
  form.published = Boolean(page?.published);

  form.headline = page?.headline || "";
  form.description = page?.description || "";
  form.about = page?.about || "";

  form.logoUrl = page?.logo_url || "";
  form.coverImageUrl = page?.cover_image_url || "";

  form.publicPhone = page?.public_phone ?? business.value?.phone ?? "";
  form.publicEmail = page?.public_email || "";
  form.publicAddress = page?.public_address ?? business.value?.address ?? "";

  form.instagramUrl = page?.instagram_url || "";
  form.facebookUrl = page?.facebook_url || "";
  form.tiktokUrl = page?.tiktok_url || "";
  form.websiteUrl = page?.website_url || "";
  form.mapsUrl = page?.maps_url || "";

  form.showServices = page?.show_services ?? true;
  form.showTeam = page?.show_team ?? true;
  form.showHours = page?.show_hours ?? true;
  form.showAbout = page?.show_about ?? true;
  form.showContact = page?.show_contact ?? true;
};

const loadData = async () => {
  loading.value = true;
  error.value = "";

  try {
    const [businessResult, pageResult] = await Promise.all([
      businessService.getBusinessById(businessId.value),
      publicPageService.getByBusinessId(businessId.value),
    ]);

    business.value = businessResult;
    existingPage.value = pageResult;

    hydrateForm(pageResult);
  } catch (err) {
    console.error(err);

    error.value = err.message || "No se ha podido cargar la configuración de la web.";
  } finally {
    loading.value = false;
  }
};

const handleSlugInput = (event) => {
  form.slug = slugify(event.target.value);
};

const validate = () => {
  const slug = slugify(form.slug);

  if (slug.length < 3) {
    return "La URL debe tener al menos 3 caracteres.";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "La URL solo puede contener letras minúsculas, números y guiones.";
  }

  form.slug = slug;

  return "";
};

const buildPayload = () => ({
  slug: form.slug,
  published: form.published,

  headline: normalizeNullable(form.headline),
  description: normalizeNullable(form.description),
  about: normalizeNullable(form.about),

  logoUrl: normalizeNullable(form.logoUrl),
  coverImageUrl: normalizeNullable(form.coverImageUrl),

  publicPhone: normalizeNullable(form.publicPhone),
  publicEmail: normalizeNullable(form.publicEmail),
  publicAddress: normalizeNullable(form.publicAddress),

  instagramUrl: normalizeNullable(form.instagramUrl),
  facebookUrl: normalizeNullable(form.facebookUrl),
  tiktokUrl: normalizeNullable(form.tiktokUrl),
  websiteUrl: normalizeNullable(form.websiteUrl),
  mapsUrl: normalizeNullable(form.mapsUrl),

  showServices: form.showServices,
  showTeam: form.showTeam,
  showHours: form.showHours,
  showAbout: form.showAbout,
  showContact: form.showContact,
});

const handleSave = async () => {
  saveError.value = "";
  saveSuccess.value = "";

  const validationError = validate();

  if (validationError) {
    saveError.value = validationError;
    return;
  }

  saving.value = true;

  try {
    const saved = await publicPageService.save(businessId.value, buildPayload());

    existingPage.value = saved;
    hydrateForm(saved);

    saveSuccess.value = form.published
      ? "Web guardada y publicada correctamente."
      : "Cambios guardados correctamente.";
  } catch (err) {
    console.error(err);

    saveError.value = err.message || "No se ha podido guardar la web pública.";
  } finally {
    saving.value = false;
  }
};

const openPublicPage = () => {
  if (!publicUrl.value || !form.published) return;

  window.open(publicUrl.value, "_blank", "noopener,noreferrer");
};

const copyPublicUrl = async () => {
  if (!publicUrl.value) return;

  try {
    await navigator.clipboard.writeText(publicUrl.value);
    saveSuccess.value = "URL copiada.";
  } catch {
    saveError.value = "No se ha podido copiar la URL.";
  }
};

onMounted(loadData);
</script>

<template>
  <div class="public-settings-page">
    <div class="page-container">
      <nav class="breadcrumb">
        <RouterLink to="/businesses">Negocios</RouterLink>
        <span>/</span>
        <RouterLink :to="`/businesses/${businessId}`">
          {{ business?.name || "Negocio" }}
        </RouterLink>
        <span>/</span>
        <span>Web pública</span>
      </nav>

      <div v-if="loading" class="state-card">
        <div class="spinner"></div>
        <p>Cargando web pública...</p>
      </div>

      <div v-else-if="error" class="state-card state-error">
        <div class="state-symbol">!</div>
        <h2>No se ha podido cargar la web</h2>
        <p>{{ error }}</p>
        <button type="button" class="button button-primary" @click="loadData">
          Reintentar
        </button>
      </div>

      <template v-else>
        <header class="page-header">
          <div>
            <div class="title-meta">
              <span class="status-dot" :class="{ draft: !form.published }"></span>
              <span>{{ statusLabel }}</span>
            </div>

            <h1>Web pública</h1>

            <p>
              Configura la página que verán los clientes de
              <strong>{{ business?.name }}</strong>. Servicios, equipo y horarios se sincronizan
              automáticamente con Resbix.
            </p>
          </div>

          <div class="header-actions">
            <button
              type="button"
              class="button button-secondary"
              :disabled="!form.published || !hasExistingPage"
              @click="openPublicPage">
              Ver web
              <span>↗</span>
            </button>

            <button type="button" class="button button-primary" :disabled="saving" @click="handleSave">
              {{ saving ? "Guardando..." : "Guardar cambios" }}
            </button>
          </div>
        </header>

        <div v-if="saveError" class="alert alert-error">
          {{ saveError }}
        </div>

        <div v-if="saveSuccess" class="alert alert-success">
          ✓ {{ saveSuccess }}
        </div>

        <div class="settings-layout">
          <div class="settings-main">
            <section class="settings-card">
              <div class="card-heading">
                <div>
                  <span class="eyebrow">Publicación</span>
                  <h2>Estado y dirección</h2>
                  <p>Elige la URL de la página y decide cuándo estará visible.</p>
                </div>

                <label class="publish-switch">
                  <input v-model="form.published" type="checkbox" />
                  <span class="switch-track">
                    <span class="switch-thumb"></span>
                  </span>
                  <span>{{ form.published ? "Publicada" : "Borrador" }}</span>
                </label>
              </div>

              <div class="field">
                <label for="public-slug">URL pública</label>

                <div class="url-field">
                  <span>{{ frontendBaseUrl }}/</span>
                  <input
                    id="public-slug"
                    :value="form.slug"
                    type="text"
                    maxlength="80"
                    autocomplete="off"
                    placeholder="peluqueria-jordi"
                    @input="handleSlugInput" />
                </div>

                <div class="field-help-row">
                  <small>Solo letras, números y guiones. Mínimo 3 caracteres.</small>

                  <button type="button" class="text-button" :disabled="!form.slug" @click="copyPublicUrl">
                    Copiar URL
                  </button>
                </div>
              </div>
            </section>

            <section class="settings-card">
              <div class="card-heading">
                <div>
                  <span class="eyebrow">Presentación</span>
                  <h2>Hero de la página</h2>
                  <p>El primer bloque que verá un cliente cuando entre en la web.</p>
                </div>
              </div>

              <div class="form-grid">
                <div class="field field-full">
                  <label for="headline">Título principal</label>
                  <input
                    id="headline"
                    v-model="form.headline"
                    type="text"
                    maxlength="150"
                    :placeholder="business?.name || 'Tu negocio'" />
                  <small>{{ form.headline.length }}/150</small>
                </div>

                <div class="field field-full">
                  <label for="description">Descripción corta</label>
                  <textarea
                    id="description"
                    v-model="form.description"
                    rows="4"
                    maxlength="500"
                    placeholder="Explica en una frase qué hace especial a tu negocio."></textarea>
                  <small>{{ form.description.length }}/500</small>
                </div>

                <div class="field">
                  <label for="logo-url">Logo · URL</label>
                  <input
                    id="logo-url"
                    v-model="form.logoUrl"
                    type="url"
                    placeholder="https://..." />
                </div>

                <div class="field">
                  <label for="cover-url">Imagen principal · URL</label>
                  <input
                    id="cover-url"
                    v-model="form.coverImageUrl"
                    type="url"
                    placeholder="https://..." />
                </div>
              </div>

              <p class="note">
                De momento las imágenes se configuran mediante URL. Después podemos añadir subida directa
                a Supabase Storage.
              </p>
            </section>

            <section class="settings-card">
              <div class="card-heading">
                <div>
                  <span class="eyebrow">Contenido</span>
                  <h2>Sobre el negocio</h2>
                  <p>Un texto más completo para presentar el negocio a nuevos clientes.</p>
                </div>
              </div>

              <div class="field">
                <label for="about">Sobre nosotros</label>
                <textarea
                  id="about"
                  v-model="form.about"
                  rows="8"
                  maxlength="3000"
                  placeholder="Cuenta quiénes sois, vuestra experiencia, filosofía o aquello que queréis destacar."></textarea>
                <small>{{ form.about.length }}/3000</small>
              </div>
            </section>

            <section class="settings-card">
              <div class="card-heading">
                <div>
                  <span class="eyebrow">Contacto</span>
                  <h2>Información pública</h2>
                  <p>Estos datos sí podrán mostrarse en la web.</p>
                </div>
              </div>

              <div class="form-grid">
                <div class="field">
                  <label for="public-phone">Teléfono</label>
                  <input id="public-phone" v-model="form.publicPhone" type="tel" maxlength="50" />
                </div>

                <div class="field">
                  <label for="public-email">Email</label>
                  <input id="public-email" v-model="form.publicEmail" type="email" placeholder="hola@negocio.es" />
                </div>

                <div class="field field-full">
                  <label for="public-address">Dirección</label>
                  <input
                    id="public-address"
                    v-model="form.publicAddress"
                    type="text"
                    maxlength="300"
                    placeholder="Calle, número, localidad..." />
                </div>

                <div class="field field-full">
                  <label for="maps-url">Enlace de Google Maps</label>
                  <input id="maps-url" v-model="form.mapsUrl" type="url" placeholder="https://maps.google.com/..." />
                </div>
              </div>
            </section>

            <section class="settings-card">
              <div class="card-heading">
                <div>
                  <span class="eyebrow">Redes y enlaces</span>
                  <h2>Presencia online</h2>
                  <p>Añade solo las redes que quieras mostrar.</p>
                </div>
              </div>

              <div class="form-grid">
                <div class="field">
                  <label for="instagram">Instagram</label>
                  <input id="instagram" v-model="form.instagramUrl" type="url" placeholder="https://instagram.com/..." />
                </div>

                <div class="field">
                  <label for="facebook">Facebook</label>
                  <input id="facebook" v-model="form.facebookUrl" type="url" placeholder="https://facebook.com/..." />
                </div>

                <div class="field">
                  <label for="tiktok">TikTok</label>
                  <input id="tiktok" v-model="form.tiktokUrl" type="url" placeholder="https://tiktok.com/@..." />
                </div>

                <div class="field">
                  <label for="website">Web externa</label>
                  <input id="website" v-model="form.websiteUrl" type="url" placeholder="https://..." />
                </div>
              </div>
            </section>
          </div>

          <aside class="settings-sidebar">
            <section class="settings-card sticky-card">
              <div class="card-heading compact">
                <div>
                  <span class="eyebrow">Secciones</span>
                  <h2>Contenido visible</h2>
                  <p>Activa únicamente lo que quieras enseñar.</p>
                </div>
              </div>

              <div class="section-toggles">
                <label class="section-toggle">
                  <div>
                    <strong>Servicios</strong>
                    <span>Catálogo, precio y duración.</span>
                  </div>
                  <input v-model="form.showServices" type="checkbox" />
                </label>

                <label class="section-toggle">
                  <div>
                    <strong>Equipo</strong>
                    <span>Empleados activos y especialidades.</span>
                  </div>
                  <input v-model="form.showTeam" type="checkbox" />
                </label>

                <label class="section-toggle">
                  <div>
                    <strong>Horarios</strong>
                    <span>Horario comercial configurado.</span>
                  </div>
                  <input v-model="form.showHours" type="checkbox" />
                </label>

                <label class="section-toggle">
                  <div>
                    <strong>Sobre nosotros</strong>
                    <span>El texto de presentación del negocio.</span>
                  </div>
                  <input v-model="form.showAbout" type="checkbox" />
                </label>

                <label class="section-toggle">
                  <div>
                    <strong>Contacto</strong>
                    <span>Teléfono, email, dirección y redes.</span>
                  </div>
                  <input v-model="form.showContact" type="checkbox" />
                </label>
              </div>

              <div class="sync-note">
                <span class="sync-icon">↻</span>
                <div>
                  <strong>Datos sincronizados</strong>
                  <p>
                    Servicios, equipo y horarios se obtienen de la configuración real del negocio.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <footer class="save-footer">
          <div>
            <strong>{{ form.published ? "La web quedará visible al guardar." : "La web seguirá en borrador." }}</strong>
            <span v-if="publicUrl">{{ publicUrl }}</span>
          </div>

          <button type="button" class="button button-primary" :disabled="saving" @click="handleSave">
            {{ saving ? "Guardando..." : "Guardar cambios" }}
          </button>
        </footer>
      </template>
    </div>
  </div>
</template>

<style scoped>
.public-settings-page {
  min-height: 100vh;
  padding: 34px 48px 90px;
}

.page-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  color: var(--text-muted);
  font-size: 12px;
}

.breadcrumb a {
  color: var(--text-secondary);
  font-weight: 500;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--primary);
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 26px;
}

.page-header > div:first-child {
  max-width: 720px;
}

.title-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

.status-dot.draft {
  background: #94a3b8;
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.12);
}

.page-header h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.page-header p {
  margin: 11px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
}

.button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 9px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: 0.15s ease;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 5px 14px rgba(37, 99, 235, 0.16);
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.button-secondary {
  border-color: var(--border);
  background: #fff;
  color: var(--text);
}

.button-secondary:hover:not(:disabled) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
}

.settings-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.025);
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.card-heading.compact {
  margin-bottom: 18px;
}

.eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 19px;
  letter-spacing: -0.02em;
}

.card-heading p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.publish-switch {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.publish-switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  width: 40px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: 0.18s ease;
}

.switch-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2);
  transition: transform 0.18s ease;
}

.publish-switch input:checked + .switch-track {
  background: var(--primary);
}

.publish-switch input:checked + .switch-track .switch-thumb {
  transform: translateX(18px);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  outline: none;
  transition: 0.15s ease;
}

.field input {
  min-height: 42px;
  padding: 0 12px;
}

.field textarea {
  padding: 11px 12px;
  resize: vertical;
  line-height: 1.55;
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(37, 99, 235, 0.55);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.field small {
  color: var(--text-muted);
  font-size: 11px;
}

.url-field {
  min-height: 44px;
  display: flex;
  align-items: stretch;
  border: 1px solid var(--border);
  border-radius: 9px;
  overflow: hidden;
  background: #fff;
}

.url-field > span {
  display: flex;
  align-items: center;
  padding: 0 0 0 12px;
  color: #64748b;
  background: #f8fafc;
  border-right: 1px solid var(--border);
  font-size: 12px;
  white-space: nowrap;
}

.url-field input {
  min-width: 0;
  flex: 1;
  border: 0;
  border-radius: 0;
  box-shadow: none !important;
}

.field-help-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.text-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.note {
  margin: 15px 0 0;
  padding: 11px 13px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  line-height: 1.55;
}

.settings-sidebar {
  min-width: 0;
}

.sticky-card {
  position: sticky;
  top: 24px;
}

.section-toggles {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #eef2f7;
  cursor: pointer;
}

.section-toggle:last-child {
  border-bottom: 0;
}

.section-toggle div {
  min-width: 0;
}

.section-toggle strong {
  display: block;
  color: var(--text);
  font-size: 13px;
}

.section-toggle span {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.45;
}

.section-toggle input {
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  accent-color: var(--primary);
}

.sync-note {
  display: flex;
  gap: 11px;
  margin-top: 19px;
  padding: 14px;
  border-radius: 10px;
  background: var(--primary-soft);
}

.sync-icon {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  color: var(--primary);
  font-size: 15px;
  font-weight: 800;
}

.sync-note strong {
  color: var(--text);
  font-size: 12px;
}

.sync-note p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.alert {
  margin-bottom: 18px;
  padding: 11px 14px;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.5;
}

.alert-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.alert-success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.save-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 22px;
  padding: 17px 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}

.save-footer div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.save-footer strong {
  color: var(--text);
  font-size: 12px;
}

.save-footer span {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  text-align: center;
}

.state-card h2,
.state-card p {
  margin: 0;
}

.state-card p {
  color: var(--text-secondary);
  font-size: 13px;
}

.state-symbol {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #fef2f2;
  color: #dc2626;
  font-weight: 800;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1000px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .sticky-card {
    position: static;
  }
}

@media (max-width: 760px) {
  .public-settings-page {
    padding: 24px 18px 70px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .button {
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field-full {
    grid-column: auto;
  }

  .card-heading {
    flex-direction: column;
  }

  .settings-card {
    padding: 19px;
  }

  .url-field {
    flex-direction: column;
  }

  .url-field > span {
    min-height: 34px;
    padding: 0 11px;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .save-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
