<script setup>
import { ref } from "vue";

const menuOpen = ref(false);
const activeFaq = ref(null);
const previewTab = ref("dashboard");
const dashboardTab = ref("reservas");
const logoFailed = ref(false);
// Coloca tu logo en frontend/public/resbix-logo.svg (o cambia esta ruta).
const logoSrc = "/resbix-logo.png";
const faqs = [
  {
    q: "¿Qué hace exactamente Resbix?",
    a: "Resbix combina un agente de IA con herramientas para gestionar consultas, oportunidades comerciales y reservas desde un mismo panel.",
  },
  {
    q: "¿Necesito conocimientos técnicos?",
    a: "No. Configuras los datos de tu negocio, servicios, horarios e instrucciones desde tu panel.",
  },
  {
    q: "¿Puedo atender personalmente una conversación?",
    a: "Sí. Puedes tomar el control de una conversación cuando sea necesaria atención humana.",
  },
  {
    q: "¿Incluye una página web para mi negocio?",
    a: "Sí. El plan incluye una página pública para presentar tu negocio, mostrar información y facilitar el contacto y las reservas según las funciones habilitadas.",
  },
  {
    q: "¿Puedo gestionar mis reservas manualmente?",
    a: "Sí. Puedes consultar y gestionar las reservas desde el panel, además de las que gestione el agente.",
  },
  {
    q: "¿Qué ocurre después del primer año de la oferta?",
    a: "La promoción de los primeros 20 clientes es de 55 €/mes durante los primeros 12 meses. Después se aplica la tarifa habitual de 110 €/mes.",
  },
  {
    q: "¿La promoción se aplica automáticamente?",
    a: "La promoción está limitada a los primeros 20 clientes. La disponibilidad y las condiciones definitivas deben confirmarse antes de contratar.",
  },
];
const features = [
  {
    icon: "✳",
    tag: "ATENCIÓN AUTOMÁTICA",
    title: "Tu negocio responde incluso cuando tú no puedes.",
    text: "El agente utiliza la información de tu negocio para responder consultas sobre servicios, precios, disponibilidad y horarios.",
    color: "violet",
  },
  {
    icon: "▦",
    tag: "RESERVAS",
    title: "Menos mensajes. Más citas organizadas.",
    text: "Centraliza tus reservas, gestiona horarios y empleados y modifica las citas desde tu panel.",
    color: "blue",
  },
  {
    icon: "↗",
    tag: "OPORTUNIDADES",
    title: "Que ninguna conversación interesante se pierda.",
    text: "Recoge los datos de las personas interesadas y consulta tus leads cuando los necesites.",
    color: "mint",
  },
  {
    icon: "↔",
    tag: "CONTROL HUMANO",
    title: "La IA te ayuda. Tú mantienes el control.",
    text: "Intervén cuando sea necesario y continúa una conversación sin perder su contexto.",
    color: "orange",
  },
];
const steps = [
  {
    n: "01",
    title: "Creamos tu espacio",
    subtitle: "Tu negocio en Resbix",
    text: "Accede a tu panel y añade el nombre, descripción, ubicación, datos de contacto y horarios de tu negocio. Toda esa información será la base de lo que responderá tu agente.",
    tags: ["Información del negocio", "Horarios", "Datos de contacto"],
  },
  {
    n: "02",
    title: "Configuras servicios y equipo",
    subtitle: "Disponibilidad organizada",
    text: "Da de alta tus servicios con duración y precio, incorpora a tus empleados y asigna qué servicios realiza cada uno. Define sus horarios para que la disponibilidad se ajuste a tu negocio.",
    tags: ["Servicios y precios", "Empleados", "Horarios de trabajo"],
  },
  {
    n: "03",
    title: "Personalizas tu agente de IA",
    subtitle: "Habla como tu marca",
    text: "Elige su saludo, tono de comunicación e instrucciones. El agente utiliza la información configurada para responder preguntas y ayudar a tus clientes sin que tengas que repetir siempre lo mismo.",
    tags: ["Saludo", "Tono", "Instrucciones"],
  },
  {
    n: "04",
    title: "Compartes tu web pública",
    subtitle: "Tu escaparate digital",
    text: "Tus clientes encuentran tu negocio, consultan sus servicios y pueden iniciar una conversación con el agente. La reserva directa desde la web estará disponible cuando se habilite esa función.",
    tags: ["Web pública", "Agente integrado", "Información accesible"],
  },
  {
    n: "05",
    title: "Resbix atiende y organiza",
    subtitle: "Del mensaje a la gestión",
    text: "El agente responde a las consultas, ayuda a gestionar las reservas disponibles y recoge los datos de los clientes interesados. Tú puedes crear, editar y cancelar citas manualmente desde el panel.",
    tags: ["Conversaciones", "Reservas", "Leads"],
  },
  {
    n: "06",
    title: "Tú supervisas todo",
    subtitle: "Siempre tienes el control",
    text: "Entra al dashboard para consultar reservas, contactos y conversaciones. Cuando una consulta necesita tu atención, puedes intervenir y continuar la conversación personalmente.",
    tags: ["Panel centralizado", "Control humano", "Seguimiento"],
  },
];
const sectors = [
  "Peluquerías y barberías",
  "Centros de estética",
  "Clínicas y consultas",
  "Academias",
  "Entrenadores",
  "Negocios de servicios",
];
const closeMenu = () => {
  menuOpen.value = false;
};
</script>

