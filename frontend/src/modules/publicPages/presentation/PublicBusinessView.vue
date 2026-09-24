<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { PublicPageService } from "../infrastructure/PublicPageService.js";
import PublicChatWidget from "./PublicChatWidget.vue";

const route = useRoute();
const publicPageService = new PublicPageService();

const data = ref(null);
const loading = ref(true);
const error = ref("");
const chatWidget = ref(null);

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const business = computed(() => data.value?.business || null);
const page = computed(() => data.value?.page || {});
const services = computed(() => data.value?.services || []);
const employees = computed(() => data.value?.employees || []);
const openingHours = computed(() =>
  [...(data.value?.opening_hours || [])].sort((a, b) => {
    const order = (day) => (day === 0 ? 7 : day);
    return order(a.day_of_week) - order(b.day_of_week);
  }),
);

const heroTitle = computed(() => page.value.headline || business.value?.name || "Bienvenido");
const heroDescription = computed(
  () =>
    page.value.description ||
    business.value?.description ||
    "Estamos aquí para ayudarte. Consulta nuestros servicios y habla con nuestro asistente.",
);

const phone = computed(() => page.value.public_phone || business.value?.phone || null);
const address = computed(() => page.value.public_address || business.value?.address || null);

const hasSocialLinks = computed(() =>
  Boolean(
    page.value.instagram_url ||
      page.value.facebook_url ||
      page.value.tiktok_url ||
      page.value.website_url,
  ),
);



const openChat = (prefill = "") => {
  chatWidget.value?.open(prefill);
};

const formatTime = (value) => {
  if (!value) return "";
  return String(value).slice(0, 5);
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(number);
};

const formatHours = (day) => {
  if (day.is_closed) {
    return "Cerrado";
  }

  const first =
    day.open_time && day.close_time
      ? `${formatTime(day.open_time)} – ${formatTime(day.close_time)}`
      : "";

  const second =
    day.second_open_time && day.second_close_time
      ? `${formatTime(day.second_open_time)} – ${formatTime(day.second_close_time)}`
      : "";

  return [first, second].filter(Boolean).join(" · ") || "Consultar";
};

