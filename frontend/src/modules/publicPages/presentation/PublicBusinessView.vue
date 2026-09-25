<script setup>
import { computed, onMounted, onBeforeUnmount, nextTick, ref } from "vue";
import { useRoute } from "vue-router";

import { PublicPageService } from "../infrastructure/PublicPageService.js";
import PublicChatWidget from "./PublicChatWidget.vue";

const route = useRoute();
const publicPageService = new PublicPageService();

const data = ref(null);
const loading = ref(true);
const error = ref("");
const chatWidget = ref(null);
const bookingOpen = ref(false);
const mobileMenuOpen = ref(false);
const scrolled = ref(false);
let revealObserver = null;
function onScroll(){ scrolled.value = window.scrollY > 18; }
function closeMenu(){ mobileMenuOpen.value = false; }
async function initializeMotion(){
 await nextTick();
 if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
 revealObserver?.disconnect();
 revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) if(entry.isIntersecting){entry.target.classList.add("is-visible");revealObserver?.unobserve(entry.target);}
 }, { threshold: .11, rootMargin: "0px 0px -30px 0px" });
 document.querySelectorAll(".public-site .section-heading,.public-site .service-card,.public-site .team-card,.public-site .hours-card,.public-site .about-copy,.public-site .contact-card").forEach(el => {el.classList.add("reveal-on-scroll");revealObserver.observe(el);});
}

const bookingStep = ref(1);
const bookingLoading = ref(false);
const bookingSending = ref(false);
const bookingError = ref('');
const bookingDone = ref(false);
const slots = ref([]);
const selectedService = ref('');
const selectedEmployee = ref('');
const selectedDate = ref('');
const selectedTime = ref('');
const customerName = ref('');
const customerEmail = ref('');
const customerPhone = ref('');
const today = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const availableEmployees = computed(() => employees.value.filter(e => !selectedService.value || e.services?.some(s => s.id === selectedService.value)));
const selectedServiceData = computed(() => services.value.find(s => s.id === selectedService.value));
function openBooking(serviceId = '') {
  selectedService.value = serviceId;
  selectedEmployee.value = ''; selectedDate.value = ''; selectedTime.value = '';
  slots.value = []; bookingError.value = ''; bookingDone.value = false;
  bookingStep.value = serviceId ? 2 : 1;
  bookingOpen.value = true;
  document.body.style.overflow = 'hidden';
}
function closeBooking() { bookingOpen.value = false; document.body.style.overflow = ''; }
onBeforeUnmount(() => { document.body.style.overflow = ''; window.removeEventListener('scroll',onScroll); revealObserver?.disconnect(); });
async function bookingRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || json.message || 'No se ha podido completar la operación.');
  return json;
}
async function fetchSlots() {
  if (!selectedService.value || !selectedDate.value) return;
  bookingLoading.value = true; bookingError.value = ''; selectedTime.value = '';
  try {
    const params = new URLSearchParams({ serviceId: selectedService.value, date: selectedDate.value });
    if (selectedEmployee.value) params.set('employeeId', selectedEmployee.value);
    const result = await bookingRequest(`/public/pages/${encodeURIComponent(page.value.slug)}/availability?${params}`);
    const values = Array.isArray(result) ? result : result.slots || [];
    slots.value = values.map(item => typeof item === 'string' ? item : item.localTime || item.time || item.start_time || '').filter(Boolean);
  } catch (err) { bookingError.value = err.message; slots.value = []; }
  finally { bookingLoading.value = false; }
}
async function submitBooking() {
  if (!selectedTime.value || !customerName.value.trim() || !customerEmail.value.trim()) return;
  bookingSending.value = true; bookingError.value = '';
  try {
    await bookingRequest(`/public/pages/${encodeURIComponent(page.value.slug)}/bookings`, { method: 'POST', body: JSON.stringify({
      serviceId: selectedService.value, employeeId: selectedEmployee.value || null,
      date: selectedDate.value, time: selectedTime.value,
      customerName: customerName.value.trim(), customerEmail: customerEmail.value.trim(), customerPhone: customerPhone.value.trim() || null,
    }) });
    bookingDone.value = true;
  } catch (err) { bookingError.value = err.message; }
  finally { bookingSending.value = false; }
}