<template>
  <div class="landing">
    <div class="announcement">
      <span class="announcement-dot"></span> OFERTA DE LANZAMIENTO
      <span class="announcement-divider">/</span> Primeros 20 clientes:
      <b>55 €/mes el primer año | CODIGO: FOUNDERS50</b>
      <a href="#precios">Ver oferta <span>↗</span></a>
    </div>
    <header class="navbar">
      <div class="container nav-inner">
        <RouterLink to="/" class="brand" @click="closeMenu">
          <img v-if="!logoFailed" :src="logoSrc" alt="" class="brand-logo" @error="logoFailed = true" />
          <span v-else class="brand-symbol">✳</span>
          <span>Resbix<span class="brand-period">.</span></span>
        </RouterLink>
        <nav class="nav-links" aria-label="Navegación principal">
          <a href="#producto">Producto</a><a href="#demo">Ver demo</a
          ><a href="#funcionamiento">Cómo funciona</a><a href="#sectores">Para quién</a
          ><a href="#precios">Precios</a>
        </nav>
        <div class="nav-actions">
          <RouterLink to="/login" class="nav-login">Iniciar sesión</RouterLink
          ><RouterLink to="/register" class="button button-dark nav-register"
            >Empezar ahora <span>↗</span></RouterLink
          >
        </div>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-label="Abrir navegación"
          @click="menuOpen = !menuOpen">
          {{ menuOpen ? "✕" : "☰" }}
        </button>
      </div>
      <nav v-if="menuOpen" class="mobile-nav" aria-label="Navegación móvil">
        <a href="#producto" @click="closeMenu">Producto</a><a href="#demo" @click="closeMenu">Ver demo</a> ><a
          href="#funcionamiento"
          @click="closeMenu"
          >Cómo funciona</a
        ><a href="#sectores" @click="closeMenu">Para quién</a><a href="#precios" @click="closeMenu">Precios</a
        ><RouterLink to="/login" @click="closeMenu">Iniciar sesión</RouterLink
        ><RouterLink to="/register" class="mobile-cta" @click="closeMenu">Empezar ahora ↗</RouterLink>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="hero-orb orb-one"></div>
        <div class="hero-orb orb-two"></div>
        <div class="container hero-grid">
          <div class="hero-copy">
            <div class="eyebrow"><span class="pulse"></span> TU NEGOCIO, SIEMPRE EN MARCHA</div>
            <h1>Tu próximo cliente no debería <em>esperar.</em></h1>
            <p class="hero-lead">
              Conoce al agente de IA que atiende consultas, ayuda con las reservas y convierte conversaciones
              en oportunidades. Todo conectado a tu negocio, desde un solo panel.
            </p>
            <div class="hero-buttons">
              <RouterLink to="/register" class="button button-primary"
                >Quiero mi agente <span>↗</span></RouterLink
              ><a href="#demo" class="button button-outline">Ver Resbix por dentro <span>↓</span></a>
            </div>
            <div class="hero-checks">
              <span>✓ Configuración sencilla</span><span>✓ Control humano</span
              ><span>✓ Reservas y leads</span>
            </div>
            <a class="hero-offer" href="#precios"
              ><span class="offer-gift">✦</span
              ><span
                ><b>50% de descuento durante 12 meses</b
                ><small>Oferta de lanzamiento para los primeros 20 clientes</small></span
              ><span class="offer-arrow">↗</span></a
            >
          </div>
          <div class="hero-art" aria-label="Vista ilustrativa de las funcionalidades de Resbix">
            <div class="art-grid"></div>
            <div class="art-glow"></div>
            <div class="floating-tag tag-top">
              <span class="tag-icon">✳</span
              ><span>Tu agente está preparado <small>Atención automatizada</small></span
              ><span class="tag-live"></span>
            </div>
            <div class="mock-window">
              <div class="mock-top">
                <span class="mock-dots"><i></i><i></i><i></i></span><span>Vista de ejemplo · Resbix</span
                ><span>↗</span>
              </div>
              <div class="mock-body">
                <div class="mock-header">
                  <span class="mock-logo">✳</span
                  ><span
                    ><b>Tu asistente virtual</b><small><i></i> Disponible para ayudarte</small></span
                  ><span class="mock-ellipsis">···</span>
                </div>
                <div class="mock-messages">
                  <span class="mock-day">HOY</span>
                  <div class="bubble assistant">¡Hola! 👋 ¿En qué puedo ayudarte hoy?</div>
                  <div class="bubble visitor">Hola, ¿tenéis hueco para un corte mañana?</div>
                  <div class="bubble assistant">
                    ¡Claro! Puedo ayudarte a consultar la disponibilidad. ¿Prefieres por la mañana o por la
                    tarde?
                  </div>
                  <div class="bubble visitor">Por la tarde, gracias.</div>
                  <div class="typing"><i></i><i></i><i></i></div>
                </div>
                <div class="mock-input">Escribe tu mensaje... <span>↑</span></div>
              </div>
            </div>
            <div class="floating-tag tag-bottom">
              <span class="tag-icon green">↗</span
              ><span>Una nueva oportunidad <small>Contacto recogido por tu agente</small></span
              ><span class="tag-check">✓</span>
            </div>
          </div>
        </div>
        <div class="container hero-bottom">
          <span>MENOS TAREAS REPETITIVAS.</span><span> MÁS TIEMPO PARA TU NEGOCIO.</span
          ><span class="hero-bottom-line"></span><span>01 / 04</span>
        </div>
      </section>

      <section class="sector-ribbon">
        <div class="container">
          <p>PENSADO PARA NEGOCIOS QUE TRABAJAN CON PERSONAS</p>
          <div class="ribbon-items">
            <span v-for="sector in sectors" :key="sector">{{ sector }}</span>
          </div>
        </div>
      </section>

      <section id="producto" class="section product-section">
        <div class="container">
          <div class="section-intro">
            <div>
              <span class="kicker">01 / EL PRODUCTO</span>
              <h2>No necesitas otro chatbot.<br /><span>Necesitas que pasen cosas.</span></h2>
            </div>
            <p>
              Resbix no se limita a responder preguntas. Conecta la atención al cliente con las herramientas
              que utilizas para organizar tu negocio.
            </p>
          </div>
          <div class="features-grid">
            <article
              v-for="(feature, i) in features"
              :key="feature.title"
              class="feature"
              :class="['feature-' + feature.color, { 'feature-wide': i === 0 }]">
              <div class="feature-top">
                <span class="feature-icon">{{ feature.icon }}</span
                ><span class="feature-index">0{{ i + 1 }}</span>
              </div>
              <div class="feature-copy">
                <span class="feature-tag">{{ feature.tag }}</span>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.text }}</p>
              </div>
              <div v-if="i === 0" class="feature-chat">
                <div class="feature-chat-row">
                  <span>Cliente</span><b>¿Cuánto cuesta y cuándo tenéis hueco?</b>
                </div>
                <div class="feature-chat-row agent">
                  <span>✳ Resbix</span><b>Te ayudo con los precios y consultamos la disponibilidad.</b>
                </div>
              </div>
              <div v-if="i === 1" class="feature-detail">
                <span>PRÓXIMAS CITAS</span>
                <div><b>09:30</b><span>Corte de pelo</span><i>Confirmada</i></div>
                <div><b>11:00</b><span>Tratamiento</span><i>Confirmada</i></div>
              </div>
              <div v-if="i === 2" class="feature-detail">
                <span>NUEVO CONTACTO</span>
                <div>
                  <b class="contact-avatar">AM</b
                  ><span>Andrea Martínez<small>Interesada en tus servicios</small></span
                  ><i>Nuevo</i>
                </div>
              </div>
              <div v-if="i === 3" class="feature-detail handoff-detail">
                <span>CONTROL DE CONVERSACIÓN</span>
                <div><b>✳</b><span>Agente IA</span><i>Atendiendo</i></div>
                <div><b>↳</b><span>Tu equipo</span><i>Disponible</i></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="statement-section">
        <div class="container statement-inner">
          <span class="kicker kicker-light">MENOS FRICCIÓN. MÁS OPORTUNIDADES.</span>
          <h2>Mientras tú te ocupas del negocio, <em>Resbix se ocupa de la primera conversación.</em></h2>
          <div class="statement-bottom">
            <p>Respuestas, reservas, leads y atención humana en un mismo espacio de trabajo.</p>
            <RouterLink to="/register" class="button button-white">Empezar con Resbix ↗</RouterLink>
          </div>
        </div>
        <div class="statement-deco">✳</div>
      </section>

      <!-- Demostración visual: datos ilustrativos, sin acceso a cuentas reales -->
      <section id="demo" class="section showcase-section">
        <div class="container">
          <div class="showcase-heading">
            <div>
              <span class="kicker">02 / CONOCE RESBIX POR DENTRO</span>
              <h2>No te lo imagines.<br /><span>Mira cómo se utiliza.</span></h2>
            </div>
            <p>
              Explora una representación interactiva del panel de gestión y de la página que verán tus
              clientes. Los nombres y las citas son ejemplos ilustrativos.
            </p>
          </div>
          <div class="preview-switch" role="tablist" aria-label="Vistas del producto">
            <button
              type="button"
              role="tab"
              :aria-selected="previewTab === 'dashboard'"
              :class="{ selected: previewTab === 'dashboard' }"
              @click="previewTab = 'dashboard'">
              ▦ &nbsp; Panel de tu negocio
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="previewTab === 'website'"
              :class="{ selected: previewTab === 'website' }"
              @click="previewTab = 'website'">
              ↗ &nbsp; Tu web + agente IA
            </button>
          </div>
          <div v-if="previewTab === 'dashboard'" class="preview-layout">
            <div class="product-frame dashboard-frame">
              <div class="browser-bar">
                <span class="browser-dots"><i></i><i></i><i></i></span
                ><span class="browser-url">app.resbix · Panel de ejemplo</span><span>↗</span>
              </div>
              <div class="app-shell">
                <aside class="app-sidebar">
                  <div class="app-brand"><span>✳</span> resbix.</div>
                  <div class="app-business">✂ &nbsp; Estudio Aura <small>Mi negocio</small></div>
                  <button
                    v-for="item in [
                      'Resumen',
                      'Reservas',
                      'Conversaciones',
                      'Leads',
                      'Servicios',
                      'Empleados',
                    ]"
                    :key="item"
                    type="button"
                    :class="{
                      current:
                        (dashboardTab === 'reservas' && item === 'Reservas') ||
                        (dashboardTab === 'leads' && item === 'Leads') ||
                        (dashboardTab === 'conversaciones' && item === 'Conversaciones'),
                    }"
                    @click="
                      dashboardTab =
                        item === 'Leads' ? 'leads' : item === 'Conversaciones' ? 'conversaciones' : 'reservas'
                    ">
                    {{
                      item === "Reservas"
                        ? "▦"
                        : item === "Leads"
                          ? "↗"
                          : item === "Conversaciones"
                            ? "☏"
                            : "◈"
                    }}
                    &nbsp; {{ item }}
                  </button>
                  <div class="sidebar-foot">✳ &nbsp; Agente configurado</div>
                </aside>
                <div class="app-main">
                  <div class="app-top">
                    <span>Tu espacio de trabajo <small>Ejemplo de interfaz</small></span
                    ><span class="app-avatar">EA</span>
                  </div>
                  <template v-if="dashboardTab === 'reservas'"
                    ><div class="app-page-title">
                      <div>
                        <small>GESTIÓN DE CITAS</small>
                        <h3>Reservas</h3>
                      </div>
                      <span class="fake-new">+ Nueva reserva</span>
                    </div>
                    <div class="app-stat-grid">
                      <div><small>Reservas de hoy</small><b>8</b><span>Calendario organizado</span></div>
                      <div><small>Próximas citas</small><b>24</b><span>Consulta rápida</span></div>
                      <div><small>Servicios activos</small><b>6</b><span>Tu catálogo</span></div>
                    </div>
                    <div class="app-table">
                      <div class="app-table-title">Próximas reservas <span>Hoy · Ejemplo</span></div>
                      <div class="app-table-head">
                        <span>CLIENTE</span><span>SERVICIO</span><span>HORA</span><span>ESTADO</span>
                      </div>
                      <div
                        v-for="r in [
                          { n: 'Lucía Martínez', i: 'LM', s: 'Corte y peinado', h: '10:00', c: 'Confirmada' },
                          { n: 'Carlos Gómez', i: 'CG', s: 'Corte de pelo', h: '11:30', c: 'Confirmada' },
                          { n: 'Ana Ruiz', i: 'AR', s: 'Tratamiento', h: '12:45', c: 'Pendiente' },
                        ]"
                        :key="r.n"
                        class="app-table-row">
                        <span
                          ><i>{{ r.i }}</i
                          >{{ r.n }}</span
                        ><span>{{ r.s }}</span
                        ><span>{{ r.h }}</span
                        ><span class="app-status" :class="{ pending: r.c === 'Pendiente' }">{{ r.c }}</span>
                      </div>
                    </div></template
                  >
                  <template v-else-if="dashboardTab === 'leads'"
                    ><div class="app-page-title">
                      <div>
                        <small>OPORTUNIDADES</small>
                        <h3>Contactos interesados</h3>
                      </div>
                    </div>
                    <div class="app-table">
                      <div class="app-table-title">Leads captados <span>Datos de demostración</span></div>
                      <div
                        v-for="lead in [
                          { n: 'Marina López', s: 'Consulta sobre tratamiento', d: 'Hoy' },
                          { n: 'Pablo Torres', s: 'Solicita información de precios', d: 'Ayer' },
                          { n: 'Clara Pérez', s: 'Interesada en una cita', d: 'Ayer' },
                        ]"
                        :key="lead.n"
                        class="app-lead">
                        <span class="lead-icon">↗</span>
                        <div>
                          <b>{{ lead.n }}</b
                          ><small>{{ lead.s }}</small>
                        </div>
                        <span>{{ lead.d }}</span>
                      </div>
                    </div></template
                  >
                  <template v-else
                    ><div class="app-page-title">
                      <div>
                        <small>ATENCIÓN AL CLIENTE</small>
                        <h3>Conversaciones</h3>
                      </div>
                    </div>
                    <div class="app-chat-demo">
                      <div class="chat-demo-head">Marina López <span>✳ Agente IA</span></div>
                      <p class="chat-demo-in">Hola, ¿tenéis hueco mañana por la tarde?</p>
                      <p class="chat-demo-out">
                        ¡Hola! Claro, vamos a consultar los horarios disponibles. ¿Qué servicio necesitas?
                      </p>
                      <div class="chat-demo-note">↔ Puedes intervenir y responder personalmente.</div>
                    </div></template
                  >
                </div>
              </div>
            </div>
            <div class="preview-description">
              <span class="preview-pill">EL DASHBOARD</span>
              <h3>Todo tu negocio, en una sola pantalla.</h3>
              <p>
                Consulta reservas, organiza tus servicios y empleados, revisa los leads y toma el control de
                las conversaciones cuando lo necesites.
              </p>
              <div class="preview-mini-tabs">
                <button
                  type="button"
                  :class="{ active: dashboardTab === 'reservas' }"
                  @click="dashboardTab = 'reservas'">
                  01 &nbsp; Reservas</button
                ><button
                  type="button"
                  :class="{ active: dashboardTab === 'leads' }"
                  @click="dashboardTab = 'leads'">
                  02 &nbsp; Leads</button
                ><button
                  type="button"
                  :class="{ active: dashboardTab === 'conversaciones' }"
                  @click="dashboardTab = 'conversaciones'">
                  03 &nbsp; Conversaciones
                </button>
              </div>
              <p class="preview-footnote">Demostración visual con datos ficticios. No es una sesión real.</p>
            </div>
          </div>
          <div v-else class="preview-layout website-layout">
            <div class="product-frame website-frame">
              <div class="browser-bar">
                <span class="browser-dots"><i></i><i></i><i></i></span
                ><span class="browser-url">tu-negocio · Web de ejemplo</span><span>↗</span>
              </div>
              <div class="sample-site">
                <div class="site-nav">
                  <strong>ESTUDIO <em>AURA</em></strong
                  ><span>Inicio &nbsp; Servicios &nbsp; Contacto</span><b>Reservar cita ↗</b>
                </div>
                <div class="site-hero">
                  <span>BIENVENIDOS A ESTUDIO AURA</span>
                  <h3>Tu momento.<br /><em>Tu estilo.</em></h3>
                  <p>
                    Un espacio pensado para cuidarte. Descubre nuestros servicios y encuentra tu próxima cita.
                  </p>
                  <span class="site-button">Descubrir servicios ↗</span>
                </div>
                <div class="site-services">
                  <span>NUESTROS SERVICIOS</span>
                  <div><b>Corte y peinado</b><b>Tratamientos</b><b>Coloración</b></div>
                </div>
                <div class="site-chat">
                  <div class="site-chat-head">
                    <span>✳</span>
                    <div>
                      <b>Asistente de Estudio Aura</b><small>Te ayudamos con tu próxima visita</small>
                    </div>
                    <span>−</span>
                  </div>
                  <div class="site-chat-body">
                    <p>¡Hola! 👋 Soy el asistente de Estudio Aura. ¿En qué puedo ayudarte?</p>
                    <p>¿Cuánto cuesta un corte?</p>
                    <p>
                      ¡Claro! El corte tiene un precio desde 20 €. ¿Quieres que consultemos disponibilidad?
                    </p>
                  </div>
                  <div class="site-chat-input">Escribe tu mensaje... <span>↑</span></div>
                </div>
              </div>
            </div>
            <div class="preview-description">
              <span class="preview-pill">LA WEB PÚBLICA</span>
              <h3>Tu escaparate digital, con un agente que atiende.</h3>
              <p>
                Una página para presentar tus servicios y facilitar el contacto. El agente conoce los datos
                que has configurado y puede responder a las consultas de tus visitantes.
              </p>
              <div class="preview-benefits">
                <span>✓ Tu marca y tus servicios</span><span>✓ Agente integrado</span
                ><span>✓ Disponible desde móvil</span>
              </div>
              <p class="preview-footnote">
                Diseño ilustrativo. La apariencia final de la web pública puede variar. La reserva directa
                desde la web depende de su habilitación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionamiento" class="section steps-section">
        <div class="container">
          <div class="section-intro">
            <div>
              <span class="kicker">03 / CÓMO FUNCIONA</span>
              <h2>De cero a tener tu negocio <span>conectado.</span></h2>
            </div>
            <p>
              Así es el recorrido, paso a paso: desde configurar tu cuenta hasta atender consultas y gestionar
              tus reservas.
            </p>
          </div>
          <div class="steps detailed-steps">
            <article v-for="step in steps" :key="step.n">
              <div class="step-number">{{ step.n }}<span>↗</span></div>
              <span class="step-subtitle">{{ step.subtitle }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
              <div class="step-tags">
                <span v-for="tag in step.tags" :key="tag">✓ {{ tag }}</span>
              </div>
            </article>
          </div>
          <div class="steps-cta">
            <p>Tu agente, tu información, tus reglas.</p>
            <RouterLink to="/register">Crear mi cuenta <span>↗</span></RouterLink>
          </div>
        </div>
      </section>

      <section id="sectores" class="section sectors-section">
        <div class="container sectors-layout">
          <div>
            <span class="kicker">03 / PARA QUIÉN</span>
            <h2>Una herramienta.<br /><span>Muchos negocios.</span></h2>
            <p>
              Configura el agente con tus propios servicios, precios, horarios e instrucciones. Resbix se
              adapta a la información que proporcionas.
            </p>
            <RouterLink to="/register" class="text-link">Quiero probarlo <span>↗</span></RouterLink>
          </div>
          <div class="sector-list">
            <div v-for="(sector, index) in sectors" :key="sector">
              <span>0{{ index + 1 }}</span
              ><b>{{ sector }}</b
              ><span>↗</span>
            </div>
          </div>
        </div>
      </section>

      <section id="precios" class="section pricing-section">
        <div class="container pricing-layout">
          <div class="pricing-copy">
            <span class="kicker">04 / UN SOLO PLAN. TODO INCLUIDO.</span>
            <h2>No contrates solo un chatbot.<br /><span>Digitaliza la atención de tu negocio.</span></h2>
            <p>
              Tu propia página web, un agente que atiende consultas y las herramientas para convertir
              conversaciones en reservas y oportunidades. Todo conectado en Resbix.
            </p>
            <div class="value-stack">
              <div>
                <span class="value-icon">◈</span>
                <div>
                  <b>Tu propia web pública</b
                  ><small
                    >Una página para presentar tu negocio, servicios, horarios y facilitar el contacto y las
                    reservas.</small
                  >
                </div>
              </div>
              <div>
                <span class="value-icon">✳</span>
                <div>
                  <b>Un agente IA que conoce tu negocio</b
                  ><small
                    >Atención a consultas sobre tus servicios, precios, horarios y disponibilidad.</small
                  >
                </div>
              </div>
              <div>
                <span class="value-icon">▦</span>
                <div>
                  <b>Reservas y organización en un solo panel</b
                  ><small>Consulta las citas y gestiona reservas manualmente, servicios y empleados.</small>
                </div>
              </div>
              <div>
                <span class="value-icon">↗</span>
                <div>
                  <b>Captación y seguimiento de clientes</b
                  ><small>Guarda los datos de personas interesadas y revisa las conversaciones.</small>
                </div>
              </div>
            </div>
          </div>
          <div class="pricing-card">
            <div class="pricing-card-top">
              <span>✦ OFERTA DE LANZAMIENTO</span>
              <span>PRIMEROS 20 CLIENTES</span>
            </div>

            <div class="pricing-card-body">
              <span class="pricing-label"> Resbix · Plataforma completa </span>

              <div class="price-old">Precio habitual <s>110 €/mes</s></div>

              <div class="price-main">55<span>€</span><small>/ mes</small></div>

              <div class="price-save">AHORRAS 660 € DURANTE TU PRIMER AÑO</div>

              <p class="price-intro">
                Todo lo que necesitas para atender, captar y organizar clientes desde un mismo sitio.
              </p>

              <div class="included-heading">TODO ESTO ESTÁ INCLUIDO</div>

              <ul class="included-list">
                <li class="included-highlight">
                  <span>✓</span>
                  <div>
                    <strong> Página web pública para tu negocio </strong>
                    <small> Tu escaparate digital, conectado con Resbix </small>
                  </div>
                  <b>INCLUIDA</b>
                </li>

                <li><span>✓</span> Agente IA personalizado con tu información</li>
                <li><span>✓</span> Atención automática a consultas, 24/7</li>
                <li><span>✓</span> Sistema de reservas y disponibilidad</li>
                <li><span>✓</span> Gestión manual de citas desde el panel</li>
                <li><span>✓</span> Gestión de servicios, horarios y empleados</li>
                <li><span>✓</span> Captación y gestión de leads</li>
                <li><span>✓</span> Historial de conversaciones</li>
                <li><span>✓</span> Control humano del chat cuando lo necesites</li>
                <li><span>✓</span> Emails de confirmación y recordatorio de reservas*</li>
                <li><span>✓</span> Panel de control para gestionarlo todo</li>
              </ul>

              <!-- CÓDIGO PROMOCIONAL -->
              <div class="promo-code-box">
                <span class="promo-code-label"> 🎁 CÓDIGO DE LANZAMIENTO </span>

                <div class="promo-code-value">FOUNDERS50</div>

                <p>
                  Introduce este código en la página de pago de Stripe para conseguir el
                  <strong>50 % de descuento durante 12 meses.</strong>
                </p>
              </div>

              <RouterLink to="/register" class="button button-primary pricing-cta">
                Quiero aprovechar la oferta <span>↗</span>
              </RouterLink>

              <div class="pricing-under-cta">Un solo plan · Sin elegir entre funciones esenciales</div>

              <small class="pricing-terms">
                Oferta para los primeros 20 clientes que apliquen correctamente el código promocional. Precio
                promocional: 55 €/mes durante los primeros 12 meses. Después, 110 €/mes. El descuento debe
                aplicarse en Stripe antes de confirmar la suscripción. Promoción sujeta a disponibilidad real.
                *Los emails requieren que el cliente facilite su dirección. Consulta las condiciones antes de
                contratar.
              </small>
            </div>
          </div>
        </div>
      </section>
      <section class="section faq-section">
        <div class="container faq-layout">
          <div>
            <span class="kicker">PREGUNTAS FRECUENTES</span>
            <h2>Todo claro <span>desde el principio.</span></h2>
            <p>Lo que probablemente quieras saber antes de empezar.</p>
          </div>
          <div class="faq-list">
            <article v-for="(faq, index) in faqs" :key="faq.q" :class="{ expanded: activeFaq === index }">
              <button
                type="button"
                :aria-expanded="activeFaq === index"
                @click="activeFaq = activeFaq === index ? null : index">
                <span>{{ faq.q }}</span
                ><span>{{ activeFaq === index ? "−" : "+" }}</span>
              </button>
              <p v-if="activeFaq === index">{{ faq.a }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="final-section">
        <div class="container final-content">
          <span class="kicker kicker-light">TU NEGOCIO NO SE DETIENE</span>
          <h2>El siguiente mensaje<br />puede ser <em>tu próximo cliente.</em></h2>
          <p>
            Empieza a atender mejor, organiza tus oportunidades y recupera tiempo para lo que de verdad
            importa.
          </p>
          <RouterLink to="/register" class="button button-white"
            >Empezar por 55 €/mes <span>↗</span></RouterLink
          ><small>Promoción para los primeros 20 clientes durante el primer año.</small>
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="container footer-main">
        <!-- Marca -->
        <div>
          <RouterLink to="/" class="brand">
            <img v-if="!logoFailed" :src="logoSrc" alt="" class="brand-logo" @error="logoFailed = true" />

            <span v-else class="brand-symbol">✳</span>

            <span> resbix<span class="brand-period">.</span> </span>
          </RouterLink>

          <p>La atención de tu negocio, preparada para lo que viene.</p>
        </div>

        <!-- Enlaces -->
        <div class="footer-links">
          <!-- Explorar -->
          <div>
            <b>Explorar</b>

            <a href="#producto">Producto</a>
            <a href="#demo">Ver demo</a>
            <a href="#funcionamiento">Cómo funciona</a>
            <a href="#sectores">Para quién</a>
            <a href="#precios">Precios</a>
          </div>

          <!-- Cuenta -->
          <div>
            <b>Tu cuenta</b>

            <RouterLink to="/login"> Iniciar sesión </RouterLink>

            <RouterLink to="/register"> Crear cuenta </RouterLink>
          </div>

          <!-- Legal -->
          <div>
            <b>Legal</b>

            <RouterLink to="/aviso-legal"> Aviso legal </RouterLink>

            <RouterLink to="/privacidad"> Política de privacidad </RouterLink>

            <RouterLink to="/cookies"> Política de cookies </RouterLink>

            <RouterLink to="/terminos"> Términos y condiciones </RouterLink>

            <RouterLink to="/tratamiento-datos"> Tratamiento de datos </RouterLink>
          </div>
        </div>
      </div>

      <!-- Footer inferior -->
      <div class="container footer-bottom">
        <span> © {{ new Date().getFullYear() }} Resbix. Todos los derechos reservados. </span>

        <span> Hecho para negocios que quieren avanzar. ✳ </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap");
.landing {
  --ink: #11192b;
  --muted: #697287;
  --line: #e7eaf0;
  --accent: #6656ed;
  color: var(--ink);
  background: #fff;
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}
.landing * {
  box-sizing: border-box;
}
.landing a {
  text-decoration: none;
}
.landing button {
  font: inherit;
  cursor: pointer;
}
.container {
  width: min(1200px, calc(100% - 64px));
  margin-inline: auto;
}
.announcement {
  min-height: 37px;
  background: #16182f;
  color: #e5e5ff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  padding: 8px 16px;
  font-size: 12px;
  flex-wrap: wrap;
}
.announcement b {
  color: #fff;
}
.announcement a {
  color: #bfb7ff;
  font-weight: 700;
  margin-left: 9px;
}
.announcement-dot,
.pulse {
  width: 7px;
  height: 7px;
  background: #9eecbd;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #9eecbd24;
  display: inline-block;
}
.announcement-divider {
  color: #565a81;
}
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: #ffffffed;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #eceef2;
}
.nav-inner {
  height: 78px;
  display: flex;
  align-items: center;
  gap: 36px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--ink);
  font:
    800 27px "Manrope",
    sans-serif;
  letter-spacing: -1.9px;
}
.brand-logo,
.brand-symbol {
  width: 37px;
  height: 37px;
  object-fit: contain;
  display: grid;
  place-items: center;
}
.brand-symbol {
  border-radius: 12px;
  background: #6656ed;
  color: white;
  font-size: 25px;
}
.brand-period {
  color: #6656ed;
}
.nav-links {
  display: flex;
  gap: 34px;
  margin: auto;
}
.nav-links a,
.nav-login {
  color: #515a6d;
  font-size: 13px;
  font-weight: 700;
}
.nav-links a:hover,
.nav-login:hover {
  color: #6656ed;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 25px;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 15px 22px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 13px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.button:hover {
  transform: translateY(-2px);
}
.button-dark {
  background: #171c2c;
  color: #fff;
}
.button-primary {
  background: #6656ed;
  color: #fff;
  box-shadow: 0 13px 30px #6656ed32;
}
.button-primary:hover {
  box-shadow: 0 16px 35px #6656ed55;
}
.button-outline {
  border: 1px solid #dcdfe9;
  color: #222c40;
  background: white;
}
.button-white {
  background: #fff;
  color: #25203c;
}
.menu-toggle,
.mobile-nav {
  display: none;
}
.hero {
  position: relative;
  background: linear-gradient(115deg, #fff 0%, #fbfaff 60%, #f3f1ff 100%);
  padding: 92px 0 28px;
}
.hero-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.orb-one {
  width: 540px;
  height: 540px;
  right: -200px;
  top: 20px;
  background: #e9e4ff8a;
  filter: blur(70px);
}
.orb-two {
  width: 400px;
  height: 400px;
  left: -300px;
  top: 200px;
  background: #dff7ff9c;
  filter: blur(80px);
}
.hero-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
}
.hero-copy {
  position: relative;
  z-index: 2;
}
.eyebrow,
.kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #6859d8;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}
.hero h1,
.section h2,
.statement-section h2,
.final-section h2 {
  font-family: "Manrope", sans-serif;
  letter-spacing: -3.6px;
  font-weight: 800;
}
.hero h1 {
  font-size: clamp(45px, 5vw, 75px);
  line-height: 1.09;
  margin: 0;
  max-width: 660px;
}
.hero h1 em,
.statement-section h2 em,
.final-section h2 em {
  font-style: normal;
  color: #705dec;
}
.hero-lead {
  font-size: 17px;
  line-height: 1.8;
  color: #687185;
  max-width: 560px;
  margin: 25px 0 28px;
}
.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.hero-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 26px;
  color: #737d90;
  font-size: 12px;
  font-weight: 700;
}
.hero-checks span:first-letter {
  color: #31a879;
}
.hero-offer {
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(480px, 100%);
  padding: 14px 16px;
  margin-top: 35px;
  background: #fff;
  border: 1px solid #e6e2ff;
  border-radius: 15px;
  box-shadow: 0 15px 35px #4e42a60c;
  color: #26213d;
}
.offer-gift {
  width: 37px;
  height: 37px;
  border-radius: 10px;
  background: #eeeaff;
  color: #6956e5;
  display: grid;
  place-items: center;
  font-size: 21px;
}
.hero-offer b,
.hero-offer small {
  display: block;
}
.hero-offer b {
  font-size: 12px;
}
.hero-offer small {
  font-size: 11px;
  color: #81869a;
  margin-top: 4px;
}
.offer-arrow {
  margin-left: auto;
  color: #6755e8;
}
.hero-art {
  height: 550px;
  position: relative;
  display: grid;
  place-items: center;
}
.art-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(#6656ed0d 1px, transparent 1px), linear-gradient(90deg, #6656ed0d 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(ellipse, #000 20%, transparent 75%);
}
.art-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  background: #bdb3ff85;
  border-radius: 50%;
  filter: blur(65px);
}
.mock-window {
  position: relative;
  z-index: 2;
  width: 390px;
  max-width: 85%;
  background: #fff;
  border: 1px solid #e3e3f1;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 35px 90px #35306529;
  transform: rotate(-2deg);
}
.mock-top {
  height: 39px;
  background: #fafafe;
  border-bottom: 1px solid #edf0f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  font-size: 10px;
  color: #a1a6b6;
}
.mock-dots {
  display: flex;
  gap: 5px;
}
.mock-dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #dadce9;
}
.mock-dots i:first-child {
  background: #ffb9b4;
}
.mock-dots i:nth-child(2) {
  background: #ffe3a7;
}
.mock-body {
  padding: 17px;
}
.mock-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-bottom: 17px;
  border-bottom: 1px solid #edf0f5;
}
.mock-logo {
  background: #6d5bec;
  color: #fff;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 23px;
}
.mock-header b,
.mock-header small {
  display: block;
}
.mock-header b {
  font-size: 13px;
}
.mock-header small {
  font-size: 10px;
  color: #9198a7;
  margin-top: 3px;
}
.mock-header small i {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #37c88a;
  margin-right: 4px;
}
.mock-ellipsis {
  margin-left: auto;
  color: #adb3c3;
}
.mock-messages {
  min-height: 290px;
  padding: 14px 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
}
.mock-day {
  align-self: center;
  color: #aab0be;
  font-size: 9px;
  letter-spacing: 1px;
}
.bubble {
  font-size: 11px;
  line-height: 1.6;
  padding: 11px 13px;
  max-width: 82%;
}
.bubble.assistant {
  background: #f2f0ff;
  color: #514b7d;
  border-radius: 3px 12px 12px 12px;
}
.bubble.visitor {
  background: #6555e9;
  color: #fff;
  border-radius: 12px 3px 12px 12px;
  align-self: flex-end;
}
.typing {
  background: #f2f0ff;
  padding: 10px 13px;
  border-radius: 10px;
  display: flex;
  gap: 4px;
}
.typing i {
  width: 5px;
  height: 5px;
  background: #9a90d3;
  border-radius: 50%;
}
.mock-input {
  height: 43px;
  border: 1px solid #e7e8f1;
  border-radius: 10px;
  color: #a5a9b8;
  font-size: 10px;
  padding: 8px 8px 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mock-input span {
  background: #6656ed;
  color: #fff;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  font-size: 16px;
}
.floating-tag {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px 15px;
  background: #fff;
  border: 1px solid #eeecf8;
  border-radius: 13px;
  box-shadow: 0 17px 50px #37305e23;
  color: #252a3d;
  font-size: 11px;
  font-weight: 800;
}
.floating-tag small {
  display: block;
  color: #a0a4b3;
  font-size: 9px;
  font-weight: 500;
  margin-top: 4px;
}
.tag-top {
  top: 50px;
  right: -8px;
  transform: rotate(4deg);
}
.tag-bottom {
  bottom: 62px;
  left: -20px;
  transform: rotate(3deg);
}
.tag-icon {
  width: 33px;
  height: 33px;
  border-radius: 9px;
  background: #eeeaff;
  color: #6556e9;
  display: grid;
  place-items: center;
  font-size: 20px;
}
.tag-icon.green {
  background: #e7f9f0;
  color: #1caf76;
}
.tag-live {
  width: 7px;
  height: 7px;
  background: #2bc487;
  border-radius: 50%;
}
.tag-check {
  margin-left: 10px;
  color: #1caf76;
}
.hero-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 38px;
  font-size: 10px;
  letter-spacing: 1.6px;
  font-weight: 800;
  color: #a2a5b4;
}
.hero-bottom span:nth-child(2) {
  color: #6057a2;
}
.hero-bottom-line {
  flex: 1;
  height: 1px;
  background: #e5e3f3;
  margin: 0 15px;
}
.sector-ribbon {
  padding: 32px 0;
  border-block: 1px solid #eff0f5;
  background: #fff;
}
.sector-ribbon p {
  text-align: center;
  color: #a3a8b5;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0 0 21px;
}
.ribbon-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
}
.ribbon-items span {
  font-size: 12px;
  color: #6f7788;
  font-weight: 800;
}
.section {
  padding: 120px 0;
}
.section-intro {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 60px;
  margin-bottom: 52px;
}
.section h2 {
  font-size: clamp(36px, 4vw, 56px);
  line-height: 1.14;
  margin: 15px 0 0;
}
.section h2 span {
  color: #7565ea;
}
.section-intro > p {
  max-width: 370px;
  color: #798092;
  font-size: 15px;
  line-height: 1.8;
  margin: 0 0 6px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.feature {
  position: relative;
  min-height: 355px;
  padding: 31px;
  overflow: hidden;
  border: 1px solid #e9eaf0;
  border-radius: 21px;
  background: #fbfcff;
}
.feature-wide {
  grid-column: span 2;
  min-height: 360px;
  background: #f6f4ff;
}
.feature-top {
  display: flex;
  justify-content: space-between;
}
.feature-icon {
  display: grid;
  place-items: center;
  width: 49px;
  height: 49px;
  border-radius: 13px;
  background: #e9e5ff;
  color: #6554e6;
  font-size: 27px;
}
.feature-index {
  font-size: 11px;
  color: #b7bac6;
  font-weight: 800;
}
.feature-copy {
  position: relative;
  z-index: 1;
  max-width: 410px;
  margin-top: 31px;
}
.feature-tag {
  color: #7366c9;
  font-size: 10px;
  letter-spacing: 1.8px;
  font-weight: 800;
}
.feature h3 {
  font:
    800 clamp(23px, 2.2vw, 31px)/1.2 "Manrope",
    sans-serif;
  letter-spacing: -1px;
  margin: 10px 0;
}
.feature p {
  font-size: 14px;
  line-height: 1.75;
  color: #7b8193;
  margin: 0;
}
.feature-wide .feature-copy {
  max-width: 400px;
}
.feature-chat {
  position: absolute;
  width: 42%;
  right: 35px;
  bottom: 35px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: rotate(-2deg);
}
.feature-chat-row {
  background: #fff;
  border: 1px solid #e8e6f5;
  box-shadow: 0 10px 25px #6255c00b;
  padding: 16px;
  border-radius: 13px;
}
.feature-chat-row span {
  display: block;
  color: #a3a4b4;
  font-size: 10px;
  margin-bottom: 8px;
}
.feature-chat-row b {
  font-size: 12px;
  line-height: 1.5;
  color: #34334e;
}
.feature-chat-row.agent {
  background: #6b5aee;
}
.feature-chat-row.agent span,
.feature-chat-row.agent b {
  color: #fff;
}
.feature-blue {
  background: #f5f9ff;
}
.feature-blue .feature-icon {
  background: #e4efff;
  color: #4885df;
}
.feature-mint {
  background: #f4fbf8;
}
.feature-mint .feature-icon {
  background: #dff7e9;
  color: #24a77c;
}
.feature-orange {
  background: #fffbf6;
}
.feature-orange .feature-icon {
  background: #fff0d9;
  color: #d69b3c;
}
.feature-detail {
  margin-top: 25px;
  background: #fff;
  border: 1px solid #e8eaf0;
  padding: 15px;
  border-radius: 13px;
  box-shadow: 0 12px 25px #202a3708;
}
.feature-detail > span {
  font-size: 9px;
  font-weight: 800;
  color: #9ba3b2;
  letter-spacing: 1px;
}
.feature-detail > div {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 0;
  font-size: 12px;
}
.feature-detail > div b {
  color: #373b4d;
}
.feature-detail > div span {
  flex: 1;
}
.feature-detail i {
  font-style: normal;
  font-size: 10px;
  color: #20a679;
  background: #e9f8f0;
  padding: 5px 8px;
  border-radius: 7px;
}
.feature-detail small {
  display: block;
  color: #9ba3b2;
  font-size: 10px;
  margin-top: 3px;
}
.contact-avatar {
  background: #e4f5e9;
  color: #239b72 !important;
  padding: 11px;
  border-radius: 10px;
}
.statement-section {
  position: relative;
  background: #1a1938;
  color: white;
  padding: 105px 0;
  overflow: hidden;
}
.statement-inner {
  position: relative;
  z-index: 1;
}
.kicker-light {
  color: #b5aaff;
}
.statement-section h2 {
  font-size: clamp(40px, 5.3vw, 75px);
  max-width: 1000px;
  line-height: 1.15;
  margin: 22px 0 40px;
}
.statement-section h2 em {
  color: #b1a4ff;
}
.statement-bottom {
  display: flex;
  align-items: center;
  gap: 45px;
}
.statement-bottom p {
  color: #b1b1c9;
  max-width: 400px;
  line-height: 1.7;
  font-size: 15px;
}
.statement-deco {
  position: absolute;
  font-size: 450px;
  color: #ffffff06;
  right: -90px;
  top: -190px;
}
.steps-section {
  background: #fff;
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.steps article {
  border-top: 1px solid #dfe1e9;
  padding: 24px 25px 20px 0;
}
.step-number {
  font-size: 14px;
  color: #7b6cea;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
}
.step-number span {
  color: #b2b3c3;
}
.steps h3 {
  font:
    800 22px "Manrope",
    sans-serif;
  letter-spacing: -0.8px;
  margin: 40px 0 10px;
}
.steps p {
  color: #81889a;
  line-height: 1.8;
  font-size: 14px;
  max-width: 300px;
}
.steps-cta {
  border-top: 1px solid #e8e9f0;
  margin-top: 36px;
  padding-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.steps-cta p {
  font-size: 13px;
  color: #959aaa;
}
.steps-cta a,
.text-link {
  color: #6857e6;
  font-size: 13px;
  font-weight: 800;
}
.sectors-section {
  background: #f8f9fc;
}
.sectors-layout {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 90px;
  align-items: center;
}
.sectors-layout > div:first-child > p {
  color: #81899a;
  font-size: 15px;
  line-height: 1.85;
  max-width: 380px;
  margin: 25px 0;
}
.sector-list {
  border-top: 1px solid #dfe2ea;
}
.sector-list > div {
  display: flex;
  align-items: center;
  gap: 25px;
  border-bottom: 1px solid #dfe2ea;
  padding: 23px 5px;
}
.sector-list > div span:first-child {
  font-size: 11px;
  color: #9b9eac;
  font-weight: 800;
}
.sector-list b {
  font:
    800 17px "Manrope",
    sans-serif;
  flex: 1;
}
.sector-list > div span:last-child {
  color: #7363e8;
}
.pricing-section {
  background: #fff;
}
.pricing-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 95px;
  align-items: center;
}
.pricing-copy > p {
  font-size: 15px;
  line-height: 1.85;
  color: #81899b;
  max-width: 450px;
  margin: 25px 0;
}
.pricing-points {
  border-top: 1px solid #eceef2;
  padding-top: 18px;
  display: grid;
  gap: 17px;
  color: #444c60;
  font-size: 13px;
  font-weight: 700;
}
.pricing-points span {
  color: #22aa79;
  margin-right: 9px;
}
.pricing-card {
  border-radius: 24px;
  background: #fff;
  overflow: hidden;
  border: 1px solid #e3dfff;
  box-shadow: 0 30px 75px #6251dd20;
}
.pricing-card-top {
  background: #6756e9;
  color: white;
  padding: 15px 25px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}
.pricing-card-top span:last-child {
  color: #dedaff;
}
.pricing-card-body {
  padding: 37px 40px;
}
.pricing-label {
  font-size: 13px;
  font-weight: 800;
  color: #3d4056;
}
.price-old {
  color: #959aab;
  font-size: 13px;
  margin-top: 24px;
}
.price-old s {
  margin-left: 7px;
}
.price-main {
  font:
    800 96px/0.95 "Manrope",
    sans-serif;
  letter-spacing: -6px;
  margin-top: 10px;
}
.price-main > span {
  font-size: 50px;
  vertical-align: top;
  letter-spacing: -2px;
  margin-left: 5px;
}
.price-main small {
  font:
    600 16px "DM Sans",
    sans-serif;
  color: #9197a6;
  letter-spacing: 0;
  margin-left: 9px;
}
.price-save {
  display: inline-block;
  margin: 20px 0 10px;
  padding: 9px 12px;
  border-radius: 8px;
  background: #e9f9f0;
  color: #239568;
  font-size: 10px;
  letter-spacing: 0.7px;
  font-weight: 800;
}
.pricing-card-body > p {
  color: #7d8497;
  line-height: 1.7;
  font-size: 13px;
}
.pricing-cta {
  width: 100%;
  justify-content: space-between;
  margin-top: 20px;
}
.pricing-terms {
  display: block;
  text-align: center;
  color: #a2a5b4;
  line-height: 1.6;
  font-size: 10px;
  margin-top: 17px;
}
.faq-section {
  background: #f8f9fc;
}
.faq-layout {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 85px;
}
.faq-layout > div:first-child > p {
  color: #8c91a1;
  line-height: 1.7;
}
.faq-list {
  border-top: 1px solid #dfe2eb;
}
.faq-list article {
  border-bottom: 1px solid #dfe2eb;
}
.faq-list button {
  border: 0;
  background: none;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  text-align: left;
  padding: 22px 0;
  color: #30394c;
  font-weight: 800;
  font-size: 14px;
}
.faq-list button > span:last-child {
  color: #7363e8;
  font-size: 22px;
  font-weight: 400;
}
.faq-list article > p {
  margin: 0 0 22px;
  color: #81889a;
  line-height: 1.8;
  font-size: 13px;
  max-width: 560px;
}
.final-section {
  background: radial-gradient(circle at 85% 30%, #5244a6 0%, transparent 35%), #191835;
  color: #fff;
  text-align: center;
  padding: 110px 0;
}
.final-section h2 {
  font-size: clamp(42px, 5vw, 70px);
  line-height: 1.16;
  margin: 24px 0;
}
.final-section h2 em {
  color: #b5aaff;
}
.final-content > p {
  color: #b8b5d0;
  font-size: 16px;
  line-height: 1.8;
  max-width: 560px;
  margin: 0 auto 30px;
}
.final-content > small {
  display: block;
  color: #aaa7c9;
  font-size: 11px;
  margin-top: 20px;
}
.footer {
  background: #fff;
}
.footer-main {
  padding: 65px 0;
  display: flex;
  justify-content: space-between;
  gap: 50px;
}
.footer-main > div:first-child > p {
  font-size: 13px;
  color: #8d95a5;
  max-width: 250px;
  line-height: 1.7;
}
.footer-links {
  display: flex;
  gap: 100px;
}
.footer-links > div {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.footer-links b {
  font-size: 13px;
}
.footer-links a {
  color: #838a9b;
  font-size: 13px;
}
.footer-bottom {
  border-top: 1px solid #eceef2;
  padding: 24px 0;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  color: #9ba1ae;
  font-size: 11px;
}
@media (max-width: 1050px) {
  .nav-links {
    gap: 15px;
  }
  .hero-grid {
    gap: 12px;
  }
  .hero h1 {
    font-size: 55px;
  }
  .tag-top {
    right: 0;
  }
  .tag-bottom {
    left: 0;
  }
  .pricing-layout {
    gap: 45px;
  }
  .sectors-layout {
    gap: 45px;
  }
}
@media (max-width: 800px) {
  .container {
    width: min(100% - 38px, 650px);
  }
  .nav-inner {
    height: 68px;
  }
  .nav-links,
  .nav-actions {
    display: none;
  }
  .menu-toggle {
    display: block;
    margin-left: auto;
    border: 1px solid #e5e6ef;
    background: #fff;
    padding: 7px 12px;
    border-radius: 9px;
    font-size: 21px;
  }
  .mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 12px 20px 20px;
    border-top: 1px solid #eceef2;
  }
  .mobile-nav a {
    padding: 12px 4px;
    color: #343a50;
    font-size: 14px;
    font-weight: 700;
  }
  .mobile-nav .mobile-cta {
    background: #6656ed;
    color: white;
    border-radius: 10px;
    text-align: center;
    margin-top: 7px;
  }
  .hero {
    padding-top: 65px;
  }
  .hero-grid,
  .sectors-layout,
  .pricing-layout,
  .faq-layout {
    grid-template-columns: 1fr;
  }
  .hero h1 {
    font-size: clamp(46px, 9vw, 70px);
  }
  .hero-art {
    height: 510px;
    margin-top: 20px;
  }
  .section {
    padding: 85px 0;
  }
  .section-intro {
    display: block;
  }
  .section-intro > p {
    margin-top: 20px;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .feature-wide {
    grid-column: auto;
    min-height: 550px;
  }
  .feature-chat {
    width: calc(100% - 60px);
    bottom: 24px;
    left: 30px;
    right: auto;
  }
  .feature-wide .feature-copy {
    max-width: 100%;
  }
  .steps {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .steps article {
    padding-bottom: 24px;
  }
  .steps h3 {
    margin-top: 20px;
  }
  .statement-bottom {
    flex-wrap: wrap;
  }
  .pricing-layout,
  .faq-layout,
  .sectors-layout {
    gap: 40px;
  }
  .pricing-card {
    max-width: 540px;
  }
  .footer-links {
    gap: 50px;
  }
}
@media (max-width: 500px) {
  .announcement {
    font-size: 10px;
    gap: 5px;
  }
  .announcement a {
    margin-left: 2px;
  }
  .hero h1 {
    letter-spacing: -2.5px;
  }
  .hero-lead {
    font-size: 15px;
  }
  .hero-buttons {
    display: grid;
  }
  .hero-buttons .button {
    justify-content: space-between;
  }
  .hero-art {
    height: 430px;
    margin-inline: -15px;
  }
  .mock-window {
    width: 340px;
    max-width: 85%;
  }
  .floating-tag {
    padding: 10px;
    font-size: 9px;
  }
  .tag-top {
    top: 16px;
  }
  .tag-bottom {
    bottom: 8px;
  }
  .hero-bottom {
    font-size: 8px;
  }
  .hero-bottom span:nth-child(2) {
    display: none;
  }
  .ribbon-items {
    justify-content: center;
  }
  .section h2 {
    letter-spacing: -2px;
  }
  .feature {
    padding: 24px;
  }
  .feature-wide {
    min-height: 555px;
  }
  .feature-chat {
    width: calc(100% - 48px);
    left: 24px;
  }
  .statement-section h2,
  .final-section h2 {
    letter-spacing: -2px;
  }
  .pricing-card-top {
    font-size: 8px;
    padding: 13px;
  }
  .pricing-card-body {
    padding: 27px;
  }
  .price-main {
    font-size: 80px;
  }
  .price-main > span {
    font-size: 38px;
  }
  .footer-main,
  .footer-bottom {
    flex-direction: column;
  }
  .footer-links {
    gap: 55px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
  .button:hover {
    transform: none;
  }
}

/* Pricing: hacer visible el valor completo del plan */
.value-stack {
  display: grid;
  gap: 0;
  margin-top: 33px;
  border-top: 1px solid #e9e8f2;
}
.value-stack > div {
  display: flex;
  gap: 16px;
  padding: 21px 0;
  border-bottom: 1px solid #e9e8f2;
  align-items: flex-start;
}
.value-icon {
  display: grid;
  place-items: center;
  flex: 0 0 43px;
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #f0edff;
  color: #6857e6;
  font-size: 21px;
  font-weight: 800;
}
.value-stack b {
  display: block;
  color: #25233e;
  font-size: 15px;
  line-height: 1.4;
}
.value-stack small {
  display: block;
  margin-top: 6px;
  color: #83899b;
  font-size: 13px;
  line-height: 1.65;
}
.pricing-layout {
  align-items: start;
  gap: 65px;
}
.pricing-card-body {
  padding: 34px;
}
.price-intro {
  margin: 13px 0 25px !important;
  color: #525a6e !important;
  font-size: 14px !important;
}
.included-heading {
  padding-top: 21px;
  border-top: 1px solid #ebe9f4;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.6px;
  color: #7466b8;
}
.included-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 15px;
}
.included-list li {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  font-size: 13px;
  line-height: 1.45;
  color: #41485b;
  font-weight: 600;
}
.included-list li > span {
  display: grid;
  place-items: center;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e9f8f0;
  color: #1e9c6e;
  font-size: 11px;
  font-weight: 900;
}
.included-highlight {
  position: relative;
  padding: 15px 11px;
  margin: 0 -11px 3px;
  background: #f3f0ff;
  border: 1px solid #e2dcff;
  border-radius: 13px;
  align-items: center !important;
  flex-wrap: wrap;
}
.included-highlight div {
  flex: 1;
  min-width: 150px;
}
.included-highlight strong {
  display: block;
  color: #3e32a0;
  font-size: 14px;
}
.included-highlight small {
  display: block;
  color: #7a73a2;
  font-size: 11px;
  margin-top: 4px;
}
.included-highlight > b {
  font-size: 9px;
  letter-spacing: 0.8px;
  color: #6857e6;
  background: #e5dfff;
  padding: 6px 8px;
  border-radius: 6px;
}
.pricing-under-cta {
  text-align: center;
  margin-top: 14px;
  color: #6f6b8a;
  font-size: 11px;
  font-weight: 700;
}
@media (max-width: 800px) {
  .pricing-layout {
    gap: 38px;
  }
  .pricing-card-body {
    padding: 27px;
  }
}

/* V4: demostración de producto y recorrido detallado */
.showcase-section {
  background: linear-gradient(180deg, #f7f7ff, #fff);
}
.showcase-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 50px;
  margin-bottom: 38px;
}
.showcase-heading h2 {
  font:
    800 clamp(36px, 4vw, 57px)/1.13 Manrope,
    sans-serif;
  letter-spacing: -2.8px;
  margin: 16px 0 0;
}
.showcase-heading h2 span {
  color: #7565ea;
}
.showcase-heading > p {
  max-width: 380px;
  line-height: 1.8;
  color: #7a8295;
  font-size: 15px;
}
.preview-switch {
  display: inline-flex;
  background: #eae8fa;
  padding: 5px;
  border-radius: 13px;
  gap: 4px;
  margin-bottom: 30px;
}
.preview-switch button {
  border: 0;
  border-radius: 10px;
  padding: 13px 21px;
  background: transparent;
  color: #615c80;
  font-size: 13px;
  font-weight: 800;
}
.preview-switch button.selected {
  background: #fff;
  color: #4c3fc0;
  box-shadow: 0 3px 14px #312d7518;
}
.preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(260px, 0.75fr);
  gap: 44px;
  align-items: center;
}
.product-frame {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e1e1f0;
  background: #fff;
  border-radius: 17px;
  box-shadow: 0 28px 65px #28215818;
}
.browser-bar {
  height: 38px;
  background: #f7f8fc;
  border-bottom: 1px solid #e8e9f1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  color: #9ca2b1;
  font-size: 10px;
}
.browser-dots {
  display: flex;
  gap: 5px;
}
.browser-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d8dce9;
}
.browser-dots i:first-child {
  background: #ffbcb7;
}
.browser-dots i:nth-child(2) {
  background: #ffe0a1;
}
.app-shell {
  display: flex;
  min-height: 410px;
  font-size: 11px;
}
.app-sidebar {
  width: 165px;
  flex-shrink: 0;
  background: #1e203c;
  color: #aeb3d0;
  padding: 17px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.app-brand {
  color: #fff;
  font:
    800 20px Manrope,
    sans-serif;
  letter-spacing: -1px;
  padding: 4px 8px 20px;
}
.app-brand span {
  color: #a79bff;
}
.app-business {
  border: 1px solid #444563;
  background: #30324f;
  border-radius: 8px;
  padding: 10px 8px;
  margin-bottom: 14px;
  color: #fff;
  font-weight: 800;
}
.app-business small {
  display: block;
  font-size: 9px;
  color: #aab0c7;
  margin: 4px 0 0 24px;
}
.app-sidebar button {
  border: 0;
  background: transparent;
  color: #b7bad0;
  text-align: left;
  padding: 10px 9px;
  border-radius: 7px;
  font-size: 10px;
}
.app-sidebar button.current {
  background: #6354d9;
  color: white;
  font-weight: 800;
}
.sidebar-foot {
  margin-top: auto;
  border-top: 1px solid #3a3c58;
  padding: 14px 5px 0;
  font-size: 9px;
  color: #c7c2ff;
}
.app-main {
  flex: 1;
  min-width: 0;
  background: #fafbff;
  padding: 0 18px 20px;
}
.app-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 0;
  border-bottom: 1px solid #e9ebf2;
  font-weight: 800;
  color: #4a5268;
}
.app-top small {
  display: block;
  font-size: 9px;
  color: #a5a9b8;
  font-weight: 500;
  margin-top: 3px;
}
.app-avatar {
  background: #e8e4ff;
  color: #5e51b7;
  padding: 8px;
  border-radius: 50%;
  font-size: 9px;
}
.app-page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 21px 0;
}
.app-page-title small {
  color: #8e82cf;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 1px;
}
.app-page-title h3 {
  font:
    800 23px Manrope,
    sans-serif;
  letter-spacing: -1px;
  margin: 5px 0;
}
.fake-new {
  background: #6656ed;
  color: #fff;
  padding: 9px;
  border-radius: 7px;
  font-weight: 800;
  font-size: 9px;
}
.app-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 18px;
}
.app-stat-grid > div {
  border: 1px solid #eceef4;
  border-radius: 9px;
  padding: 12px;
  background: #fff;
}
.app-stat-grid small,
.app-stat-grid span {
  display: block;
  font-size: 9px;
  color: #959db0;
}
.app-stat-grid b {
  display: block;
  font:
    800 24px Manrope,
    sans-serif;
  margin: 8px 0 3px;
}
.app-stat-grid span {
  font-size: 8px;
  color: #32a478;
}
.app-table {
  border: 1px solid #e8eaf2;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.app-table-title {
  padding: 15px;
  font-weight: 900;
  display: flex;
  justify-content: space-between;
}
.app-table-title span {
  color: #a3a8b6;
  font-size: 9px;
  font-weight: 500;
}
.app-table-head,
.app-table-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.55fr 0.9fr;
  gap: 6px;
  align-items: center;
  padding: 11px 13px;
}
.app-table-head {
  background: #f6f7fb;
  color: #a0a7b8;
  font-size: 8px;
  font-weight: 900;
}
.app-table-row {
  border-top: 1px solid #f0f1f6;
  color: #5c6275;
  font-size: 9px;
}
.app-table-row > span:first-child {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 800;
}
.app-table-row i {
  font-style: normal;
  background: #eeeaff;
  color: #6656d6;
  padding: 7px;
  border-radius: 50%;
  font-size: 8px;
}
.app-status {
  color: #269b6d;
  background: #eaf8f0;
  padding: 6px 3px;
  border-radius: 6px;
  text-align: center;
  font-size: 8px;
}
.app-status.pending {
  background: #fff4e2;
  color: #ad7c2c;
}
.app-lead {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #f0f1f6;
  padding: 17px;
}
.app-lead > div {
  flex: 1;
}
.app-lead b,
.app-lead small {
  display: block;
}
.app-lead small {
  color: #999fb1;
  margin-top: 5px;
}
.app-lead > span:last-child {
  color: #a6aaba;
}
.lead-icon {
  background: #eaf9f0;
  color: #2aa574;
  border-radius: 9px;
  padding: 10px;
}
.app-chat-demo {
  border: 1px solid #e9eaf1;
  border-radius: 12px;
  background: #fff;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.chat-demo-head {
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  font-weight: 900;
}
.chat-demo-head span {
  float: right;
  color: #6c5bdf;
}
.app-chat-demo p {
  max-width: 80%;
  margin: 0;
  padding: 13px;
  border-radius: 11px;
  line-height: 1.6;
}
.chat-demo-in {
  align-self: flex-end;
  background: #6656ed;
  color: white;
}
.chat-demo-out {
  background: #f0eeff;
  color: #534a9b;
}
.chat-demo-note {
  border-top: 1px solid #eee;
  padding: 13px 0 0;
  color: #7567bd;
}
.preview-description {
  padding: 10px 0;
}
.preview-pill {
  display: inline-block;
  padding: 8px 11px;
  background: #edeaff;
  color: #6656d6;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
}
.preview-description h3 {
  font:
    800 clamp(27px, 3vw, 38px)/1.2 Manrope,
    sans-serif;
  letter-spacing: -1.5px;
  margin: 22px 0;
}
.preview-description > p {
  color: #7c8498;
  font-size: 14px;
  line-height: 1.85;
}
.preview-mini-tabs {
  border-top: 1px solid #e5e4ef;
  margin-top: 30px;
  padding-top: 15px;
  display: grid;
  gap: 8px;
}
.preview-mini-tabs button {
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  padding: 13px;
  color: #858aa0;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
}
.preview-mini-tabs button.active {
  border-color: #ded9ff;
  background: #f0edff;
  color: #6554d5;
}
.preview-description .preview-footnote {
  font-size: 11px;
  color: #a1a4b3;
  margin-top: 24px;
}
.sample-site {
  position: relative;
  min-height: 440px;
  background: #fffaf5;
}
.site-nav {
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  background: #fff;
  gap: 10px;
}
.site-nav strong {
  font-size: 16px;
  letter-spacing: 2px;
  color: #30312f;
}
.site-nav em {
  color: #ae8466;
  font-style: normal;
}
.site-nav > span {
  color: #8e8c86;
  font-size: 9px;
}
.site-nav > b {
  background: #34322f;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 9px;
}
.site-hero {
  padding: 40px 28px 54px;
  background:
    radial-gradient(circle at 90% 20%, #d7bfa9 0%, transparent 37%), linear-gradient(130deg, #f6e9db, #faf5ed);
  max-width: 100%;
}
.site-hero > span:first-child {
  font-size: 9px;
  letter-spacing: 2px;
  color: #957b66;
  font-weight: 900;
}
.site-hero h3 {
  font:
    800 clamp(37px, 4.4vw, 57px)/1.12 Georgia,
    serif;
  letter-spacing: -2px;
  margin: 18px 0;
  color: #342d2b;
}
.site-hero h3 em {
  color: #ac8467;
}
.site-hero p {
  font-size: 11px;
  color: #776d67;
  max-width: 260px;
  line-height: 1.8;
}
.site-button {
  display: inline-block;
  background: #332f2c;
  color: white;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 14px;
  font-size: 10px;
  font-weight: 800;
}
.site-services {
  padding: 23px 28px 34px;
}
.site-services > span {
  font-size: 9px;
  color: #aa8066;
  letter-spacing: 1px;
}
.site-services > div {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}
.site-services b {
  padding: 13px 10px;
  background: #f6f0eb;
  color: #65574c;
  border-radius: 5px;
  font-size: 10px;
}
.site-chat {
  position: absolute;
  right: 16px;
  top: 90px;
  width: 245px;
  background: #fff;
  border: 1px solid #e6e2e0;
  border-radius: 13px;
  box-shadow: 0 20px 45px #49372735;
  overflow: hidden;
}
.site-chat-head {
  background: #6554dc;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px;
}
.site-chat-head > span:first-child {
  font-size: 20px;
}
.site-chat-head > div {
  flex: 1;
}
.site-chat-head b,
.site-chat-head small {
  display: block;
}
.site-chat-head b {
  font-size: 10px;
}
.site-chat-head small {
  font-size: 8px;
  color: #e6e0ff;
  margin-top: 3px;
}
.site-chat-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.site-chat-body p {
  background: #f1efff;
  border-radius: 9px 9px 9px 2px;
  color: #544b8c;
  font-size: 9px;
  line-height: 1.5;
  padding: 9px;
  margin: 0;
  max-width: 90%;
}
.site-chat-body p:nth-child(2) {
  align-self: flex-end;
  background: #6554dc;
  color: white;
  border-radius: 9px 9px 2px 9px;
}
.site-chat-input {
  border-top: 1px solid #ececf2;
  color: #a8aabb;
  padding: 10px;
  font-size: 9px;
  display: flex;
  justify-content: space-between;
}
.site-chat-input span {
  background: #6656ed;
  color: white;
  border-radius: 5px;
  padding: 3px 7px;
}
.preview-benefits {
  display: grid;
  gap: 12px;
  margin-top: 24px;
  color: #4b5365;
  font-size: 13px;
  font-weight: 800;
}
.detailed-steps {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  counter-reset: none;
}
.detailed-steps article {
  border: 1px solid #e8e8f2;
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  min-height: 295px;
  transition: box-shadow 0.2s;
}
.detailed-steps article:hover {
  box-shadow: 0 15px 35px #2b246e0c;
}
.detailed-steps .step-number {
  font-size: 19px;
}
.step-subtitle {
  display: block;
  color: #7364d6;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 20px;
}
.detailed-steps h3 {
  margin: 10px 0 12px;
}
.detailed-steps p {
  max-width: none;
  margin: 0;
}
.step-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 20px;
}
.step-tags span {
  font-size: 10px;
  color: #5c51b1;
  background: #f1efff;
  padding: 7px 9px;
  border-radius: 6px;
  font-weight: 700;
}
@media (max-width: 1000px) {
  .preview-layout {
    grid-template-columns: 1fr;
  }
  .preview-description {
    max-width: 650px;
  }
  .preview-mini-tabs {
    grid-template-columns: repeat(3, 1fr);
  }
  .preview-mini-tabs button {
    font-size: 11px;
  }
}
@media (max-width: 650px) {
  .showcase-heading {
    display: block;
  }
  .preview-switch {
    display: flex;
    width: 100%;
  }
  .preview-switch button {
    flex: 1;
    padding: 11px 6px;
    font-size: 11px;
  }
  .app-sidebar {
    width: 92px;
    padding: 10px 5px;
  }
  .app-brand {
    font-size: 14px;
    padding: 4px 4px 15px;
  }
  .app-business {
    font-size: 9px;
    padding: 8px 4px;
  }
  .app-business small {
    margin-left: 0;
  }
  .app-sidebar button {
    font-size: 8px;
    padding: 9px 4px;
  }
  .sidebar-foot {
    font-size: 8px;
  }
  .app-main {
    padding: 0 7px 12px;
  }
  .app-table-head,
  .app-table-row {
    grid-template-columns: 1.3fr 1fr 0.6fr;
  }
  .app-table-head > span:last-child,
  .app-table-row > span:last-child {
    display: none;
  }
  .app-table-row {
    font-size: 8px;
    padding: 9px 6px;
  }
  .app-stat-grid {
    gap: 4px;
  }
  .app-stat-grid > div {
    padding: 8px 5px;
  }
  .app-stat-grid small {
    font-size: 8px;
  }
  .app-stat-grid b {
    font-size: 18px;
  }
  .app-stat-grid span {
    display: none;
  }
  .app-page-title h3 {
    font-size: 19px;
  }
  .fake-new {
    font-size: 8px;
    padding: 7px;
  }
  .site-nav {
    padding: 0 12px;
  }
  .site-nav > span {
    display: none;
  }
  .site-chat {
    right: 8px;
    top: 125px;
    width: 190px;
  }
  .site-hero {
    padding: 45px 12px;
  }
  .site-hero h3 {
    font-size: 38px;
  }
  .site-hero p {
    max-width: 130px;
  }
  .site-services {
    padding: 22px 12px;
  }
  .site-services > div {
    max-width: 145px;
  }
  .detailed-steps {
    grid-template-columns: 1fr;
  }
  .preview-mini-tabs {
    grid-template-columns: 1fr;
  }
  .showcase-heading h2 {
    letter-spacing: -2px;
  }
}

.promo-code-box {
  margin: 24px 0;
  padding: 20px;
  border: 1px dashed #6366f1;
  border-radius: 14px;
  background: rgba(99, 102, 241, 0.07);
  text-align: center;
}

.promo-code-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #818cf8;
}

.promo-code-value {
  display: inline-block;
  margin: 14px 0;
  padding: 10px 24px;
  border: 1px solid #6366f1;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 3px;
  color: #a5b4fc;
  user-select: all;
}

.promo-code-box p {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 48px;
}

@media (max-width: 640px) {
  .footer-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px;
  }
}
</style>