const getInitials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const loadPage = async () => {
  loading.value = true;
  error.value = "";

  try {
    data.value = await publicPageService.getPublishedBySlug(String(route.params.slug || ""));
  } catch (err) {
    console.error(err);
    error.value = err.message || "Esta página no está disponible.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadPage);
</script>

<template>
  <div class="public-site">
    <div v-if="loading" class="public-state">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <div v-else-if="error" class="public-state public-state-error">
      <div class="state-mark">404</div>
      <h1>Página no disponible</h1>
      <p>{{ error }}</p>
      <RouterLink to="/" class="primary-button">Volver a Resbix</RouterLink>
    </div>

    <template v-else-if="business">
      <header class="site-header">
        <div class="header-shell">
          <a href="#inicio" class="brand">
            <img v-if="page.logo_url" :src="page.logo_url" :alt="business.name" class="brand-logo" />

            <span v-else class="brand-fallback">
              {{ business.name?.charAt(0)?.toUpperCase() }}
            </span>

            <strong>{{ business.name }}</strong>
          </a>

          <nav class="desktop-nav">
            <a v-if="page.show_services && services.length" href="#servicios">Servicios</a>
            <a v-if="page.show_team && employees.length" href="#equipo">Equipo</a>
            <a v-if="page.show_hours && openingHours.length" href="#horarios">Horario</a>
            <a v-if="page.show_about && page.about" href="#nosotros">Nosotros</a>
            <a v-if="page.show_contact" href="#contacto">Contacto</a>
          </nav>

          <button type="button" class="header-cta" @click="openChat()">
            Reservar / Consultar
          </button>
        </div>
      </header>

      <main>
        <section id="inicio" class="hero">
          <div class="hero-shell">
            <div class="hero-copy">
              <span class="hero-kicker">Atención online disponible</span>

              <h1>{{ heroTitle }}</h1>

              <p>{{ heroDescription }}</p>

              <div class="hero-actions">
                <button type="button" class="primary-button" @click="openChat()">
                  Hablar con el asistente
                  <span>→</span>
                </button>

                <a
                  v-if="page.show_services && services.length"
                  href="#servicios"
                  class="secondary-button">
                  Ver servicios
                </a>
              </div>

              <div class="hero-details">
                <span v-if="address">⌖ {{ address }}</span>
                <a v-if="phone" :href="`tel:${phone}`">☎ {{ phone }}</a>
              </div>
            </div>

            <div class="hero-visual">
              <img
                v-if="page.cover_image_url"
                :src="page.cover_image_url"
                :alt="business.name"
                class="cover-image" />

              <div v-else class="cover-placeholder">
                <div class="placeholder-mark">
                  {{ business.name?.charAt(0)?.toUpperCase() }}
                </div>

                <div>
                  <span>Bienvenido a</span>
                  <strong>{{ business.name }}</strong>
                </div>
              </div>

              <div class="availability-card">
                <span class="availability-dot"></span>
                <div>
                  <strong>Reserva y consulta online</strong>
                  <small>Nuestro asistente puede ayudarte ahora</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="page.show_services && services.length" id="servicios" class="section section-soft">
          <div class="section-shell">
            <div class="section-heading">
              <span>Servicios</span>
              <h2>Todo lo que podemos hacer por ti</h2>
              <p>Consulta nuestros servicios. Para disponibilidad y reservas, habla con el asistente.</p>
            </div>

            <div class="services-grid">
              <article v-for="service in services" :key="service.id" class="service-card">
                <div class="service-top">
                  <span class="service-icon">✦</span>

                  <strong v-if="formatPrice(service.price)" class="service-price">
                    {{ formatPrice(service.price) }}
                  </strong>
                </div>

                <h3>{{ service.name }}</h3>

                <p>{{ service.description || "Consulta todos los detalles con nuestro asistente." }}</p>

                <div class="service-footer">
                  <span v-if="service.duration_minutes">
                    {{ service.duration_minutes }} min
                  </span>

                  <button
                    type="button"
                    class="inline-chat-button"
                    @click="openChat(`Quiero información sobre ${service.name}`)">
                    Consultar
                    <span>→</span>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section v-if="page.show_team && employees.length" id="equipo" class="section">
          <div class="section-shell">
            <div class="section-heading">
              <span>Equipo</span>
              <h2>Conoce a nuestro equipo</h2>
              <p>Profesionales especializados para ofrecerte el servicio que necesitas.</p>
            </div>

            <div class="team-grid">
              <article v-for="employee in employees" :key="employee.id" class="team-card">
                <div class="team-avatar">
                  {{ getInitials(employee.name) }}
                </div>

                <h3>{{ employee.name }}</h3>

                <div v-if="employee.services?.length" class="team-services">
                  <span v-for="service in employee.services" :key="service.id">
                    {{ service.name }}
                  </span>
                </div>

                <button
                  type="button"
                  class="team-link"
                  @click="openChat(`Quiero consultar disponibilidad con ${employee.name}`)">
                  Consultar disponibilidad →
                </button>
              </article>
            </div>
          </div>
        </section>

        <section v-if="page.show_hours && openingHours.length" id="horarios" class="section section-dark">
          <div class="section-shell hours-layout">
            <div class="dark-heading">
              <span>Horario</span>
              <h2>¿Cuándo estamos abiertos?</h2>
              <p>
                Estos son nuestros horarios comerciales. La disponibilidad concreta de cada profesional
                puede variar.
              </p>

              <button type="button" class="light-button" @click="openChat('Quiero comprobar disponibilidad')">
                Comprobar disponibilidad
              </button>
            </div>

            <div class="hours-card">
              <div v-for="day in openingHours" :key="day.day_of_week" class="hours-row">
                <strong>{{ dayNames[day.day_of_week] }}</strong>
                <span :class="{ closed: day.is_closed }">{{ formatHours(day) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="page.show_about && page.about" id="nosotros" class="section">
          <div class="section-shell about-layout">
            <div class="section-heading about-heading">
              <span>Sobre nosotros</span>
              <h2>{{ business.name }}</h2>
            </div>

            <div class="about-copy">
              <p>{{ page.about }}</p>
            </div>
          </div>
        </section>

        <section v-if="page.show_contact" id="contacto" class="section contact-section">
          <div class="section-shell">
            <div class="contact-card">
              <div class="contact-copy">
                <span class="contact-kicker">Contacto</span>
                <h2>¿Hablamos?</h2>
                <p>
                  Puedes contactar directamente con nosotros o usar el asistente para resolver dudas y
                  gestionar tu reserva.
                </p>

                <button type="button" class="primary-button" @click="openChat()">
                  Abrir asistente
                  <span>→</span>
                </button>
              </div>

              <div class="contact-info">
                <a v-if="phone" :href="`tel:${phone}`" class="contact-item">
                  <span>Teléfono</span>
                  <strong>{{ phone }}</strong>
                </a>

                <a v-if="page.public_email" :href="`mailto:${page.public_email}`" class="contact-item">
                  <span>Email</span>
                  <strong>{{ page.public_email }}</strong>
                </a>

                <a
                  v-if="address"
                  :href="page.maps_url || undefined"
                  :target="page.maps_url ? '_blank' : undefined"
                  :rel="page.maps_url ? 'noopener noreferrer' : undefined"
                  class="contact-item">
                  <span>Dirección</span>
                  <strong>{{ address }}</strong>
                </a>

                <div v-if="hasSocialLinks" class="social-links">
                  <a
                    v-if="page.instagram_url"
                    :href="page.instagram_url"
                    target="_blank"
                    rel="noopener noreferrer">
                    Instagram
                  </a>

                  <a
                    v-if="page.facebook_url"
                    :href="page.facebook_url"
                    target="_blank"
                    rel="noopener noreferrer">
                    Facebook
                  </a>

                  <a
                    v-if="page.tiktok_url"
                    :href="page.tiktok_url"
                    target="_blank"
                    rel="noopener noreferrer">
                    TikTok
                  </a>

                  <a
                    v-if="page.website_url"
                    :href="page.website_url"
                    target="_blank"
                    rel="noopener noreferrer">
                    Web
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="section-shell footer-shell">
          <div>
            <strong>{{ business.name }}</strong>
            <span v-if="address">{{ address }}</span>
          </div>

          <span class="powered">Powered by Resbix</span>
        </div>
      </footer>

      <button type="button" class="chat-fab" aria-label="Abrir asistente" @click="openChat()">
        <span class="chat-fab-icon">✦</span>

        <span class="chat-fab-copy">
          <strong>¿Te ayudamos?</strong>
          <small>Pregunta o reserva</small>
        </span>
      </button>

      <PublicChatWidget
        ref="chatWidget"
        :business-id="business.id"
        :business-name="business.name" />
    </template>
  </div>
</template>

<style scoped>
.public-site {
  min-height: 100vh;
  background: #fff;
  color: #0f172a;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.header-shell,
.section-shell,
.hero-shell {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
}

.header-shell {
  min-height: 74px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  text-decoration: none;
}

.brand strong {
  overflow: hidden;
  max-width: 220px;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-logo,
.brand-fallback {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 11px;
}

.brand-logo {
  object-fit: cover;
}

.brand-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 23px;
  margin-left: auto;
}

.desktop-nav a {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.desktop-nav a:hover {
  color: #0f172a;
}

.header-cta,
.primary-button,
.secondary-button,
.light-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  font-weight: 750;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.header-cta {
  min-height: 40px;
  padding: 0 15px;
  background: #0f172a;
  color: #fff;
  font-size: 12px;
}

.hero {
  padding: 84px 0 92px;
  overflow: hidden;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(380px, 1.05fr);
  gap: 72px;
  align-items: center;
}

.hero-copy {
  max-width: 610px;
}

.hero-kicker,
.section-heading > span,
.dark-heading > span,
.contact-kicker {
  display: inline-block;
  margin-bottom: 13px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(46px, 6.2vw, 76px);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.hero-copy > p {
  max-width: 580px;
  margin: 25px 0 0;
  color: #64748b;
  font-size: 17px;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 32px;
}

.primary-button,
.secondary-button,
.light-button {
  min-height: 48px;
  padding: 0 19px;
  font-size: 13px;
}

.primary-button {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.18);
}

.primary-button:hover,
.header-cta:hover,
.light-button:hover {
  transform: translateY(-1px);
}

.secondary-button {
  border: 1px solid #dbe2ea;
  background: #fff;
  color: #0f172a;
}

.hero-details {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 25px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.hero-details a {
  color: inherit;
  text-decoration: none;
}

.hero-visual {
  position: relative;
  min-height: 510px;
}

.cover-image,
.cover-placeholder {
  width: 100%;
  height: 510px;
  border-radius: 26px;
}

.cover-image {
  display: block;
  object-fit: cover;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.15);
}

.cover-placeholder {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 38px;
  background:
    radial-gradient(circle at 20% 15%, rgba(96, 165, 250, 0.42), transparent 34%),
    radial-gradient(circle at 85% 75%, rgba(129, 140, 248, 0.35), transparent 36%),
    #0f172a;
  color: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.cover-placeholder::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 38px 38px;
}

.placeholder-mark {
  position: relative;
  z-index: 1;
  font-size: 90px;
  font-weight: 900;
  line-height: 1;
  opacity: 0.96;
}

.cover-placeholder > div:last-child {
  position: relative;
  z-index: 1;
  max-width: 250px;
  display: flex;
  flex-direction: column;
  text-align: right;
}

.cover-placeholder span {
  color: #cbd5e1;
  font-size: 13px;
}

.cover-placeholder strong {
  margin-top: 5px;
  font-size: 23px;
  line-height: 1.1;
}

.availability-card {
  position: absolute;
  left: -30px;
  bottom: 28px;
  display: flex;
  align-items: center;
  gap: 11px;
  max-width: 280px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.13);
  backdrop-filter: blur(14px);
}

.availability-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.availability-card div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.availability-card strong {
  font-size: 12px;
}

.availability-card small {
  color: #64748b;
  font-size: 10px;
}

.section {
  padding: 92px 0;
}

.section-soft {
  background: #f8fafc;
}

.section-heading {
  max-width: 650px;
  margin-bottom: 38px;
}

.section-heading h2,
.dark-heading h2,
.contact-copy h2 {
  margin: 0;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.section-heading p,
.dark-heading p,
.contact-copy p {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}

.service-card {
  min-height: 245px;
  display: flex;
  flex-direction: column;
  padding: 23px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
}

.service-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-icon {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 14px;
}

.service-price {
  color: #0f172a;
  font-size: 13px;
}

.service-card h3 {
  margin: 25px 0 0;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.service-card > p {
  margin: 9px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}

.service-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 22px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 650;
}

.service-footer a {
  color: #2563eb;
  text-decoration: none;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
}

.team-card {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
}

.team-avatar {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #0f172a;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
}

.team-card h3 {
  margin: 18px 0 0;
  font-size: 16px;
}

.team-services {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.team-services span {
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 10px;
  font-weight: 650;
}

.team-link {
  display: inline-block;
  margin-top: 20px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.section-dark {
  background: #0f172a;
  color: #fff;
}

.hours-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
  gap: 80px;
  align-items: center;
}

.dark-heading {
  max-width: 520px;
}

.dark-heading > span {
  color: #93c5fd;
}

.dark-heading p {
  color: #94a3b8;
}

.light-button {
  margin-top: 26px;
  background: #fff;
  color: #0f172a;
}

.hours-card {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
}

.hours-row {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  padding: 0 19px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.075);
}

.hours-row:last-child {
  border-bottom: 0;
}

.hours-row strong {
  font-size: 12px;
}

.hours-row span {
  color: #cbd5e1;
  font-size: 12px;
}

.hours-row span.closed {
  color: #64748b;
}

.about-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
  gap: 80px;
}

.about-heading {
  margin: 0;
}

.about-copy p {
  margin: 0;
  color: #475569;
  font-size: 17px;
  line-height: 1.9;
  white-space: pre-line;
}

.contact-section {
  padding-top: 40px;
}

.contact-card {
  display: grid;
  grid-template-columns: 1fr 0.85fr;
  gap: 70px;
  padding: 52px;
  border-radius: 24px;
  background: #f8fafc;
}

.contact-copy {
  max-width: 560px;
}

.contact-copy .primary-button {
  margin-top: 25px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 15px 0;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
  text-decoration: none;
}

.contact-item span {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.contact-item strong {
  font-size: 13px;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 20px;
}

.social-links a {
  padding: 7px 10px;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.site-footer {
  padding: 34px 0 95px;
  border-top: 1px solid #eef2f7;
}

.footer-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
}

.footer-shell > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.footer-shell strong {
  font-size: 13px;
}

.footer-shell div span,
.powered {
  color: #94a3b8;
  font-size: 10px;
}

.chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px 9px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 15px;
  background: #0f172a;
  color: #fff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.26);
  text-decoration: none;
}

.chat-fab-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #2563eb;
  font-size: 14px;
}

.chat-fab-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chat-fab-copy strong {
  font-size: 11px;
}

.chat-fab-copy small {
  color: #94a3b8;
  font-size: 9px;
}

.public-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px;
  text-align: center;
}

.public-state h1,
.public-state p {
  margin: 0;
}

.public-state p {
  max-width: 450px;
  color: #64748b;
  font-size: 13px;
}

.state-mark {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 980px) {
  .desktop-nav {
    display: none;
  }

  .header-cta {
    margin-left: auto;
  }

  .hero-shell {
    grid-template-columns: 1fr;
    gap: 45px;
  }

  .hero-copy {
    max-width: 720px;
  }

  .hero-visual {
    min-height: 440px;
  }

  .cover-image,
  .cover-placeholder {
    height: 440px;
  }

  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .team-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hours-layout,
  .about-layout,
  .contact-card {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

@media (max-width: 640px) {
  .header-shell,
  .section-shell,
  .hero-shell {
    width: min(100% - 30px, 1160px);
  }

  .header-shell {
    min-height: 66px;
  }

  .brand strong {
    max-width: 135px;
  }

  .header-cta {
    min-height: 36px;
    padding: 0 11px;
    font-size: 10px;
  }

  .hero {
    padding: 55px 0 66px;
  }

  .hero h1 {
    font-size: clamp(42px, 13vw, 58px);
  }

  .hero-copy > p {
    font-size: 15px;
  }

  .hero-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions a {
    width: 100%;
    box-sizing: border-box;
  }

  .hero-visual {
    min-height: 340px;
  }

  .cover-image,
  .cover-placeholder {
    height: 340px;
    border-radius: 20px;
  }

  .cover-placeholder {
    padding: 25px;
  }

  .placeholder-mark {
    font-size: 64px;
  }

  .cover-placeholder > div:last-child {
    max-width: 160px;
  }

  .cover-placeholder strong {
    font-size: 18px;
  }

  .availability-card {
    left: 14px;
    right: 14px;
    bottom: 14px;
    max-width: none;
  }

  .section {
    padding: 68px 0;
  }

  .services-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }

  .hours-layout {
    gap: 30px;
  }

  .hours-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
    padding: 13px 16px;
  }

  .contact-card {
    padding: 28px 22px;
    border-radius: 18px;
  }

  .footer-shell {
    align-items: flex-start;
    flex-direction: column;
  }

  .chat-fab {
    right: 14px;
    bottom: 14px;
  }
}

.header-cta,
.primary-button,
.light-button,
.team-link,
.inline-chat-button,
.chat-fab {
  font-family: inherit;
}

button.header-cta,
button.primary-button,
button.light-button,
button.team-link,
button.inline-chat-button,
button.chat-fab {
  cursor: pointer;
}

.inline-chat-button,
.team-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}

</style>