const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const business = computed(() => data.value?.business || null);
const safeColor = (value, fallback) => /^#[0-9a-fA-F]{6}$/.test(String(value || "")) ? value : fallback;
const allowedFonts = ["Inter", "Arial", "Georgia", "Verdana", "Trebuchet MS", "Tahoma"];
const siteTemplate = computed(() => ["editorial","studio","minimal"].includes(data.value?.page?.theme_template) ? data.value.page.theme_template : "editorial");
const siteLayout = computed(() => data.value?.page?.theme_hero_layout === "centered" ? "centered" : "split");
const themeStyle = computed(() => {
  const p = data.value?.page || {};
  const font = allowedFonts.includes(p.theme_font) ? p.theme_font : "Inter";
  const radius = Math.max(3, Math.min(28, Number(p.theme_radius) || 14));
  const buttonRadius = p.theme_button_style === "pill" ? 999 : p.theme_button_style === "square" ? 3 : radius;
  return {
    '--site-primary': safeColor(p.theme_primary, '#2563eb'),
    '--site-secondary': safeColor(p.theme_secondary, '#0f172a'),
    '--site-bg': safeColor(p.theme_background, '#ffffff'),
    '--site-surface': safeColor(p.theme_surface, '#f8fafc'),
    '--site-text': safeColor(p.theme_text, '#0f172a'),
    '--site-radius': `${radius}px`,
    '--site-button-radius': `${buttonRadius}px`,
    '--site-font': font === 'Inter' ? 'Inter, system-ui, sans-serif' : `${font}, sans-serif`,
    fontFamily: font === 'Inter' ? 'Inter, system-ui, sans-serif' : `${font}, sans-serif`,
  };
});
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
    if(data.value) initializeMotion();
  }
};

onMounted(() => {loadPage(); onScroll(); window.addEventListener("scroll",onScroll,{passive:true});});
</script>

