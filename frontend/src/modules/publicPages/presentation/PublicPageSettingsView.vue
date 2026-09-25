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
  themePrimary: "#2563eb",
  themeSecondary: "#0f172a",
  themeBackground: "#ffffff",
  themeSurface: "#f8fafc",
  themeText: "#0f172a",
  themeFont: "Inter",
  themeRadius: "14",
  themeButtonStyle: "rounded",
  themeTemplate: "editorial",
  themeHeroLayout: "split",
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

const palettes = [
  { name: "Resbix", primary: "#2563eb", secondary: "#0f172a", background: "#ffffff", surface: "#f8fafc", text: "#0f172a" },
  { name: "Elegante", primary: "#9a6b43", secondary: "#292524", background: "#fffdf8", surface: "#f5efe6", text: "#292524" },
  { name: "Natural", primary: "#47765b", secondary: "#20392c", background: "#fbfdf9", surface: "#edf4ed", text: "#20392c" },
  { name: "Creativo", primary: "#9333ea", secondary: "#30134d", background: "#ffffff", surface: "#faf5ff", text: "#30134d" },
  { name: "Minimal", primary: "#171717", secondary: "#171717", background: "#ffffff", surface: "#f5f5f5", text: "#171717" },
  { name: "Mediterráneo", primary: "#087e8b", secondary: "#143d45", background: "#ffffff", surface: "#edfafa", text: "#143d45" },
];
const templates = [
 { id:'editorial', name:'Editorial Premium', tag:'Belleza · Estética', desc:'Fotografía protagonista, elegancia editorial y grandes titulares.', swatches:['#9a6b43','#292524','#fffdf8'] },
 { id:'studio', name:'Modern Studio', tag:'Barbería · Fitness', desc:'Tipografía contundente, contrastes y composiciones atrevidas.', swatches:['#e0ff66','#181b20','#f4f5f0'] },
 { id:'minimal', name:'Minimal Luxury', tag:'Clínicas · Wellness', desc:'Serenidad, aire visual y una experiencia limpia y cuidada.', swatches:['#47765b','#20392c','#fbfdf9'] },
];
const fontOptions = ["Inter", "Poppins", "Montserrat", "Lato", "Roboto", "Georgia"];
const selectTemplate = (template) => {
 form.themeTemplate = template.id;
 const [primary,secondary,background] = template.swatches;
 form.themePrimary = primary;
 form.themeSecondary = secondary;
 form.themeBackground = background;
 form.themeSurface = template.id === 'studio' ? '#e7e9df' : template.id === 'minimal' ? '#edf4ed' : '#f5efe6';
 form.themeText = secondary;
 form.themeFont = template.id === 'editorial' ? 'Georgia' : template.id === 'studio' ? 'Montserrat' : 'Inter';
 form.themeButtonStyle = template.id === 'studio' ? 'square' : template.id === 'minimal' ? 'pill' : 'rounded';
};
const previewDevice = ref("desktop");
const previewStyles = computed(() => ({
  '--preview-primary': form.themePrimary,
  '--preview-secondary': form.themeSecondary,
  '--preview-bg': form.themeBackground,
  '--preview-surface': form.themeSurface,
  '--preview-text': form.themeText,
  '--preview-radius': `${form.themeButtonStyle === "pill" ? 999 : form.themeButtonStyle === "square" ? 3 : Number(form.themeRadius)}px`,
  fontFamily: form.themeFont === "Inter" ? 'Inter, system-ui, sans-serif' : `${form.themeFont}, sans-serif`,
}));
const applyPalette = (palette) => {
  form.themePrimary = palette.primary;
  form.themeSecondary = palette.secondary;
  form.themeBackground = palette.background;
  form.themeSurface = palette.surface;
  form.themeText = palette.text;
};

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
  form.themePrimary = page?.theme_primary || "#2563eb";
  form.themeSecondary = page?.theme_secondary || "#0f172a";
  form.themeBackground = page?.theme_background || "#ffffff";
  form.themeSurface = page?.theme_surface || "#f8fafc";
  form.themeText = page?.theme_text || "#0f172a";
  form.themeFont = page?.theme_font || "Inter";
  form.themeRadius = String(page?.theme_radius ?? 14);
  form.themeButtonStyle = page?.theme_button_style || "rounded";
  form.themeTemplate = page?.theme_template || "editorial";
  form.themeHeroLayout = page?.theme_hero_layout || "split";
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
  themePrimary: form.themePrimary,
  themeSecondary: form.themeSecondary,
  themeBackground: form.themeBackground,
  themeSurface: form.themeSurface,
  themeText: form.themeText,
  themeFont: form.themeFont,
  themeRadius: Number(form.themeRadius),
  themeButtonStyle: form.themeButtonStyle,
  themeTemplate: form.themeTemplate,
  themeHeroLayout: form.themeHeroLayout,
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

            <section class="settings-card design-card">
              <div class="card-heading"><div><span class="eyebrow">Diseño visual</span><h2>Personaliza tu marca</h2><p>Elige colores, tipografía y estilo. Comprueba los cambios en la vista previa antes de guardar.</p></div></div>
              <div class="studio-intro"><span>RESBIX / CREATIVE STUDIO</span><h3>Diseña algo que se sienta tuyo.</h3><p>Empieza por una identidad visual, ajusta cada detalle y crea una presencia que tus clientes recuerden. Tus servicios y reservas permanecen intactos.</p></div>
              <h3 class="design-subtitle">01 / Biblioteca de diseños</h3>
              <div class="template-library">
                <button v-for="template in templates" :key="template.id" type="button" class="template-tile" :class="{ 'is-selected':form.themeTemplate===template.id }" :aria-pressed="form.themeTemplate===template.id" @click="selectTemplate(template)">
                  <span class="template-art" :class="`art-${template.id}`"><span class="art-top">{{ business?.name || 'YOUR STUDIO' }} <span>☰</span></span><span class="art-title">{{ template.id==='editorial' ? 'The art of being you.' : template.id==='studio' ? 'MAKE IT COUNT.' : 'Feel better. Live well.' }}</span><span class="art-action">EXPLORE ↗</span></span>
                  <span class="template-info"><span><strong>{{ template.name }}</strong><small>{{ template.tag }}</small></span><span class="template-radio">{{ form.themeTemplate===template.id ? '✓' : '' }}</span></span>
                  <span class="template-desc">{{ template.desc }}</span>
                </button>
              </div>
              <h3 class="design-subtitle">02 / Composición de portada</h3>
              <div class="layout-selector"><button type="button" :class="{active:form.themeHeroLayout==='split'}" @click="form.themeHeroLayout='split'"><span class="layout-graphic split-graphic"><i></i><i></i></span>Dividida</button><button type="button" :class="{active:form.themeHeroLayout==='centered'}" @click="form.themeHeroLayout='centered'"><span class="layout-graphic center-graphic"><i></i><i></i></span>Centrada</button></div>
              <h3 class="design-subtitle">03 / Paletas prediseñadas</h3>
              <div class="palette-grid">
                <button v-for="palette in palettes" :key="palette.name" type="button" class="palette-choice" :aria-label="`Aplicar paleta ${palette.name}`" @click="applyPalette(palette)">
                  <span class="palette-dots"><i v-for="color in [palette.primary,palette.secondary,palette.surface]" :key="color" :style="{background:color}"></i></span><strong>{{ palette.name }}</strong>
                </button>
              </div>
              <h3 class="design-subtitle">Colores personalizados</h3>
              <div class="color-grid">
                <label v-for="item in [{key:'themePrimary',label:'Principal'},{key:'themeSecondary',label:'Secundario'},{key:'themeBackground',label:'Fondo'},{key:'themeSurface',label:'Secciones'},{key:'themeText',label:'Texto'}]" :key="item.key" class="color-field">
                  <span>{{ item.label }}</span><span class="color-input-row"><input v-model="form[item.key]" type="color" :aria-label="item.label" /><code>{{ form[item.key] }}</code></span>
                </label>
              </div>
              <div class="form-grid design-controls">
                <div class="field"><label for="theme-font">Tipografía</label><select id="theme-font" v-model="form.themeFont"><option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option></select></div>
                <div class="field"><label for="theme-buttons">Forma de botones</label><select id="theme-buttons" v-model="form.themeButtonStyle"><option value="rounded">Redondeados</option><option value="pill">Píldora</option><option value="square">Rectos</option></select></div>
                <div class="field field-full" v-if="form.themeButtonStyle === 'rounded'"><label for="theme-radius">Redondeo: {{ form.themeRadius }} px</label><input id="theme-radius" v-model="form.themeRadius" type="range" min="4" max="28" step="2" /></div>
              </div>
              <div class="preview-heading"><h3 class="design-subtitle">Tu web, antes de publicarla</h3><div class="preview-switch"><button type="button" :class="{active:previewDevice==='desktop'}" @click="previewDevice='desktop'">Escritorio</button><button type="button" :class="{active:previewDevice==='mobile'}" @click="previewDevice='mobile'">Móvil</button></div></div>
              <div class="preview-outer" aria-label="Vista previa orientativa del diseño"><div class="mini-preview" :class="['preview-'+form.themeTemplate, {'mini-mobile':previewDevice==='mobile','preview-centered':form.themeHeroLayout==='centered'}]" :style="previewStyles">
                <div class="mini-nav"><strong>{{ business?.name || 'Tu negocio' }}</strong><span>Servicios · Contacto</span></div>
                <div class="mini-hero"><div><small>BIENVENIDO</small><h3>{{ form.headline || business?.name || 'Tu negocio' }}</h3><p>{{ form.description || 'Descubre nuestros servicios y reserva online con nuestro asistente.' }}</p><button type="button" tabindex="-1">Reservar ahora →</button></div><div class="mini-art"><img v-if="form.coverImageUrl" :src="form.coverImageUrl" alt="Vista previa portada" /><span v-else>{{ (business?.name || 'N').charAt(0) }}</span></div></div>
                <div class="mini-services"><strong>Nuestros servicios</strong><div><span>Servicio destacado</span><span>Descubre más →</span></div></div>
              </div></div>
              <p class="note">Esta es una vista previa de diseño. La web publicada muestra los datos reales y el proceso completo de reserva.</p>
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