<template>
  <div class="public-site" :class="['template-'+siteTemplate,'layout-'+siteLayout]" :style="themeStyle">
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
      <header class="site-header" :class="{'header-scrolled':scrolled}">
        <div class="header-shell">
          <a href="#inicio" class="brand">
            <img v-if="page.logo_url" :src="page.logo_url" :alt="business.name" class="brand-logo" />

            <span v-else class="brand-fallback">
              {{ business.name?.charAt(0)?.toUpperCase() }}
            </span>

            <strong>{{ business.name }}</strong>
          </a>

          <nav class="desktop-nav" aria-label="Navegación principal">
            <a v-if="page.show_services && services.length" href="#servicios">Servicios</a>
            <a v-if="page.show_team && employees.length" href="#equipo">Equipo</a>
            <a v-if="page.show_hours && openingHours.length" href="#horarios">Horario</a>
            <a v-if="page.show_about && page.about" href="#nosotros">Nosotros</a>
            <a v-if="page.show_contact" href="#contacto">Contacto</a>
          </nav>

          <button type="button" class="mobile-menu-toggle" :aria-expanded="mobileMenuOpen" aria-label="Abrir menú" @click="mobileMenuOpen=!mobileMenuOpen"><span></span><span></span></button>
          <button type="button" class="header-cta" @click="openBooking()">
            Reservar cita
          </button>
        </div>
        <Transition name="menu-drop"><nav v-if="mobileMenuOpen" class="mobile-nav" aria-label="Navegación móvil"><a v-if="page.show_services && services.length" href="#servicios" @click="closeMenu">Servicios <span>↗</span></a><a v-if="page.show_team && employees.length" href="#equipo" @click="closeMenu">Equipo <span>↗</span></a><a v-if="page.show_hours && openingHours.length" href="#horarios" @click="closeMenu">Horarios <span>↗</span></a><a v-if="page.show_about && page.about" href="#nosotros" @click="closeMenu">Nosotros <span>↗</span></a><a v-if="page.show_contact" href="#contacto" @click="closeMenu">Contacto <span>↗</span></a><button type="button" @click="closeMenu();openBooking()">Reservar una cita ↗</button></nav></Transition>
      </header>

      <main>
        <section id="inicio" class="hero">
          <div class="hero-shell">
            <div class="hero-copy">
              <span class="hero-kicker"><span class="kicker-line"></span> UN ESPACIO PARA TI <span class="hero-kicker-star">✳</span></span>

              <h1>{{ heroTitle }}</h1>

              <p>{{ heroDescription }}</p>

              <div class="hero-actions">
                <button type="button" class="primary-button booking-hero-button" @click="openBooking()">Reservar cita <span>↗</span></button>
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

            <div class="hero-visual"><span class="hero-visual-index">{{ business.name }} <span>↗</span></span>
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

              <div class="hero-photo-counter"><span>01</span><i></i><span>EXPERIENCIA</span></div>
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
              <span>01 / QUÉ HACEMOS</span>
              <h2>Una experiencia <em>pensada para ti.</em></h2>
              <p>Consulta nuestros servicios. Elige tu servicio y reserva directamente, o consulta con nuestro asistente.</p>
            </div>

            <div class="services-grid">
              <article v-for="service in services" :key="service.id" class="service-card">
                <div class="service-top">
                  <span class="service-icon">↗</span>

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

                  <button type="button" class="inline-chat-button reserve-link" @click="openBooking(service.id)">Reservar ↗</button>
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
              <span>02 / LAS PERSONAS</span>
              <h2>Las personas detrás <em>de cada detalle.</em></h2>
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
              <span>03 / PLANIFICA TU VISITA</span>
              <h2>¿Cuándo estamos abiertos?</h2>
              <p>
                Estos son nuestros horarios comerciales. La disponibilidad concreta de cada profesional
                puede variar.
              </p>

              <button type="button" class="light-button" @click="openBooking()">
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
              <span>04 / NUESTRA HISTORIA</span>
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
                <span class="contact-kicker">05 / HABLEMOS</span>
                <h2>Tu próxima experiencia <em>empieza aquí.</em></h2>
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
        :business-name="business.name" :theme="themeStyle" />
    
    <Teleport to="body">
      <Transition name="booking-pop">
        <div v-if="bookingOpen" class="booking-overlay" @click.self="closeBooking">
          <section class="booking-panel" role="dialog" aria-modal="true" aria-label="Reservar una cita" :style="themeStyle">
            <header class="booking-top"><div><span class="booking-eyebrow">RESERVA ONLINE</span><h2>{{ bookingDone ? '¡Reserva confirmada!' : 'Tu próxima cita empieza aquí' }}</h2><p>{{ business?.name }}</p></div><button class="booking-close" aria-label="Cerrar" @click="closeBooking">✕</button></header>
            <div v-if="bookingDone" class="booking-success"><span>✓</span><h3>¡Todo listo!</h3><p>Tu cita se ha registrado. Si has facilitado tu correo, recibirás la confirmación cuando el sistema de notificaciones esté configurado.</p><button class="primary-button" @click="closeBooking">Terminar</button></div>
            <div v-else class="booking-body">
              <div class="booking-steps"><span v-for="(name,n) in ['Servicio','Fecha y hora','Tus datos']" :key="name" :class="{active:bookingStep===n+1,completed:bookingStep>n+1}"><b>{{ bookingStep>n+1 ? '✓' : n+1 }}</b>{{ name }}</span></div><div class="booking-progress"><span v-for="n in 3" :key="n" :class="{active:bookingStep>=n}"></span></div>
              <div v-if="bookingStep===1"><h3>01. ¿Qué servicio necesitas?</h3><p>Selecciona el tratamiento o servicio.</p><div class="booking-options"><button v-for="service in services" :key="service.id" :class="{selected:selectedService===service.id}" @click="selectedService=service.id;selectedEmployee='';bookingStep=2"><strong>{{ service.name }}</strong><small>{{ service.duration_minutes ? service.duration_minutes + ' min' : '' }} · {{ formatPrice(service.price) || 'Consultar precio' }}</small><span>↗</span></button></div></div>
              <div v-else-if="bookingStep===2"><h3>02. Elige cuándo venir</h3><p>Selecciona profesional, fecha y hora disponible.</p><label class="booking-field">Profesional<select v-model="selectedEmployee" @change="selectedTime='';slots=[];if(selectedDate)fetchSlots()"><option value="">Cualquier profesional</option><option v-for="employee in availableEmployees" :key="employee.id" :value="employee.id">{{ employee.name }}</option></select></label><label class="booking-field">Fecha<input v-model="selectedDate" type="date" :min="today" @change="fetchSlots" /></label><div v-if="selectedDate" class="booking-times"><strong>Horarios disponibles</strong><span v-if="bookingLoading">Consultando disponibilidad...</span><span v-else-if="!slots.length && !bookingError">No hay horarios disponibles para esta selección.</span><div class="booking-time-grid"><button v-for="time in slots" :key="time" :class="{selected:selectedTime===time}" @click="selectedTime=time">{{ time }}</button></div></div></div>
              <form v-else @submit.prevent="submitBooking"><h3>03. Últimos detalles</h3><p>Introduce tus datos para confirmar la cita.</p><div class="booking-recap"><strong>{{ selectedServiceData?.name }}</strong><span>{{ selectedDate }} · {{ selectedTime }}</span></div><label class="booking-field">Nombre y apellidos<input v-model="customerName" maxlength="120" required autocomplete="name" placeholder="Tu nombre" /></label><label class="booking-field">Correo electrónico<input v-model="customerEmail" type="email" maxlength="254" required autocomplete="email" placeholder="nombre@correo.com" /></label><label class="booking-field">Teléfono (opcional)<input v-model="customerPhone" type="tel" maxlength="50" autocomplete="tel" placeholder="Tu teléfono" /></label><button class="primary-button booking-submit" :disabled="bookingSending">{{ bookingSending ? 'Confirmando...' : 'Confirmar reserva' }}</button></form>
              <div v-if="bookingError" class="booking-error" role="alert">{{ bookingError }}</div>
              <footer class="booking-controls"><button v-if="bookingStep>1" class="booking-back" @click="bookingStep--">← Volver</button><span v-else>Reserva directa y sencilla</span><button v-if="bookingStep===2" class="primary-button" :disabled="!selectedTime" @click="bookingStep=3">Continuar →</button></footer>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
    </template>
  </div>