/* Constructor visual */
.design-subtitle{font-size:13px;color:var(--text);margin:20px 0 12px}.palette-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.palette-choice{border:1px solid var(--border);border-radius:10px;background:white;min-height:74px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:9px;padding:12px;cursor:pointer;text-align:left}.palette-choice:hover,.palette-choice:focus-visible{border-color:var(--primary)}.palette-choice strong{font-size:11px;color:var(--text)}.palette-dots{display:flex;gap:4px}.palette-dots i{display:block;width:19px;height:19px;border-radius:50%;border:1px solid #e2e8f0}.color-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}.color-field{display:flex;flex-direction:column;gap:8px;font-size:11px;font-weight:700;color:var(--text)}.color-input-row{display:flex;align-items:center;gap:7px;border:1px solid var(--border);padding:6px;border-radius:8px}.color-input-row input{width:33px;height:31px;padding:0;border:0;background:transparent;cursor:pointer}.color-input-row code{font-size:10px;color:var(--text-secondary)}.design-controls{margin-top:22px}.design-controls select{min-height:42px;padding:0 10px;border:1px solid var(--border);border-radius:9px;background:white;font:inherit;font-size:13px}.design-controls input[type=range]{accent-color:var(--primary)}.preview-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:18px}.preview-switch{display:flex;gap:3px;background:#f1f5f9;padding:3px;border-radius:8px}.preview-switch button{font-size:10px;padding:6px 9px;border:0;border-radius:6px;background:transparent;cursor:pointer}.preview-switch button.active{background:#fff;box-shadow:0 1px 4px #0001}.preview-outer{background:#e8edf3;border-radius:13px;padding:15px;overflow:auto}.mini-preview{width:100%;max-width:720px;margin:auto;background:var(--preview-bg);color:var(--preview-text);border-radius:9px;overflow:hidden;box-shadow:0 6px 20px #0001;transition:width .2s}.mini-preview.mini-mobile{width:min(100%,285px)}.mini-nav{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:13px 18px;border-bottom:1px solid #8882;font-size:10px}.mini-nav span{opacity:.6;font-size:8px}.mini-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:13px;align-items:center;padding:27px 18px}.mini-hero small{color:var(--preview-primary);font-size:8px;font-weight:800}.mini-hero h3{font-size:clamp(15px,2vw,24px);line-height:1.15;margin:9px 0;color:var(--preview-text)}.mini-hero p{font-size:9px;line-height:1.6;opacity:.75}.mini-hero button{margin-top:10px;padding:10px 12px;border:0;border-radius:var(--preview-radius);background:var(--preview-primary);color:white;font-size:9px;font-weight:700}.mini-art{display:grid;place-items:center;height:140px;border-radius:13px;background:var(--preview-secondary);color:white;font-size:64px;overflow:hidden}.mini-art img{width:100%;height:100%;object-fit:cover}.mini-services{padding:15px 18px;background:var(--preview-surface);font-size:10px}.mini-services>div{display:flex;justify-content:space-between;gap:10px;margin-top:9px;padding:12px;background:var(--preview-bg);border-radius:8px;font-size:9px}.mini-mobile .mini-nav span{display:none}.mini-mobile .mini-hero{grid-template-columns:1fr}.mini-mobile .mini-art{height:120px;grid-row:1}.mini-mobile .mini-hero h3{font-size:21px}@media(max-width:650px){.palette-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.preview-heading{flex-wrap:wrap}.preview-outer{padding:8px}}

/* Resbix Design Studio V6 */
.studio-intro{padding:25px;border-radius:16px;background:linear-gradient(120deg,#151a26,#2d3444);color:white;margin-bottom:26px}.studio-intro>span{font-size:10px;letter-spacing:.18em;color:#b6c4da;font-weight:800}.studio-intro h3{font-size:clamp(22px,3vw,31px);line-height:1.1;letter-spacing:-.04em;margin:10px 0}.studio-intro p{font-size:12px;line-height:1.65;color:#cbd5e1;max-width:490px}
.template-library{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.template-tile{min-width:0;text-align:left;border:2px solid #e6e9ee;border-radius:14px;background:#fff;padding:8px;cursor:pointer;transition:transform .22s,border-color .22s,box-shadow .22s}.template-tile:hover{transform:translateY(-4px);box-shadow:0 12px 30px #10182813}.template-tile.is-selected{border-color:var(--primary);box-shadow:0 0 0 3px #2563eb12}.template-art{height:145px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;padding:14px;border-radius:8px;position:relative}.art-editorial{background:radial-gradient(ellipse at 95% 70%,#d1bda5,transparent 48%),linear-gradient(145deg,#f9f1e5,#d8c5b2);color:#34291f}.art-studio{background:radial-gradient(circle at 100% 15%,#e0ff66 0 19%,transparent 20%),#181b20;color:#fff}.art-minimal{background:radial-gradient(circle at 90% 65%,#bdcfbd 0 20%,transparent 21%),#eef4eb;color:#294434}.art-top{font-size:8px;font-weight:900;letter-spacing:.1em;display:flex;justify-content:space-between;gap:4px}.art-title{max-width:145px;font-size:24px;line-height:.95;letter-spacing:-.06em;font-weight:800;position:relative}.art-editorial .art-title{font-family:Georgia,serif;font-weight:400;font-style:italic}.art-studio .art-title{font-size:25px;font-weight:950}.art-minimal .art-title{font-size:20px;font-weight:500;letter-spacing:-.04em}.art-action{font-size:7px;letter-spacing:.14em;font-weight:900}.template-info{display:flex;justify-content:space-between;gap:5px;align-items:center;padding:12px 4px 0}.template-info strong{font-size:12px;color:#1f2937}.template-info small{display:block;font-size:9px;color:#8a94a4;margin-top:3px}.template-radio{width:20px;height:20px;border:1px solid #cbd5e1;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;flex:none}.is-selected .template-radio{background:var(--primary);border-color:var(--primary)}.template-desc{display:block;padding:9px 4px 6px;color:#64748b;font-size:10px;line-height:1.5}.layout-selector{display:flex;gap:10px}.layout-selector button{flex:1;display:grid;place-items:center;gap:7px;padding:12px;border:1px solid #e2e8f0;background:#fff;border-radius:12px;cursor:pointer;font-size:11px}.layout-selector button.active{border:2px solid var(--primary);color:var(--primary);font-weight:800}.layout-graphic{display:flex;width:78px;height:46px;gap:5px;align-items:center;justify-content:center;padding:6px;background:#f1f5f9;border-radius:5px}.layout-graphic i{display:block;width:45%;height:70%;background:#cbd5e1;border-radius:3px}.layout-graphic i:first-child{height:35%;background:#94a3b8}.center-graphic{flex-direction:column}.center-graphic i{height:9px;width:50%}.center-graphic i:last-child{width:75%;height:17px}.preview-studio .mini-hero h3{font-family:Montserrat,Inter,sans-serif;text-transform:uppercase;font-weight:950;letter-spacing:-.065em}.preview-editorial .mini-hero h3{font-family:Georgia,serif;font-weight:400;font-style:italic}.preview-minimal .mini-hero{gap:26px}.preview-centered .mini-hero{grid-template-columns:1fr;text-align:center}.preview-centered .mini-hero>div:first-child{display:flex;flex-direction:column;align-items:center}.preview-centered .mini-art{height:115px;width:100%}@media(max-width:760px){.template-library{grid-template-columns:1fr}.template-art{height:175px}.template-info strong{font-size:14px}}

/* V7 / creative direction dashboard */
.public-settings-page{background:radial-gradient(ellipse at 100% 0%,#eaf0ff 0,transparent 35%),#f7f9fc}
.public-settings-page .page-container{width:min(1340px,100%)}
.public-settings-page .page-header h1{font-size:clamp(35px,4.2vw,55px);font-weight:800;letter-spacing:-.065em}
.public-settings-page .settings-card{border-color:#e9edf4;border-radius:20px;box-shadow:0 12px 40px #192c4808}
.public-settings-page .design-card{padding:30px}
.public-settings-page .studio-intro{position:relative;isolation:isolate;overflow:hidden;background:#101922;min-height:205px;display:flex;flex-direction:column;justify-content:center;padding:36px;border-radius:17px}
.public-settings-page .studio-intro:before{content:"✳";position:absolute;right:0;top:-100px;font-size:370px;line-height:1;color:#d5e7d0;opacity:.10;z-index:-1}
.public-settings-page .studio-intro>span{color:#b8c9b6;font-size:10px;letter-spacing:.28em}
.public-settings-page .studio-intro h3{font-size:clamp(31px,4vw,48px);font-weight:750;max-width:540px;letter-spacing:-.06em;line-height:1.03}
.public-settings-page .studio-intro p{font-size:13px;max-width:500px}
.public-settings-page .design-subtitle{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:34px 0 16px;color:#66758a}
.public-settings-page .template-library{gap:15px}
.public-settings-page .template-tile{border:1px solid #e6ebf2;padding:8px;border-radius:16px;transition:transform .35s,box-shadow .35s,border-color .35s}
.public-settings-page .template-tile:hover{transform:translateY(-7px);box-shadow:0 25px 50px #182b4517}
.public-settings-page .template-tile.is-selected{border:2px solid #1d3557;box-shadow:0 0 0 4px #1d35570b}
.public-settings-page .template-art{height:205px;padding:18px;border-radius:10px}
.public-settings-page .art-editorial{background:radial-gradient(ellipse at 93% 66%,#8d6249 0 14%,transparent 15%),radial-gradient(ellipse at 94% 60%,#c3a486 0 27%,transparent 28%),linear-gradient(125deg,#f8f0e5,#dbc4ab)}
.public-settings-page .art-studio{background:radial-gradient(circle at 88% 20%,#d7ff5d 0 20%,transparent 20.5%),linear-gradient(145deg,#1c2428,#101619)}
.public-settings-page .art-minimal{background:radial-gradient(ellipse at 84% 70%,#92ac8e 0 20%,transparent 20.5%),linear-gradient(140deg,#f3f6ee,#dce7d6)}
.public-settings-page .art-title{font-size:clamp(22px,2.4vw,35px);max-width:180px}
.public-settings-page .art-editorial .art-title{font-size:34px}
.public-settings-page .art-studio .art-title{font-size:35px}
.public-settings-page .art-minimal .art-title{font-size:28px}
.public-settings-page .template-info{padding:14px 6px 0}.public-settings-page .template-info strong{font-size:14px}.public-settings-page .template-desc{font-size:11px;padding:10px 6px}
.public-settings-page .layout-selector button{min-height:105px;border-radius:13px;transition:border-color .2s,transform .2s}.public-settings-page .layout-selector button:hover{transform:translateY(-2px)}
.public-settings-page .palette-choice{min-height:84px;border-radius:13px;transition:transform .2s,border-color .2s}.public-settings-page .palette-choice:hover{transform:translateY(-3px)}
.public-settings-page .preview-outer{background:#e8ecf2;padding:23px;border:1px solid #dce2ec;border-radius:17px}
.public-settings-page .mini-preview{max-width:820px;border-radius:8px;box-shadow:0 25px 65px #10182820}
.public-settings-page .mini-nav{padding:18px 24px;font-size:11px}.public-settings-page .mini-hero{padding:48px 25px;gap:24px}.public-settings-page .mini-hero h3{font-size:clamp(22px,3vw,37px);letter-spacing:-.06em;line-height:1.05}.public-settings-page .mini-hero p{font-size:11px}.public-settings-page .mini-art{height:230px}.public-settings-page .mini-services{padding:23px}.public-settings-page .mini-mobile .mini-hero{padding:25px 18px}.public-settings-page .mini-mobile .mini-hero h3{font-size:25px}.public-settings-page .mini-mobile .mini-art{height:160px}
.public-settings-page :is(button,input,textarea,select):focus-visible{outline:3px solid #6a91dc;outline-offset:2px}
@media(max-width:760px){.public-settings-page .design-card{padding:17px}.public-settings-page .studio-intro{padding:24px;min-height:180px}.public-settings-page .template-art{height:180px}.public-settings-page .preview-outer{padding:10px}.public-settings-page .mini-hero{padding:25px 16px}.public-settings-page .mini-art{height:130px}}
@media(prefers-reduced-motion:reduce){.public-settings-page *{transition-duration:.01ms!important}}

</style>