</template>

<style scoped>
.public-site {
  min-height: 100vh;
  background: var(--site-bg);
  color: var(--site-text);
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
  color: var(--site-secondary);
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
  background: var(--site-secondary);
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
  color: var(--site-secondary);
}

.header-cta,
.primary-button,
.secondary-button,
.light-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--site-button-radius);
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
  background: var(--site-secondary);
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
  color: var(--site-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.hero h1 {
  margin: 0;
  color: var(--site-secondary);
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
  background: var(--site-primary);
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
  color: var(--site-secondary);
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
    var(--site-secondary);
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
  background: var(--site-surface);
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
  color: var(--site-primary);
  font-size: 14px;
}

.service-price {
  color: var(--site-secondary);
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
  color: var(--site-primary);
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
  background: var(--site-secondary);
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
  color: var(--site-primary);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.section-dark {
  background: var(--site-secondary);
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
  color: var(--site-secondary);
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
  background: var(--site-surface);
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
  color: var(--site-secondary);
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
  background: var(--site-secondary);
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
  background: var(--site-primary);
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
  color: var(--site-primary);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--site-primary);
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

/* Theme overrides */
.public-site{background:var(--site-bg);color:var(--site-text)}.site-header{background:var(--site-bg)}.brand,.brand strong,.hero h1,.section-heading h2,.contact-copy h2{color:var(--site-text)}.section-soft,.contact-card{background:var(--site-surface)}.section-dark,.brand-fallback,.team-avatar,.chat-fab{background:var(--site-secondary)}.primary-button,.service-icon,.chat-fab-icon{border-radius:var(--site-button-radius)}.primary-button,.chat-fab-icon{background:var(--site-primary)}.header-cta{background:var(--site-secondary);border-radius:var(--site-button-radius)}.secondary-button,.service-card,.team-card{background:var(--site-bg);border-radius:var(--site-radius)}.cover-image,.cover-placeholder{border-radius:var(--site-radius)}

/* V5 — premium interactions and accessible direct booking */
.public-site { scroll-behavior:smooth; }
.public-site .site-header { backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
.public-site .hero-copy > * { animation: rise-in .75s both cubic-bezier(.2,.8,.2,1); }
.public-site .hero-copy > :nth-child(2) { animation-delay:.09s; }
.public-site .hero-copy > :nth-child(3) { animation-delay:.18s; }
.public-site .hero-copy > :nth-child(4) { animation-delay:.27s; }
.public-site .hero-visual { animation: visual-in .9s .15s both cubic-bezier(.2,.8,.2,1); }
.public-site .service-card,.public-site .team-card { transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease; }
.public-site .service-card:hover,.public-site .team-card:hover { transform:translateY(-7px);box-shadow:0 24px 55px rgba(15,23,42,.1); }
.public-site .primary-button,.public-site .header-cta { transition:transform .2s ease,filter .2s ease,box-shadow .2s ease; }
.public-site .primary-button:hover,.public-site .header-cta:hover { transform:translateY(-2px);filter:brightness(1.08); }
.public-site :is(a,button,input,select):focus-visible { outline:3px solid var(--site-primary);outline-offset:3px; }
.public-site .reserve-link { margin-right:10px;font-weight:800; }
@keyframes rise-in {from {opacity:0;transform:translateY(26px)}to {opacity:1;transform:translateY(0)}}
@keyframes visual-in {from {opacity:0;transform:translateY(24px) scale(.96)}to {opacity:1;transform:translateY(0) scale(1)}}
.booking-overlay {position:fixed;inset:0;z-index:1500;background:rgba(10,18,32,.66);backdrop-filter:blur(9px);display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,sans-serif}
.booking-panel {width:min(580px,100%);max-height:min(780px,94dvh);overflow:auto;background:var(--site-bg,#fff);color:var(--site-text,#111827);border-radius:24px;box-shadow:0 32px 100px rgba(0,0,0,.24)}
.booking-top {display:flex;justify-content:space-between;align-items:start;gap:16px;padding:30px 32px 24px;border-bottom:1px solid #e7eaf0}
.booking-eyebrow {font-size:10px;letter-spacing:.16em;font-weight:900;color:var(--site-primary)}
.booking-top h2 {font-size:clamp(23px,4vw,30px);line-height:1.15;letter-spacing:-.04em;margin:8px 0}.booking-top p,.booking-body p {color:#64748b;margin:7px 0 22px;font-size:13px;line-height:1.6}
.booking-close {border:0;background:var(--site-surface,#f1f5f9);border-radius:12px;width:38px;height:38px;cursor:pointer;color:var(--site-text)}
.booking-body {padding:26px 32px 32px}.booking-body h3 {font-size:21px;letter-spacing:-.03em;margin:22px 0 0}.booking-progress {display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.booking-progress span {height:4px;border-radius:10px;background:#e2e8f0}.booking-progress .active {background:var(--site-primary)}
.booking-options {display:grid;gap:9px}.booking-options button {display:grid;grid-template-columns:1fr auto;gap:4px 14px;text-align:left;align-items:center;background:var(--site-surface);border:1px solid #e2e8f0;border-radius:13px;padding:15px 17px;cursor:pointer;color:var(--site-text);transition:.2s}.booking-options button:hover,.booking-options button.selected {border-color:var(--site-primary);transform:translateX(3px)}.booking-options strong {font-size:14px}.booking-options small {grid-column:1;color:#64748b}.booking-options button>span {grid-column:2;grid-row:1/3;color:var(--site-primary)}
.booking-field {display:grid;gap:8px;margin:16px 0;font-size:12px;font-weight:750}.booking-field input,.booking-field select {width:100%;min-height:48px;border:1px solid #dce3eb;border-radius:12px;padding:10px 13px;background:var(--site-bg);color:var(--site-text);font:inherit;font-weight:450;box-sizing:border-box}.booking-field input:focus,.booking-field select:focus {outline:2px solid var(--site-primary);outline-offset:1px}
.booking-times {display:grid;gap:12px;margin:20px 0}.booking-times>span {font-size:12px;color:#64748b}.booking-time-grid {display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.booking-time-grid button {border:1px solid #dce3eb;border-radius:10px;background:var(--site-surface);padding:11px 5px;cursor:pointer;color:var(--site-text)}.booking-time-grid button.selected {background:var(--site-primary);color:white;border-color:var(--site-primary)}
.booking-controls {display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #e7eaf0;margin-top:25px;padding-top:20px;font-size:11px;color:#64748b}.booking-back {background:none;border:0;cursor:pointer;color:var(--site-text);font-weight:750}.booking-controls .primary-button,.booking-submit {border:0;background:var(--site-primary);color:white;border-radius:var(--site-button-radius,12px);padding:13px 20px;cursor:pointer;font-weight:750}.booking-submit {width:100%;margin-top:10px}.booking-controls button:disabled {opacity:.4;cursor:not-allowed}.booking-recap {display:flex;justify-content:space-between;gap:12px;background:var(--site-surface);padding:15px;border-radius:12px;font-size:13px}.booking-recap span {color:#64748b}.booking-error {padding:12px;background:#fef2f2;color:#b91c1c;border-radius:10px;margin-top:15px;font-size:12px}.booking-success {text-align:center;padding:50px 30px}.booking-success>span {display:grid;place-items:center;margin:auto;width:70px;height:70px;border-radius:50%;background:#dcfce7;color:#15803d;font-size:34px}.booking-success h3 {font-size:25px}.booking-success p {color:#64748b;line-height:1.7}.booking-success .primary-button {margin-top:15px;border:0;background:var(--site-primary);color:#fff;padding:14px 28px;cursor:pointer}
.booking-pop-enter-active,.booking-pop-leave-active {transition:opacity .2s}.booking-pop-enter-from,.booking-pop-leave-to {opacity:0}.booking-pop-enter-active .booking-panel {animation:rise-in .28s both}
@media(max-width:600px){.booking-overlay {padding:0;align-items:end}.booking-panel {max-height:95dvh;border-radius:22px 22px 0 0}.booking-top,.booking-body {padding:22px}.booking-time-grid {grid-template-columns:repeat(3,1fr)}}
@media(prefers-reduced-motion:reduce){.public-site .hero-copy>*,.public-site .hero-visual,.booking-pop-enter-active .booking-panel {animation:none!important}.public-site .service-card,.public-site .team-card {transition:none}}

/* V6: three distinct art directions, shared booking engine */
.public-site{--site-muted:color-mix(in srgb,var(--site-text) 58%,var(--site-bg));--site-border:color-mix(in srgb,var(--site-text) 12%,transparent);isolation:isolate}.public-site :is(.section,.hero){scroll-margin-top:90px}.public-site .site-header{border-bottom:1px solid var(--site-border);background:color-mix(in srgb,var(--site-bg) 89%,transparent)}.public-site .desktop-nav a{color:var(--site-muted);transition:color .2s}.public-site .hero-kicker{display:inline-flex;align-items:center;gap:10px;letter-spacing:.19em}.kicker-line{height:1px;width:30px;background:currentColor}.hero-visual-index{position:absolute;top:20px;right:20px;z-index:2;background:color-mix(in srgb,var(--site-bg) 91%,transparent);color:var(--site-text);padding:9px 12px;letter-spacing:.15em;font-size:9px;font-weight:800;border-radius:var(--site-radius)}.public-site .section-heading h2 em,.public-site .contact-copy h2 em{font-style:normal;color:var(--site-primary)}.public-site .service-card,.public-site .team-card{border-color:var(--site-border);overflow:hidden;position:relative}.public-site .service-card::before{content:'';height:3px;position:absolute;top:0;left:0;right:100%;background:var(--site-primary);transition:right .4s}.public-site .service-card:hover::before{right:0}.public-site .service-card h3{font-size:21px}.public-site .service-card>p{font-size:13px}.public-site .service-price{font-size:16px}.public-site .service-icon{background:var(--site-surface);border:1px solid var(--site-border);font-size:19px}.public-site .contact-card{border:1px solid var(--site-border)}.public-site .section-heading p{max-width:510px}.public-site .hero-details{color:var(--site-muted)}.public-site .secondary-button{background:transparent;border-color:var(--site-border);color:var(--site-text)}
/* Editorial: airy, asymmetric, magazine-like */
.template-editorial{--display-font:Georgia,'Times New Roman',serif}.template-editorial .hero{padding:105px 0 115px;background:radial-gradient(circle at 0 90%,color-mix(in srgb,var(--site-primary) 9%,transparent),transparent 43%)}.template-editorial .hero-shell{gap:clamp(35px,6vw,100px)}.template-editorial .hero h1{font-family:var(--display-font);font-weight:400;letter-spacing:-.065em;font-size:clamp(54px,6.7vw,105px);line-height:1.02}.template-editorial .hero-visual{transform:rotate(1.5deg)}.template-editorial .cover-image,.template-editorial .cover-placeholder{height:590px;border-radius:2px}.template-editorial .section-heading h2,.template-editorial .dark-heading h2,.template-editorial .contact-copy h2{font-family:var(--display-font);font-weight:400;font-size:clamp(40px,5vw,68px);line-height:1.06}.template-editorial .section-heading h2 em,.template-editorial .contact-copy h2 em{font-style:italic}.template-editorial .service-card{border-radius:2px;padding:31px;min-height:290px}.template-editorial .team-card{border-radius:2px}.template-editorial .contact-card{border-radius:3px}.template-editorial .hero-kicker{color:var(--site-primary)}
/* Studio: strong hierarchy, graphic layout, punchy CTAs */
.template-studio{--display-font:Montserrat,Inter,system-ui,sans-serif}.template-studio .hero{padding:100px 0;background:var(--site-secondary);color:#fff}.template-studio .hero h1{color:#fff;font-family:var(--display-font);font-weight:950;text-transform:uppercase;letter-spacing:-.085em;font-size:clamp(56px,7.3vw,108px);line-height:.9}.template-studio .hero-copy>p{color:#d2d7d7}.template-studio .hero-kicker{color:var(--site-primary)}.template-studio .hero-details{color:#d2d7d7}.template-studio .cover-image,.template-studio .cover-placeholder{border-radius:0;clip-path:polygon(8% 0,100% 0,100% 92%,92% 100%,0 100%,0 8%)}.template-studio .availability-card{border-radius:0}.template-studio .section-heading h2,.template-studio .dark-heading h2,.template-studio .contact-copy h2{font-family:var(--display-font);font-weight:950;text-transform:uppercase;letter-spacing:-.075em;font-size:clamp(39px,5vw,67px);line-height:.96}.template-studio .service-card{border-radius:0;border-width:2px;padding:28px}.template-studio .service-card h3{font-size:24px;text-transform:uppercase;font-weight:900}.template-studio .team-card,.template-studio .contact-card,.template-studio .hours-card{border-radius:0}.template-studio .primary-button{color:var(--site-secondary);font-weight:900}.template-studio .section-heading>span{letter-spacing:.22em}.template-studio .header-cta{border:1px solid var(--site-primary);background:var(--site-primary);color:var(--site-secondary)}
/* Minimal: soft rhythm, reduced chrome, calm typography */
.template-minimal .hero{padding:130px 0;background:var(--site-bg)}.template-minimal .hero-shell{gap:95px}.template-minimal .hero h1{font-size:clamp(51px,5.6vw,80px);font-weight:450;letter-spacing:-.075em;line-height:1.08}.template-minimal .hero-visual{min-height:470px}.template-minimal .cover-image,.template-minimal .cover-placeholder{height:470px;border-radius:180px 180px 14px 14px}.template-minimal .availability-card{border-radius:999px;padding:18px 24px}.template-minimal .section{padding:120px 0}.template-minimal .section-heading{margin-bottom:55px}.template-minimal .section-heading h2,.template-minimal .dark-heading h2,.template-minimal .contact-copy h2{font-size:clamp(37px,4.2vw,56px);font-weight:450;letter-spacing:-.055em}.template-minimal .service-card{min-height:275px;padding:33px;border-radius:22px}.template-minimal .team-card{border-radius:22px;padding:30px}.template-minimal .contact-card{border-radius:30px;padding:65px}.template-minimal .service-icon{border-radius:50%}.template-minimal .hero-kicker{letter-spacing:.22em}
/* Optional centered hero, supported by all three templates */
.layout-centered .hero-shell{display:flex;flex-direction:column;text-align:center;gap:48px}.layout-centered .hero-copy{max-width:890px;display:flex;flex-direction:column;align-items:center}.layout-centered .hero-actions,.layout-centered .hero-details{justify-content:center}.layout-centered .hero-visual{width:min(920px,100%);min-height:0}.layout-centered .cover-image,.layout-centered .cover-placeholder{height:clamp(300px,48vw,550px)}.layout-centered.template-editorial .hero-visual{transform:none}.layout-centered.template-minimal .cover-image,.layout-centered.template-minimal .cover-placeholder{border-radius:240px 240px 20px 20px}
/* Booking: clear progress, readable inputs, cohesive brand */
.booking-steps{display:flex;justify-content:space-between;gap:6px;margin-bottom:15px}.booking-steps>span{display:flex;align-items:center;gap:6px;color:#94a3b8;font-size:11px;font-weight:700}.booking-steps b{display:grid;place-items:center;width:24px;height:24px;border:1px solid #cbd5e1;border-radius:50%;font-size:10px}.booking-steps .active{color:var(--site-primary)}.booking-steps .active b,.booking-steps .completed b{border-color:var(--site-primary);background:var(--site-primary);color:white}.booking-options button:focus-visible,.booking-time-grid button:focus-visible{outline:3px solid var(--site-primary);outline-offset:2px}.booking-options button.selected{background:var(--site-surface)}.booking-time-grid button:hover{border-color:var(--site-primary)}.booking-panel{border:1px solid var(--site-border)}.booking-top{background:var(--site-surface)}
@media(max-width:980px){.template-editorial .hero,.template-minimal .hero{padding:65px 0}.template-editorial .hero-visual{transform:none}.template-editorial .cover-image,.template-editorial .cover-placeholder,.template-minimal .cover-image,.template-minimal .cover-placeholder{height:440px}.template-minimal .hero-shell{gap:40px}.template-minimal .section{padding:78px 0}}@media(max-width:640px){.template-editorial .hero h1,.template-studio .hero h1,.template-minimal .hero h1{font-size:clamp(43px,11vw,65px)}.template-editorial .cover-image,.template-editorial .cover-placeholder,.template-minimal .cover-image,.template-minimal .cover-placeholder{height:350px}.template-editorial .section-heading h2,.template-studio .section-heading h2,.template-minimal .section-heading h2{font-size:clamp(35px,9vw,50px)}.booking-steps>span{font-size:9px}.booking-steps b{width:20px;height:20px}.template-minimal .contact-card{padding:30px 22px}.public-site .hero-actions button{width:100%}.template-studio .hero{padding:60px 0}}
@media(prefers-reduced-motion:reduce){.public-site *, .public-site *::before,.public-site *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}

/* RESBIX V7 / signature interaction layer */
.public-site{overflow:clip;scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
.public-site :is(a,button,input,select):focus-visible{outline:3px solid var(--site-primary);outline-offset:4px}
.public-site :is(button,a){-webkit-tap-highlight-color:transparent}
.public-site .site-header{transition:background .35s,border-color .35s,box-shadow .35s}
.public-site .header-scrolled{box-shadow:0 14px 45px #1118270c;border-color:color-mix(in srgb,var(--site-secondary) 10%,transparent)}
.public-site .header-shell{min-height:86px;transition:min-height .3s}
.public-site .header-scrolled .header-shell{min-height:68px}
.public-site .brand strong{font-size:17px;letter-spacing:-.045em}
.public-site .desktop-nav a{position:relative;transition:color .2s}
.public-site .desktop-nav a:after{content:"";position:absolute;bottom:-9px;left:0;right:100%;height:2px;background:var(--site-primary);transition:right .25s}
.public-site .desktop-nav a:hover:after{right:0}
.public-site .hero{position:relative;isolation:isolate}
.public-site .hero:before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:radial-gradient(color-mix(in srgb,var(--site-text) 13%,transparent) .6px,transparent .6px);background-size:20px 20px;opacity:.17;mask-image:linear-gradient(120deg,#000,transparent 65%)}
.public-site .hero-copy{animation:signature-rise .8s cubic-bezier(.2,.7,.2,1) both}
.public-site .hero-visual{animation:signature-image 1s .13s cubic-bezier(.2,.7,.2,1) both}
.public-site .hero h1{text-wrap:balance}
.public-site .hero-copy>p{max-width:560px;line-height:1.85}
.public-site .hero-kicker{letter-spacing:.22em;font-size:11px}
.hero-kicker-star{font-size:19px;margin-left:8px}
.public-site .hero-actions{gap:12px}
.public-site .hero-actions :is(button,a){transition:transform .25s,box-shadow .25s,background .25s}
.public-site .hero-actions :is(button,a):hover{transform:translateY(-4px)}
.public-site .hero-visual{isolation:isolate}
.public-site .hero-visual:before{content:"";position:absolute;inset:18px -18px -18px 18px;border:1px solid color-mix(in srgb,var(--site-primary) 40%,transparent);z-index:-1;pointer-events:none}
.public-site .cover-image{transition:transform 1s cubic-bezier(.2,.7,.2,1);filter:saturate(.85)}
.public-site .hero-visual:hover .cover-image{transform:scale(1.045);filter:saturate(1)}
.hero-photo-counter{position:absolute;bottom:18px;left:18px;display:flex;align-items:center;gap:10px;color:white;background:#121b22a8;backdrop-filter:blur(12px);padding:10px 14px;z-index:2;font-size:10px;letter-spacing:.14em}
.hero-photo-counter span:first-child{font-size:18px;letter-spacing:-.05em}.hero-photo-counter i{height:1px;width:24px;background:#fff9}
.public-site .section{position:relative}
.public-site .section-heading>span,.public-site .dark-heading>span,.public-site .contact-kicker{font-size:11px;letter-spacing:.2em;font-weight:750}
.public-site .section-heading h2{text-wrap:balance}
.public-site .service-card{position:relative;overflow:hidden;transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s,border-color .4s}
.public-site .service-card:before{content:"";position:absolute;top:0;left:0;width:100%;height:3px;background:var(--site-primary);transform:scaleX(0);transform-origin:left;transition:transform .45s}
.public-site .service-card:hover{transform:translateY(-9px);box-shadow:0 28px 65px #10182815;border-color:color-mix(in srgb,var(--site-primary) 35%,transparent)}
.public-site .service-card:hover:before{transform:scaleX(1)}
.public-site .service-icon{transition:transform .35s}.public-site .service-card:hover .service-icon{transform:rotate(45deg)}
.public-site .team-card{transition:transform .35s,box-shadow .35s}.public-site .team-card:hover{transform:translateY(-6px);box-shadow:0 22px 48px #10182810}
.public-site .contact-card{position:relative;overflow:hidden}.public-site .contact-card:after{content:"✳";position:absolute;right:-25px;bottom:-105px;font-size:320px;line-height:1;color:var(--site-primary);opacity:.035;pointer-events:none}
.public-site .reveal-on-scroll{opacity:0;transform:translateY(30px);transition:opacity .75s cubic-bezier(.2,.7,.2,1),transform .75s cubic-bezier(.2,.7,.2,1)}
.public-site .reveal-on-scroll.is-visible{opacity:1;transform:translateY(0)}
.public-site .service-card:nth-child(2),.public-site .team-card:nth-child(2){transition-delay:.09s}
.public-site .service-card:nth-child(3),.public-site .team-card:nth-child(3){transition-delay:.17s}
.mobile-menu-toggle{display:none;border:0;background:transparent;padding:12px;cursor:pointer;flex-direction:column;gap:6px;margin-left:auto}
.mobile-menu-toggle span{display:block;width:24px;height:2px;background:var(--site-secondary)}
.mobile-nav{display:none}
.menu-drop-enter-active,.menu-drop-leave-active{transition:opacity .25s,transform .25s}.menu-drop-enter-from,.menu-drop-leave-to{opacity:0;transform:translateY(-10px)}
@keyframes signature-rise{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:translateY(0)}}
@keyframes signature-image{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:820px){.public-site .desktop-nav{display:none}.mobile-menu-toggle{display:flex}.mobile-nav{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;padding:16px 24px 26px;background:var(--site-bg);box-shadow:0 20px 40px #10182817;border-bottom:1px solid #8882}.mobile-nav a{display:flex;justify-content:space-between;padding:14px 4px;border-bottom:1px solid #8882;color:var(--site-text);text-decoration:none;font-size:17px;font-weight:650}.mobile-nav button{margin-top:18px;background:var(--site-primary);border:0;color:#fff;padding:15px;font-weight:700}.public-site .header-shell{min-height:72px}.public-site .header-scrolled .header-shell{min-height:65px}}
@media(max-width:640px){.public-site .hero-visual:before{inset:10px -8px -10px 8px}.public-site .hero-actions{align-items:stretch}.public-site .hero h1{text-wrap:pretty}.hero-photo-counter{bottom:12px;left:12px}.public-site .service-card:hover,.public-site .team-card:hover{transform:none}}
@media(prefers-reduced-motion:reduce){.public-site *{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}.public-site .reveal-on-scroll{opacity:1;transform:none}}

</style>
