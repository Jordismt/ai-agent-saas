<script setup>
import { ref } from "vue";

const mobileMenuOpen = ref(false);

const faqs = [
  {
    question: "¿Qué es AgentFlow?",
    answer:
      "AgentFlow es una plataforma para crear agentes de IA adaptados a tu negocio. El agente puede atender consultas, conocer tus servicios y horarios, capturar clientes potenciales y derivar conversaciones a una persona cuando sea necesario.",
  },
  {
    question: "¿Tengo que saber programar?",
    answer:
      "No. Desde el panel puedes configurar la información de tu negocio, servicios, horarios y comportamiento del agente sin tocar código.",
  },
  {
    question: "¿Puedo intervenir en una conversación?",
    answer:
      "Sí. Cuando una conversación necesita atención humana puedes tomar el control, responder al cliente y devolver posteriormente la conversación al agente.",
  },
  {
    question: "¿AgentFlow puede captar clientes?",
    answer:
      "Sí. El agente puede recoger información de clientes interesados y convertir esas conversaciones en leads que puedes gestionar desde el panel.",
  },
  {
    question: "¿Puedo tener varios negocios?",
    answer:
      "Sí. AgentFlow está diseñado para gestionar diferentes negocios desde una misma cuenta, manteniendo separada la información de cada uno.",
  },
];

const openedFaq = ref(null);

const toggleFaq = (index) => {
  openedFaq.value = openedFaq.value === index ? null : index;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};
</script>

<template>
  <main class="landing">
    <!-- NAVBAR -->

    <header class="navbar">
      <div class="nav-container">
        <RouterLink to="/" class="brand">
          <span class="brand-mark">✦</span>
          <span>AgentFlow</span>
        </RouterLink>

        <nav class="desktop-nav">
          <a href="#producto">Producto</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#casos">Casos de uso</a>
          <a href="#precios">Precios</a>
        </nav>

        <div class="nav-actions">
          <RouterLink to="/login" class="login-link"> Iniciar sesión </RouterLink>

          <RouterLink to="/register" class="nav-cta">
            Crear mi agente

            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>

        <button
          class="mobile-menu-button"
          type="button"
          aria-label="Abrir menú"
          @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div v-if="mobileMenuOpen" class="mobile-menu">
        <a href="#producto" @click="closeMobileMenu"> Producto </a>

        <a href="#como-funciona" @click="closeMobileMenu"> Cómo funciona </a>

        <a href="#casos" @click="closeMobileMenu"> Casos de uso </a>

        <a href="#precios" @click="closeMobileMenu"> Precios </a>

        <div class="mobile-actions">
          <RouterLink to="/login" @click="closeMobileMenu"> Iniciar sesión </RouterLink>

          <RouterLink to="/register" class="mobile-register" @click="closeMobileMenu">
            Crear mi agente
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- HERO -->

    <section class="hero">
      <div class="hero-glow hero-glow-one"></div>
      <div class="hero-glow hero-glow-two"></div>

      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Agentes IA para negocios
        </div>

        <h1>
          Convierte tu web en un empleado que
          <span>atiende clientes 24/7.</span>
        </h1>

        <p class="hero-description">
          AgentFlow responde preguntas, conoce tus servicios, captura oportunidades y te permite tomar el
          control cuando una conversación necesita atención humana.
        </p>

        <div class="hero-actions">
          <RouterLink to="/register" class="primary-button">
            Crear mi agente

            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <a href="#producto" class="secondary-button"> Ver cómo funciona </a>
        </div>

        <div class="hero-trust">
          <div>
            <span class="check">✓</span>
            Configuración sencilla
          </div>

          <div>
            <span class="check">✓</span>
            Sin conocimientos técnicos
          </div>

          <div>
            <span class="check">✓</span>
            Control humano
          </div>
        </div>
      </div>

      <!-- PRODUCT MOCKUP -->

      <div class="product-showcase">
        <div class="showcase-shadow"></div>

        <div class="browser">
          <div class="browser-top">
            <div class="browser-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="browser-address">app.agentflow.ai/dashboard</div>

            <div class="browser-space"></div>
          </div>

          <div class="dashboard">
            <!-- SIDEBAR -->

            <aside class="demo-sidebar">
              <div class="demo-brand">
                <span>✦</span>
                AgentFlow
              </div>

              <div class="demo-workspace">
                <span>WORKSPACE</span>
              </div>

              <div class="demo-nav active">
                <span class="demo-icon">⌂</span>
                Resumen
              </div>

              <div class="demo-nav">
                <span class="demo-icon">◇</span>
                Negocios
              </div>

              <div class="demo-nav">
                <span class="demo-icon">◌</span>
                Conversaciones
              </div>

              <div class="demo-nav">
                <span class="demo-icon">♙</span>
                Leads
              </div>

              <div class="demo-sidebar-bottom">
                <span class="online-dot"></span>
                Sistema operativo
              </div>
            </aside>

            <!-- DASHBOARD -->

            <div class="demo-main">
              <div class="demo-header">
                <div>
                  <span class="demo-eyebrow"> WORKSPACE </span>

                  <h3>Resumen</h3>

                  <p>Todo lo que ocurre en tu negocio.</p>
                </div>

                <div class="demo-header-actions">
                  <div class="demo-avatar">JC</div>
                </div>
              </div>

              <div class="stats">
                <div class="stat-card">
                  <div class="stat-top">
                    <span>Conversaciones</span>
                    <div class="stat-icon blue">↗</div>
                  </div>

                  <strong>128</strong>

                  <small> <b>+18%</b> esta semana </small>
                </div>

                <div class="stat-card">
                  <div class="stat-top">
                    <span>Leads</span>
                    <div class="stat-icon purple">✦</div>
                  </div>

                  <strong>34</strong>

                  <small> <b>+12%</b> esta semana </small>
                </div>

                <div class="stat-card">
                  <div class="stat-top">
                    <span>Atendidas por IA</span>
                    <div class="stat-icon green">✓</div>
                  </div>

                  <strong>91%</strong>

                  <small>116 conversaciones</small>
                </div>

                <div class="stat-card">
                  <div class="stat-top">
                    <span>Necesitan atención</span>
                    <div class="stat-icon orange">!</div>
                  </div>

                  <strong>3</strong>

                  <small>Requieren respuesta</small>
                </div>
              </div>

              <div class="demo-grid">
                <!-- INBOX -->

                <div class="inbox-card">
                  <div class="card-heading">
                    <div>
                      <strong>Conversaciones recientes</strong>
                      <span>Actividad en tiempo real</span>
                    </div>

                    <span class="view-all"> Ver todas </span>
                  </div>

                  <div class="conversation-row">
                    <div class="conversation-avatar">M</div>

                    <div class="conversation-info">
                      <strong>María</strong>
                      <span> ¿Tenéis disponibilidad mañana? </span>
                    </div>

                    <div class="conversation-status">
                      <span class="ai-status"> IA </span>
                      <small>Ahora</small>
                    </div>
                  </div>

                  <div class="conversation-row highlighted">
                    <div class="conversation-avatar human">C</div>

                    <div class="conversation-info">
                      <strong>Carlos</strong>
                      <span> Quiero hablar con una persona </span>
                    </div>

                    <div class="conversation-status">
                      <span class="human-status"> Humano </span>
                      <small>2 min</small>
                    </div>
                  </div>

                  <div class="conversation-row">
                    <div class="conversation-avatar">L</div>

                    <div class="conversation-info">
                      <strong>Laura</strong>
                      <span> ¿Cuánto cuesta el servicio? </span>
                    </div>

                    <div class="conversation-status">
                      <span class="ai-status"> IA </span>
                      <small>6 min</small>
                    </div>
                  </div>
                </div>

                <!-- LEADS -->

                <div class="leads-card">
                  <div class="card-heading">
                    <div>
                      <strong>Nuevos leads</strong>
                      <span>Captados por tu agente</span>
                    </div>
                  </div>

                  <div class="lead-preview">
                    <div class="lead-top">
                      <div class="lead-avatar">LG</div>

                      <span>Nuevo</span>
                    </div>

                    <strong>Laura García</strong>

                    <small>Interesada en consulta inicial</small>

                    <div class="lead-data">
                      <span>laura@email.com</span>
                      <span>+34 600 000 000</span>
                    </div>
                  </div>

                  <div class="agent-online">
                    <div class="agent-symbol">✦</div>

                    <div>
                      <strong>Agente activo</strong>
                      <span> Atendiendo clientes ahora </span>
                    </div>

                    <span class="online-dot"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- LOGOS / POSITIONING -->

    <section class="business-strip">
      <p>Diseñado para negocios que quieren atender mejor sin estar pendientes del chat todo el día.</p>

      <div class="business-types">
        <span>Clínicas</span>
        <i></i>
        <span>Peluquerías</span>
        <i></i>
        <span>Restaurantes</span>
        <i></i>
        <span>Academias</span>
        <i></i>
        <span>Gimnasios</span>
        <i></i>
        <span>Servicios</span>
      </div>
    </section>

    <!-- PRODUCT -->

    <section id="producto" class="section product-section">
      <div class="section-heading centered">
        <span class="section-eyebrow"> TODO EN UN MISMO LUGAR </span>

        <h2>Mucho más que un chatbot.</h2>

        <p>
          AgentFlow conecta las conversaciones con la información real de tu negocio para convertir preguntas
          en acciones.
        </p>
      </div>

      <div class="feature-grid">
        <!-- AI -->

        <article class="feature-card feature-large">
          <div class="feature-copy">
            <div class="feature-icon-box">✦</div>

            <span class="feature-label"> AGENTE IA </span>

            <h3>Un agente que conoce tu negocio.</h3>

            <p>
              Configura servicios, horarios e instrucciones. Tu agente utiliza esa información para atender a
              cada cliente de forma contextual.
            </p>
          </div>

          <div class="chat-demo">
            <div class="chat-demo-header">
              <div class="mini-avatar">P</div>

              <div>
                <strong>Peluquería Nova</strong>
                <span>
                  <i></i>
                  Agente disponible
                </span>
              </div>
            </div>

            <div class="mini-chat">
              <div class="mini-message user-message">¿Tenéis hueco mañana por la tarde?</div>

              <div class="assistant-row">
                <div class="assistant-symbol">✦</div>

                <div class="mini-message assistant-message">
                  Sí. Mañana estamos abiertos de 16:00 a 20:00. ¿Quieres que te ayude con alguno de nuestros
                  servicios?
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- LEADS -->

        <article class="feature-card">
          <div class="feature-icon-box green-icon">↗</div>

          <span class="feature-label"> LEADS </span>

          <h3>Convierte conversaciones en oportunidades.</h3>

          <p>Guarda los datos de clientes interesados y gestiona su estado desde el panel.</p>

          <div class="lead-card-demo">
            <div class="lead-demo-head">
              <div class="lead-demo-avatar">AM</div>

              <div>
                <strong>Andrea Martínez</strong>
                <span>Nuevo lead</span>
              </div>

              <span class="new-pill">Nuevo</span>
            </div>

            <div class="lead-demo-row">
              <span>Interés</span>
              <strong>Primera consulta</strong>
            </div>

            <div class="lead-demo-row">
              <span>Estado</span>
              <strong>Cualificación pendiente</strong>
            </div>
          </div>
        </article>

        <!-- HANDOFF -->

        <article class="feature-card dark-feature">
          <div class="feature-icon-box dark-icon">↔</div>

          <span class="feature-label"> HANDOFF HUMANO </span>

          <h3>La IA atiende. Tú decides cuándo entrar.</h3>

          <p>
            Cuando un cliente necesita una persona, toma el control de la conversación y continúa exactamente
            donde la IA lo dejó.
          </p>

          <div class="handoff-demo">
            <div class="handoff-line">
              <span class="handoff-avatar ai"> ✦ </span>

              <div>
                <strong>Agente IA</strong>
                <span>Atendiendo conversación</span>
              </div>

              <span class="status-green"> Activo </span>
            </div>

            <div class="handoff-arrow">↓</div>

            <div class="handoff-line human-line">
              <span class="handoff-avatar person"> JC </span>

              <div>
                <strong>Atención humana</strong>
                <span>Control solicitado</span>
              </div>

              <span class="status-blue"> Tomar control </span>
            </div>
          </div>
        </article>

        <!-- CONTROL -->

        <article class="feature-card feature-large control-feature">
          <div class="feature-copy">
            <div class="feature-icon-box purple-icon">◫</div>

            <span class="feature-label"> PANEL DE CONTROL </span>

            <h3>Todo tu negocio, organizado.</h3>

            <p>
              Consulta conversaciones, leads, servicios, horarios y configuración del agente desde un único
              workspace.
            </p>
          </div>

          <div class="control-demo">
            <div class="control-nav">
              <span class="selected"></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="control-content">
              <div class="control-title">
                <span></span>
                <span></span>
              </div>

              <div class="control-stats">
                <div>
                  <small></small>
                  <strong></strong>
                </div>

                <div>
                  <small></small>
                  <strong></strong>
                </div>

                <div>
                  <small></small>
                  <strong></strong>
                </div>
              </div>

              <div class="control-table">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- HOW IT WORKS -->

    <section id="como-funciona" class="section how-section">
      <div class="section-heading">
        <span class="section-eyebrow"> EMPIEZA EN MINUTOS </span>

        <h2>De cero a tu propio agente.</h2>

        <p>
          No necesitas configurar sistemas complejos. Dale a AgentFlow la información de tu negocio y empieza
          a construir tu agente.
        </p>
      </div>

      <div class="steps-grid">
        <article class="process-step">
          <span class="step-number">01</span>

          <div class="process-icon">◇</div>

          <h3>Crea tu negocio</h3>

          <p>Añade la información básica de tu empresa para crear su espacio de trabajo.</p>
        </article>

        <article class="process-step">
          <span class="step-number">02</span>

          <div class="process-icon">≡</div>

          <h3>Añade tus servicios</h3>

          <p>Define qué ofreces, precios, duración y horarios de atención.</p>
        </article>

        <article class="process-step">
          <span class="step-number">03</span>

          <div class="process-icon">✦</div>

          <h3>Personaliza la IA</h3>

          <p>Configura tono, bienvenida e instrucciones específicas para tu agente.</p>
        </article>

        <article class="process-step">
          <span class="step-number">04</span>

          <div class="process-icon">↗</div>

          <h3>Empieza a conversar</h3>

          <p>Tu agente queda preparado para atender clientes y generar oportunidades.</p>
        </article>
      </div>
    </section>

    <!-- HANDOFF -->

    <section class="handoff-section">
      <div class="handoff-container">
        <div class="handoff-copy">
          <span class="section-eyebrow light"> IA + PERSONAS </span>

          <h2>Automatiza sin perder el toque humano.</h2>

          <p>
            No todas las conversaciones deberían terminar en manos de una IA. AgentFlow permite detectar
            cuándo hace falta una persona y continuar la conversación desde el panel.
          </p>

          <div class="handoff-points">
            <div>
              <span>✓</span>
              La IA atiende las consultas habituales.
            </div>

            <div>
              <span>✓</span>
              Las conversaciones pueden pasar a atención humana.
            </div>

            <div>
              <span>✓</span>
              Puedes devolver el control al agente.
            </div>

            <div>
              <span>✓</span>
              Todo el historial permanece en la conversación.
            </div>
          </div>

          <RouterLink to="/register" class="light-button">
            Crear mi agente
            <span>→</span>
          </RouterLink>
        </div>

        <div class="handoff-visual">
          <div class="support-window">
            <div class="support-header">
              <div>
                <span class="support-back">←</span>

                <div>
                  <strong>Conversación #8F2A</strong>
                  <small>Cliente web</small>
                </div>
              </div>

              <span class="human-pill"> Atención humana </span>
            </div>

            <div class="support-body">
              <div class="support-message left">
                <small>Cliente</small>

                <p>Necesitaría hablar con alguien para resolver una duda más concreta.</p>
              </div>

              <div class="support-message right">
                <small>Agente IA</small>

                <p>Por supuesto. Voy a derivar tu conversación para que pueda ayudarte una persona.</p>
              </div>

              <div class="handoff-notice">
                <span>↔</span>

                <div>
                  <strong>Intervención solicitada</strong>
                  <small> Esta conversación necesita atención. </small>
                </div>
              </div>
            </div>

            <div class="support-footer">
              <span>Escribe una respuesta...</span>

              <button>Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- USE CASES -->

    <section id="casos" class="section cases-section">
      <div class="section-heading centered">
        <span class="section-eyebrow"> PARA NEGOCIOS REALES </span>

        <h2>Un agente adaptado a tu negocio.</h2>

        <p>Configura AgentFlow con tus propios servicios, horarios e instrucciones.</p>
      </div>

      <div class="cases-grid">
        <article class="case-card">
          <div class="case-icon">✂</div>
          <h3>Peluquerías y estética</h3>
          <p>Responde sobre servicios, precios, horarios y consultas frecuentes.</p>
        </article>

        <article class="case-card">
          <div class="case-icon">+</div>
          <h3>Clínicas</h3>
          <p>Atiende primeras consultas y captura datos de potenciales pacientes.</p>
        </article>

        <article class="case-card">
          <div class="case-icon">⌂</div>
          <h3>Restaurantes</h3>
          <p>Resuelve preguntas sobre horarios, servicios e información del establecimiento.</p>
        </article>

        <article class="case-card">
          <div class="case-icon">△</div>
          <h3>Gimnasios y entrenadores</h3>
          <p>Informa sobre planes, servicios y convierte consultas en nuevos contactos.</p>
        </article>

        <article class="case-card">
          <div class="case-icon">A</div>
          <h3>Academias</h3>
          <p>Responde dudas sobre cursos, horarios, servicios y solicitudes de información.</p>
        </article>

        <article class="case-card">
          <div class="case-icon">↗</div>
          <h3>Empresas de servicios</h3>
          <p>Convierte las visitas de tu web en conversaciones y oportunidades comerciales.</p>
        </article>
      </div>
    </section>

    <!-- PRICING -->

    <section id="precios" class="section pricing-section">
      <div class="section-heading centered">
        <span class="section-eyebrow"> PRECIOS </span>

        <h2>Un plan para cada etapa.</h2>

        <p>
          La estructura está preparada para crecer contigo. Puedes empezar con lo esencial y ampliar cuando tu
          negocio lo necesite.
        </p>
      </div>

      <div class="pricing-grid">
        <article class="pricing-card">
          <div class="pricing-header">
            <span class="plan-name"> Starter </span>

            <p>Para pequeños negocios que quieren empezar a automatizar su atención.</p>
          </div>

          <div class="price">
            <strong>—</strong>
            <span>/ mes</span>
          </div>

          <RouterLink to="/register" class="pricing-button secondary"> Empezar </RouterLink>

          <div class="plan-features">
            <span>✓ 1 negocio</span>
            <span>✓ Agente IA</span>
            <span>✓ Servicios y horarios</span>
            <span>✓ Historial de conversaciones</span>
            <span>✓ Captura de leads</span>
          </div>
        </article>

        <article class="pricing-card featured">
          <div class="popular-badge">RECOMENDADO</div>

          <div class="pricing-header">
            <span class="plan-name"> Growth </span>

            <p>Para negocios que utilizan AgentFlow como parte de su atención diaria.</p>
          </div>

          <div class="price">
            <strong>—</strong>
            <span>/ mes</span>
          </div>

          <RouterLink to="/register" class="pricing-button primary"> Crear mi agente </RouterLink>

          <div class="plan-features">
            <span>✓ Todo lo incluido en Starter</span>
            <span>✓ Mayor volumen de conversaciones</span>
            <span>✓ Handoff humano</span>
            <span>✓ Gestión avanzada de leads</span>
            <span>✓ Soporte prioritario</span>
          </div>
        </article>

        <article class="pricing-card">
          <div class="pricing-header">
            <span class="plan-name"> Pro </span>

            <p>Para equipos y negocios con necesidades de automatización más avanzadas.</p>
          </div>

          <div class="price">
            <strong>—</strong>
            <span>/ mes</span>
          </div>

          <RouterLink to="/register" class="pricing-button secondary"> Empezar </RouterLink>

          <div class="plan-features">
            <span>✓ Todo lo incluido en Growth</span>
            <span>✓ Mayor capacidad</span>
            <span>✓ Varios negocios</span>
            <span>✓ Funciones avanzadas</span>
            <span>✓ Soporte prioritario</span>
          </div>
        </article>
      </div>

      <p class="pricing-note">Los precios y límites definitivos se anunciarán antes del lanzamiento.</p>
    </section>

    <!-- FAQ -->

    <section class="section faq-section">
      <div class="faq-layout">
        <div class="faq-heading">
          <span class="section-eyebrow"> PREGUNTAS FRECUENTES </span>

          <h2>Todo lo que necesitas saber.</h2>

          <p>Algunas de las preguntas más habituales antes de empezar con AgentFlow.</p>
        </div>

        <div class="faq-list">
          <article
            v-for="(faq, index) in faqs"
            :key="faq.question"
            class="faq-item"
            :class="{ open: openedFaq === index }">
            <button type="button" @click="toggleFaq(index)">
              <span>{{ faq.question }}</span>

              <span class="faq-plus">
                {{ openedFaq === index ? "−" : "+" }}
              </span>
            </button>

            <div v-if="openedFaq === index" class="faq-answer">
              <p>{{ faq.answer }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->

    <section class="final-cta-section">
      <div class="final-cta">
        <div class="cta-glow"></div>

        <div class="cta-content">
          <span class="cta-eyebrow"> EMPIEZA CON AGENTFLOW </span>

          <h2>Tu próximo cliente podría estar escribiéndote ahora.</h2>

          <p>
            Crea tu agente y prepara tu negocio para atender conversaciones incluso cuando tú no estás
            disponible.
          </p>

          <div class="cta-actions">
            <RouterLink to="/register" class="cta-primary">
              Crear mi agente
              <span>→</span>
            </RouterLink>

            <RouterLink to="/login" class="cta-secondary"> Ya tengo una cuenta </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->

    <footer class="footer">
      <div class="footer-main">
        <div class="footer-brand">
          <RouterLink to="/" class="brand">
            <span class="brand-mark footer-mark"> ✦ </span>

            <span>AgentFlow</span>
          </RouterLink>

          <p>Agentes de inteligencia artificial para negocios que quieren atender mejor.</p>
        </div>

        <div class="footer-links">
          <div>
            <strong>Producto</strong>
            <a href="#producto">Funciones</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#precios">Precios</a>
          </div>

          <div>
            <strong>Cuenta</strong>
            <RouterLink to="/login"> Iniciar sesión </RouterLink>
            <RouterLink to="/register"> Crear cuenta </RouterLink>
          </div>

          <div>
            <strong>AgentFlow</strong>
            <a href="#casos">Casos de uso</a>
            <a href="#producto">Producto</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span> © {{ new Date().getFullYear() }} AgentFlow. Todos los derechos reservados. </span>

        <div>
          <span class="online-dot"></span>
          Todos los sistemas operativos
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.landing {
  --landing-text: #0f172a;
  --landing-muted: #64748b;
  --landing-border: #e2e8f0;
  --landing-blue: #2563eb;
  --landing-dark: #0b1120;

  min-height: 100vh;

  overflow: hidden;

  background: #ffffff;
  color: var(--landing-text);
}

/* NAVBAR */

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;

  width: 100%;

  border-bottom: 1px solid rgba(226, 232, 240, 0.85);

  background: rgba(255, 255, 255, 0.88);

  backdrop-filter: blur(18px);
}

.nav-container {
  width: min(1180px, calc(100% - 40px));
  height: 64px;

  display: flex;
  align-items: center;

  margin: 0 auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  color: #0f172a;

  font-size: 13px;
  font-weight: 750;
  letter-spacing: -0.03em;

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
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 28px;

  margin-left: auto;
  margin-right: 32px;
}

.desktop-nav a,
.login-link {
  color: #64748b;

  font-size: 9px;
  font-weight: 550;

  text-decoration: none;

  transition: color 0.15s ease;
}

.desktop-nav a:hover,
.login-link:hover {
  color: #0f172a;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-cta {
  min-height: 34px;

  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 0 13px;

  border-radius: 8px;

  background: #0f172a;
  color: #ffffff;

  font-size: 8px;
  font-weight: 600;

  text-decoration: none;

  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.nav-cta:hover {
  background: #1e293b;

  transform: translateY(-1px);
}

.mobile-menu-button,
.mobile-menu {
  display: none;
}

/* HERO */

.hero {
  position: relative;

  padding: 148px 24px 80px;

  background:
    radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.09), transparent 29%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.hero-glow {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;
}

.hero-glow-one {
  top: 60px;
  left: -250px;

  width: 500px;
  height: 500px;

  border: 1px solid rgba(37, 99, 235, 0.05);
}

.hero-glow-two {
  top: 180px;
  right: -300px;

  width: 600px;
  height: 600px;

  border: 1px solid rgba(99, 102, 241, 0.05);
}

.hero-content {
  position: relative;
  z-index: 2;

  width: min(820px, 100%);

  margin: 0 auto;

  text-align: center;
}

.hero-badge {
  width: fit-content;

  display: flex;
  align-items: center;
  gap: 6px;

  margin: 0 auto 17px;
  padding: 5px 9px;

  border: 1px solid #dbeafe;
  border-radius: 999px;

  background: #eff6ff;
  color: #2563eb;

  font-size: 7px;
  font-weight: 650;
}

.badge-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.hero h1 {
  max-width: 820px;

  margin: 0 auto;

  color: #0f172a;

  font-size: clamp(44px, 6vw, 72px);
  line-height: 0.98;
  letter-spacing: -0.065em;
}

.hero h1 span {
  display: block;

  color: #2563eb;
}

.hero-description {
  max-width: 620px;

  margin: 22px auto 0;

  color: #64748b;

  font-size: 13px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  margin-top: 27px;
}

.primary-button,
.secondary-button {
  min-height: 42px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 17px;

  border-radius: 9px;

  font-size: 9px;
  font-weight: 600;

  text-decoration: none;
}

.primary-button {
  background: #2563eb;
  color: white;

  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
}

.primary-button:hover {
  background: #1d4ed8;
}

.secondary-button {
  border: 1px solid #dfe4ea;

  background: white;
  color: #344054;
}

.secondary-button:hover {
  background: #f8fafc;
}

.hero-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;

  margin-top: 17px;

  color: #94a3b8;

  font-size: 7px;
}

.hero-trust > div {
  display: flex;
  align-items: center;
  gap: 4px;
}

.check {
  color: #22c55e;

  font-weight: 700;
}

/* PRODUCT SHOWCASE */

.product-showcase {
  position: relative;
  z-index: 3;

  width: min(1080px, 100%);

  margin: 65px auto 0;
}

.showcase-shadow {
  position: absolute;
  left: 10%;
  bottom: -30px;

  width: 80%;
  height: 80px;

  border-radius: 50%;

  background: rgba(15, 23, 42, 0.12);

  filter: blur(35px);
}

.browser {
  position: relative;

  overflow: hidden;

  border: 1px solid #dce3eb;
  border-radius: 14px;

  background: white;

  box-shadow:
    0 35px 80px rgba(15, 23, 42, 0.13),
    0 10px 30px rgba(15, 23, 42, 0.06);
}

.browser-top {
  height: 37px;

  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;

  padding: 0 13px;

  border-bottom: 1px solid #e5e7eb;

  background: #f8fafc;
}

.browser-dots {
  display: flex;
  gap: 5px;
}

.browser-dots span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #d1d5db;
}

.browser-address {
  justify-self: center;

  width: 210px;

  padding: 5px 10px;

  border: 1px solid #e5e7eb;
  border-radius: 5px;

  background: white;
  color: #94a3b8;

  font-size: 5px;

  text-align: center;
}

.dashboard {
  height: 540px;

  display: grid;
  grid-template-columns: 155px minmax(0, 1fr);
}

.demo-sidebar {
  display: flex;
  flex-direction: column;

  padding: 17px 12px;

  border-right: 1px solid #e5e7eb;

  background: #ffffff;
}

.demo-brand {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 24px;

  color: #0f172a;

  font-size: 8px;
  font-weight: 700;
}

.demo-brand > span {
  width: 20px;
  height: 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 5px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 6px;
}

.demo-workspace {
  margin-bottom: 6px;

  color: #94a3b8;

  font-size: 4px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.demo-nav {
  min-height: 30px;

  display: flex;
  align-items: center;
  gap: 7px;

  padding: 0 8px;

  border-radius: 6px;

  color: #64748b;

  font-size: 6px;
}

.demo-nav.active {
  background: #eff6ff;
  color: #2563eb;

  font-weight: 600;
}

.demo-icon {
  width: 13px;

  text-align: center;
}

.demo-sidebar-bottom {
  display: flex;
  align-items: center;
  gap: 5px;

  margin-top: auto;
  padding: 8px;

  border: 1px solid #e5e7eb;
  border-radius: 6px;

  color: #64748b;

  font-size: 5px;
}

.online-dot {
  width: 5px;
  height: 5px;

  display: inline-block;

  border-radius: 50%;

  background: #22c55e;
}

.demo-main {
  padding: 24px;

  background: #f8fafc;
}

.demo-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 19px;
}

.demo-eyebrow {
  color: #2563eb;

  font-size: 4px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.demo-header h3 {
  margin: 4px 0 2px;

  color: #0f172a;

  font-size: 17px;
  letter-spacing: -0.04em;
}

.demo-header p {
  margin: 0;

  color: #94a3b8;

  font-size: 6px;
}

.demo-avatar {
  width: 27px;
  height: 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: #0f172a;
  color: white;

  font-size: 6px;
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;

  margin-bottom: 12px;
}

.stat-card {
  padding: 12px;

  border: 1px solid #e2e8f0;
  border-radius: 8px;

  background: white;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  color: #64748b;

  font-size: 5px;
}

.stat-icon {
  width: 20px;
  height: 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 5px;

  font-size: 6px;
}

.stat-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.purple {
  background: #eef2ff;
  color: #4f46e5;
}

.stat-icon.green {
  background: #ecfdf3;
  color: #16a34a;
}

.stat-icon.orange {
  background: #fff7ed;
  color: #ea580c;
}

.stat-card > strong {
  display: block;

  margin: 7px 0 4px;

  color: #0f172a;

  font-size: 16px;
}

.stat-card small {
  color: #94a3b8;

  font-size: 4.5px;
}

.stat-card small b {
  color: #16a34a;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1.55fr 0.75fr;
  gap: 10px;
}

.inbox-card,
.leads-card {
  padding: 13px;

  border: 1px solid #e2e8f0;
  border-radius: 8px;

  background: white;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 12px;
}

.card-heading > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-heading strong {
  color: #0f172a;

  font-size: 7px;
}

.card-heading span {
  color: #94a3b8;

  font-size: 4.5px;
}

.view-all {
  color: #2563eb !important;
}

.conversation-row {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 9px 7px;

  border-bottom: 1px solid #f1f5f9;
}

.conversation-row.highlighted {
  border: 1px solid #dbeafe;
  border-radius: 6px;

  background: #f8fbff;
}

.conversation-avatar {
  width: 24px;
  height: 24px;

  flex: 0 0 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  background: #f1f5f9;
  color: #475569;

  font-size: 6px;
  font-weight: 600;
}

.conversation-avatar.human {
  background: #eff6ff;
  color: #2563eb;
}

.conversation-info {
  min-width: 0;

  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conversation-info strong {
  color: #334155;

  font-size: 6px;
}

.conversation-info span {
  overflow: hidden;

  color: #94a3b8;

  font-size: 5px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.ai-status,
.human-status {
  padding: 2px 5px;

  border-radius: 999px;

  font-size: 4px;
  font-weight: 600;
}

.ai-status {
  background: #ecfdf3;
  color: #15803d;
}

.human-status {
  background: #eff6ff;
  color: #2563eb;
}

.conversation-status small {
  color: #cbd5e1;

  font-size: 4px;
}

.lead-preview {
  padding: 10px;

  border: 1px solid #e5e7eb;
  border-radius: 7px;

  background: #fafafa;
}

.lead-top {
  display: flex;
  align-items: center;

  margin-bottom: 7px;
}

.lead-avatar {
  width: 25px;
  height: 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-right: 6px;

  border-radius: 6px;

  background: #eff6ff;
  color: #2563eb;

  font-size: 5px;
  font-weight: 700;
}

.new-pill {
  margin-left: auto;
  padding: 2px 5px;

  border-radius: 999px;

  background: #ecfdf3;
  color: #15803d;

  font-size: 4px;
}

.lead-preview > strong {
  display: block;

  color: #334155;

  font-size: 6px;
}

.lead-preview > small {
  display: block;

  margin: 2px 0 7px;

  color: #94a3b8;

  font-size: 4.5px;
}

.lead-data {
  display: flex;
  flex-direction: column;
  gap: 3px;

  color: #64748b;

  font-size: 4.5px;
}

.agent-online {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-top: 9px;
  padding: 8px;

  border-radius: 7px;

  background: #0f172a;
}

.agent-symbol {
  width: 22px;
  height: 22px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 5px;

  background: rgba(255, 255, 255, 0.08);
  color: #93c5fd;

  font-size: 6px;
}

.agent-online > div:nth-child(2) {
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 1px;
}

.agent-online strong {
  color: white;

  font-size: 5.5px;
}

.agent-online span {
  color: #64748b;

  font-size: 4px;
}

/* BUSINESS STRIP */

.business-strip {
  padding: 35px 24px;

  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;

  background: white;

  text-align: center;
}

.business-strip p {
  margin: 0 0 18px;

  color: #94a3b8;

  font-size: 8px;
}

.business-types {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;

  color: #64748b;

  font-size: 10px;
  font-weight: 650;
}

.business-types i {
  width: 3px;
  height: 3px;

  border-radius: 50%;

  background: #cbd5e1;
}

/* GENERAL SECTIONS */

.section {
  padding: 110px 24px;
}

.section-heading {
  max-width: 590px;

  margin-bottom: 45px;
}

.section-heading.centered {
  margin-left: auto;
  margin-right: auto;

  text-align: center;
}

.section-eyebrow {
  display: block;

  margin-bottom: 8px;

  color: #2563eb;

  font-size: 7px;
  font-weight: 750;
  letter-spacing: 0.1em;
}

.section-heading h2,
.handoff-copy h2,
.faq-heading h2 {
  margin: 0;

  color: #0f172a;

  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.05;
  letter-spacing: -0.055em;
}

.section-heading p,
.faq-heading p {
  margin: 13px 0 0;

  color: #64748b;

  font-size: 10px;
  line-height: 1.7;
}

/* FEATURES */

.product-section {
  background: #ffffff;
}

.feature-grid {
  width: min(1120px, 100%);

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;

  margin: 0 auto;
}

.feature-card {
  min-height: 390px;

  padding: 28px;

  overflow: hidden;

  border: 1px solid #e2e8f0;
  border-radius: 14px;

  background: linear-gradient(180deg, #ffffff, #fbfdff);
}

.feature-large {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 25px;
  align-items: center;

  grid-column: span 2;
}

.feature-copy {
  max-width: 390px;
}

.feature-icon-box {
  width: 35px;
  height: 35px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 17px;

  border-radius: 9px;

  background: #eff6ff;
  color: #2563eb;

  font-size: 10px;
  font-weight: 700;
}

.green-icon {
  background: #ecfdf3;
  color: #16a34a;
}

.purple-icon {
  background: #eef2ff;
  color: #4f46e5;
}

.feature-label {
  color: #2563eb;

  font-size: 6px;
  font-weight: 700;
  letter-spacing: 0.09em;
}

.feature-card h3 {
  max-width: 420px;

  margin: 7px 0 9px;

  color: #0f172a;

  font-size: 22px;
  line-height: 1.12;
  letter-spacing: -0.04em;
}

.feature-card > p,
.feature-copy p {
  max-width: 390px;

  margin: 0;

  color: #64748b;

  font-size: 9px;
  line-height: 1.65;
}

/* CHAT DEMO */

.chat-demo {
  overflow: hidden;

  border: 1px solid #e2e8f0;
  border-radius: 11px;

  background: #f8fafc;

  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.08);
}

.chat-demo-header {
  display: flex;
  align-items: center;
  gap: 7px;

  padding: 10px;

  border-bottom: 1px solid #e5e7eb;

  background: white;
}

.mini-avatar {
  width: 27px;
  height: 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: #0f172a;
  color: white;

  font-size: 7px;
}

.chat-demo-header > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-demo-header strong {
  color: #334155;

  font-size: 6px;
}

.chat-demo-header span {
  display: flex;
  align-items: center;
  gap: 3px;

  color: #94a3b8;

  font-size: 4px;
}

.chat-demo-header i {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: #22c55e;
}

.mini-chat {
  min-height: 210px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 13px;

  padding: 20px;
}

.mini-message {
  max-width: 75%;

  padding: 9px 11px;

  font-size: 6px;
  line-height: 1.5;
}

.user-message {
  align-self: flex-end;

  border-radius: 9px 9px 3px 9px;

  background: #0f172a;
  color: white;
}

.assistant-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.assistant-symbol {
  width: 22px;
  height: 22px;

  flex: 0 0 22px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  background: #0f172a;
  color: #93c5fd;

  font-size: 6px;
}

.assistant-message {
  border: 1px solid #e5e7eb;
  border-radius: 9px 9px 9px 3px;

  background: white;
  color: #475569;
}

/* LEAD DEMO */

.lead-card-demo {
  margin-top: 32px;
  padding: 15px;

  border: 1px solid #e2e8f0;
  border-radius: 10px;

  background: white;

  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.lead-demo-head {
  display: flex;
  align-items: center;

  padding-bottom: 11px;

  border-bottom: 1px solid #f1f5f9;
}

.lead-demo-avatar {
  width: 29px;
  height: 29px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-right: 7px;

  border-radius: 7px;

  background: #eff6ff;
  color: #2563eb;

  font-size: 6px;
  font-weight: 700;
}

.lead-demo-head > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lead-demo-head strong {
  color: #334155;

  font-size: 7px;
}

.lead-demo-head span {
  color: #94a3b8;

  font-size: 5px;
}

.new-pill {
  margin-left: auto;

  padding: 3px 6px;

  border-radius: 999px;

  background: #ecfdf3;
  color: #15803d !important;

  font-size: 5px !important;
  font-weight: 600;
}

.lead-demo-row {
  display: flex;
  justify-content: space-between;

  padding-top: 10px;

  color: #94a3b8;

  font-size: 6px;
}

.lead-demo-row strong {
  color: #475569;

  font-weight: 550;
}

/* DARK FEATURE */

.dark-feature {
  background: radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.16), transparent 30%), #0f172a;

  border-color: #1e293b;
}

.dark-feature .feature-label {
  color: #93c5fd;
}

.dark-feature h3 {
  color: white;
}

.dark-feature > p {
  color: #94a3b8;
}

.dark-icon {
  background: rgba(59, 130, 246, 0.1);
  color: #93c5fd;
}

.handoff-demo {
  margin-top: 25px;
}

.handoff-line {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 10px;

  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;

  background: rgba(255, 255, 255, 0.04);
}

.handoff-avatar {
  width: 28px;
  height: 28px;

  flex: 0 0 28px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  font-size: 6px;
}

.handoff-avatar.ai {
  background: rgba(59, 130, 246, 0.1);
  color: #93c5fd;
}

.handoff-avatar.person {
  background: #2563eb;
  color: white;
}

.handoff-line > div {
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.handoff-line strong {
  color: #e2e8f0;

  font-size: 6px;
}

.handoff-line > div span {
  color: #64748b;

  font-size: 5px;
}

.status-green,
.status-blue {
  padding: 3px 6px;

  border-radius: 999px;

  font-size: 4px;
}

.status-green {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
}

.status-blue {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
}

.handoff-arrow {
  padding: 4px 0;

  color: #475569;

  font-size: 7px;

  text-align: center;
}

.human-line {
  border-color: rgba(59, 130, 246, 0.16);

  background: rgba(59, 130, 246, 0.05);
}

/* CONTROL DEMO */

.control-demo {
  min-height: 250px;

  display: grid;
  grid-template-columns: 48px 1fr;

  overflow: hidden;

  border: 1px solid #e2e8f0;
  border-radius: 10px;

  background: white;

  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.07);
}

.control-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  padding-top: 20px;

  border-right: 1px solid #e5e7eb;
}

.control-nav span {
  width: 20px;
  height: 20px;

  border-radius: 5px;

  background: #f1f5f9;
}

.control-nav span.selected {
  background: #dbeafe;
}

.control-content {
  padding: 20px;
}

.control-title {
  display: flex;
  flex-direction: column;
  gap: 5px;

  margin-bottom: 20px;
}

.control-title span:first-child {
  width: 45px;
  height: 4px;

  border-radius: 999px;

  background: #93c5fd;
}

.control-title span:last-child {
  width: 100px;
  height: 9px;

  border-radius: 3px;

  background: #334155;
}

.control-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}

.control-stats > div {
  height: 55px;

  padding: 9px;

  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.control-stats small,
.control-stats strong {
  display: block;

  border-radius: 999px;
}

.control-stats small {
  width: 40px;
  height: 4px;

  margin-bottom: 8px;

  background: #cbd5e1;
}

.control-stats strong {
  width: 28px;
  height: 8px;

  background: #64748b;
}

.control-table {
  display: flex;
  flex-direction: column;
  gap: 10px;

  margin-top: 15px;
  padding: 12px;

  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.control-table span {
  width: 100%;
  height: 7px;

  border-radius: 3px;

  background: #f1f5f9;
}

/* HOW */

.how-section {
  background: #f8fafc;
}

.how-section > .section-heading,
.steps-grid {
  width: min(1120px, 100%);

  margin-left: auto;
  margin-right: auto;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.process-step {
  position: relative;

  padding: 25px 28px 25px 0;

  border-top: 1px solid #cbd5e1;
}

.process-step:not(:last-child) {
  margin-right: 22px;
}

.step-number {
  position: absolute;
  top: -8px;
  right: 0;

  padding-left: 7px;

  background: #f8fafc;
  color: #94a3b8;

  font-size: 6px;
  font-weight: 700;
}

.process-icon {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 16px;

  border: 1px solid #dbeafe;
  border-radius: 9px;

  background: #eff6ff;
  color: #2563eb;

  font-size: 10px;
}

.process-step h3 {
  margin: 0 0 7px;

  color: #0f172a;

  font-size: 13px;
  letter-spacing: -0.025em;
}

.process-step p {
  margin: 0;

  color: #64748b;

  font-size: 8px;
  line-height: 1.65;
}

/* BIG HANDOFF */

.handoff-section {
  padding: 110px 24px;

  background: radial-gradient(circle at 75% 50%, rgba(37, 99, 235, 0.15), transparent 30%), #0b1120;
}

.handoff-container {
  width: min(1120px, 100%);

  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  align-items: center;
  gap: 70px;

  margin: 0 auto;
}

.section-eyebrow.light {
  color: #60a5fa;
}

.handoff-copy h2 {
  color: white;
}

.handoff-copy > p {
  max-width: 480px;

  margin: 14px 0 0;

  color: #94a3b8;

  font-size: 10px;
  line-height: 1.7;
}

.handoff-points {
  display: flex;
  flex-direction: column;
  gap: 10px;

  margin: 25px 0;
}

.handoff-points > div {
  display: flex;
  align-items: center;
  gap: 7px;

  color: #cbd5e1;

  font-size: 8px;
}

.handoff-points > div > span {
  width: 18px;
  height: 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;

  font-size: 6px;
}

.light-button {
  min-height: 39px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 0 14px;

  border-radius: 8px;

  background: white;
  color: #0f172a;

  font-size: 8px;
  font-weight: 600;

  text-decoration: none;
}

/* SUPPORT WINDOW */

.support-window {
  overflow: hidden;

  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 13px;

  background: white;

  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.3);
}

.support-header {
  min-height: 57px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 15px;

  border-bottom: 1px solid #e5e7eb;
}

.support-header > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.support-back {
  color: #64748b;

  font-size: 9px;
}

.support-header > div > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.support-header strong {
  color: #334155;

  font-size: 7px;
}

.support-header small {
  color: #94a3b8;

  font-size: 5px;
}

.human-pill {
  padding: 4px 7px;

  border-radius: 999px;

  background: #eff6ff;
  color: #2563eb;

  font-size: 5px;
  font-weight: 600;
}

.support-body {
  min-height: 310px;

  display: flex;
  flex-direction: column;
  gap: 13px;

  padding: 24px;

  background: #f8fafc;
}

.support-message {
  max-width: 72%;
}

.support-message small {
  display: block;

  margin-bottom: 4px;

  color: #94a3b8;

  font-size: 5px;
}

.support-message p {
  margin: 0;
  padding: 10px 12px;

  border: 1px solid #e5e7eb;
  border-radius: 9px;

  background: white;
  color: #475569;

  font-size: 7px;
  line-height: 1.5;
}

.support-message.right {
  align-self: flex-end;
}

.support-message.right small {
  text-align: right;
}

.support-message.right p {
  border: 0;

  background: #0f172a;
  color: white;
}

.handoff-notice {
  align-self: center;

  display: flex;
  align-items: center;
  gap: 8px;

  margin-top: 10px;
  padding: 8px 10px;

  border: 1px solid #dbeafe;
  border-radius: 8px;

  background: #eff6ff;
}

.handoff-notice > span {
  width: 23px;
  height: 23px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  background: #dbeafe;
  color: #2563eb;

  font-size: 7px;
}

.handoff-notice > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.handoff-notice strong {
  color: #1d4ed8;

  font-size: 6px;
}

.handoff-notice small {
  color: #64748b;

  font-size: 5px;
}

.support-footer {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 11px;

  border-top: 1px solid #e5e7eb;

  background: white;
}

.support-footer > span {
  flex: 1;

  padding: 9px;

  border: 1px solid #e5e7eb;
  border-radius: 7px;

  color: #94a3b8;

  font-size: 6px;
}

.support-footer button {
  padding: 9px 13px;

  border: 0;
  border-radius: 7px;

  background: #2563eb;
  color: white;

  font-size: 6px;
}

/* CASES */

.cases-section {
  background: white;
}

.cases-grid {
  width: min(1050px, 100%);

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  margin: 0 auto;
}

.case-card {
  padding: 25px;

  border: 1px solid #e2e8f0;
  border-radius: 12px;

  background: white;

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.case-card:hover {
  transform: translateY(-3px);

  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.06);
}

.case-icon {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 18px;

  border-radius: 9px;

  background: #f1f5f9;
  color: #475569;

  font-size: 10px;
  font-weight: 650;
}

.case-card h3 {
  margin: 0 0 7px;

  color: #0f172a;

  font-size: 12px;
}

.case-card p {
  margin: 0;

  color: #64748b;

  font-size: 8px;
  line-height: 1.65;
}

/* PRICING */

.pricing-section {
  background: #f8fafc;
}

.pricing-grid {
  width: min(980px, 100%);

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  margin: 0 auto;
}

.pricing-card {
  position: relative;

  padding: 25px;

  border: 1px solid #e2e8f0;
  border-radius: 13px;

  background: white;
}

.pricing-card.featured {
  border-color: #93c5fd;

  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.09);
}

.popular-badge {
  position: absolute;
  top: -9px;
  left: 50%;

  padding: 4px 8px;

  border-radius: 999px;

  background: #2563eb;
  color: white;

  font-size: 5px;
  font-weight: 700;
  letter-spacing: 0.07em;

  transform: translateX(-50%);
}

.plan-name {
  color: #0f172a;

  font-size: 12px;
  font-weight: 700;
}

.pricing-header p {
  min-height: 42px;

  margin: 7px 0 0;

  color: #64748b;

  font-size: 7px;
  line-height: 1.55;
}

.price {
  display: flex;
  align-items: flex-end;
  gap: 5px;

  margin: 20px 0;
}

.price strong {
  color: #0f172a;

  font-size: 30px;
  letter-spacing: -0.04em;
}

.price span {
  padding-bottom: 5px;

  color: #94a3b8;

  font-size: 6px;
}

.pricing-button {
  width: 100%;
  min-height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  font-size: 8px;
  font-weight: 600;

  text-decoration: none;
}

.pricing-button.primary {
  background: #2563eb;
  color: white;
}

.pricing-button.secondary {
  border: 1px solid #dfe4ea;

  color: #334155;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 10px;

  margin-top: 21px;
  padding-top: 18px;

  border-top: 1px solid #f1f5f9;

  color: #64748b;

  font-size: 7px;
}

.plan-features span::first-letter {
  color: #22c55e;
}

.pricing-note {
  margin: 20px 0 0;

  color: #94a3b8;

  font-size: 7px;

  text-align: center;
}

/* FAQ */

.faq-section {
  background: white;
}

.faq-layout {
  width: min(1000px, 100%);

  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 80px;

  margin: 0 auto;
}

.faq-heading p {
  max-width: 330px;
}

.faq-list {
  border-top: 1px solid #e2e8f0;
}

.faq-item {
  border-bottom: 1px solid #e2e8f0;
}

.faq-item button {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 18px 0;

  border: 0;

  background: transparent;
  color: #334155;

  font: inherit;
  font-size: 9px;
  font-weight: 600;

  text-align: left;

  cursor: pointer;
}

.faq-plus {
  color: #94a3b8;

  font-size: 14px;
  font-weight: 400;
}

.faq-answer {
  padding: 0 30px 17px 0;
}

.faq-answer p {
  margin: 0;

  color: #64748b;

  font-size: 8px;
  line-height: 1.7;
}

/* CTA */

.final-cta-section {
  padding: 30px 24px 100px;

  background: white;
}

.final-cta {
  position: relative;

  width: min(1120px, 100%);

  overflow: hidden;

  margin: 0 auto;
  padding: 75px 30px;

  border-radius: 18px;

  background: radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2), transparent 30%), #0b1120;

  text-align: center;
}

.cta-glow {
  position: absolute;
  top: -250px;
  left: 50%;

  width: 600px;
  height: 600px;

  border: 1px solid rgba(147, 197, 253, 0.07);
  border-radius: 50%;

  transform: translateX(-50%);
}

.cta-content {
  position: relative;
  z-index: 1;

  max-width: 650px;

  margin: 0 auto;
}

.cta-eyebrow {
  color: #60a5fa;

  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.cta-content h2 {
  margin: 9px 0 0;

  color: white;

  font-size: clamp(32px, 4vw, 50px);
  line-height: 1.03;
  letter-spacing: -0.055em;
}

.cta-content p {
  max-width: 500px;

  margin: 15px auto 0;

  color: #94a3b8;

  font-size: 10px;
  line-height: 1.7;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 9px;

  margin-top: 24px;
}

.cta-primary,
.cta-secondary {
  min-height: 40px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 0 15px;

  border-radius: 8px;

  font-size: 8px;
  font-weight: 600;

  text-decoration: none;
}

.cta-primary {
  background: white;
  color: #0f172a;
}

.cta-secondary {
  border: 1px solid rgba(255, 255, 255, 0.14);

  color: #cbd5e1;
}

/* FOOTER */

.footer {
  padding: 55px 24px 25px;

  border-top: 1px solid #e5e7eb;

  background: #f8fafc;
}

.footer-main {
  width: min(1120px, 100%);

  display: flex;
  justify-content: space-between;
  gap: 80px;

  margin: 0 auto;
}

.footer-brand {
  max-width: 250px;
}

.footer-brand p {
  margin: 13px 0 0;

  color: #94a3b8;

  font-size: 7px;
  line-height: 1.65;
}

.footer-links {
  display: flex;
  gap: 75px;
}

.footer-links > div {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.footer-links strong {
  margin-bottom: 2px;

  color: #334155;

  font-size: 7px;
}

.footer-links a {
  color: #94a3b8;

  font-size: 7px;

  text-decoration: none;
}

.footer-links a:hover {
  color: #2563eb;
}

.footer-bottom {
  width: min(1120px, 100%);

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin: 45px auto 0;
  padding-top: 18px;

  border-top: 1px solid #e2e8f0;

  color: #94a3b8;

  font-size: 6px;
}

.footer-bottom > div {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* RESPONSIVE */

@media (max-width: 950px) {
  .desktop-nav {
    display: none;
  }

  .nav-actions {
    margin-left: auto;
  }

  .dashboard {
    height: 470px;

    grid-template-columns: 125px minmax(0, 1fr);
  }

  .demo-main {
    padding: 18px;
  }

  .feature-large,
  .handoff-container {
    gap: 35px;
  }

  .faq-layout {
    gap: 45px;
  }
}

@media (max-width: 760px) {
  .nav-actions,
  .desktop-nav {
    display: none;
  }

  .mobile-menu-button {
    width: 32px;
    height: 32px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    margin-left: auto;

    border: 1px solid #e2e8f0;
    border-radius: 7px;

    background: white;
  }

  .mobile-menu-button span {
    width: 13px;
    height: 1px;

    background: #475569;
  }

  .mobile-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;

    padding: 10px 20px 18px;

    border-top: 1px solid #f1f5f9;

    background: white;
  }

  .mobile-menu > a {
    padding: 9px 0;

    color: #475569;

    font-size: 9px;

    text-decoration: none;
  }

  .mobile-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;

    margin-top: 7px;
  }

  .mobile-actions a {
    min-height: 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 1px solid #e2e8f0;
    border-radius: 8px;

    color: #334155;

    font-size: 8px;
    font-weight: 600;

    text-decoration: none;
  }

  .mobile-actions .mobile-register {
    border-color: #2563eb;

    background: #2563eb;
    color: white;
  }

  .hero {
    padding-top: 120px;
  }

  .hero h1 {
    font-size: clamp(39px, 11vw, 58px);
  }

  .product-showcase {
    margin-top: 45px;
  }

  .dashboard {
    height: 400px;

    grid-template-columns: 90px minmax(0, 1fr);
  }

  .demo-sidebar {
    padding: 12px 7px;
  }

  .demo-nav {
    font-size: 4.5px;
  }

  .demo-main {
    padding: 12px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats .stat-card:nth-child(n + 3) {
    display: none;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .leads-card {
    display: none;
  }

  .business-types {
    flex-wrap: wrap;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-card,
  .feature-large {
    grid-column: auto;
  }

  .feature-large {
    grid-template-columns: 1fr;
  }

  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 25px;
  }

  .handoff-container {
    grid-template-columns: 1fr;
  }

  .cases-grid,
  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pricing-card.featured {
    order: -1;
  }

  .faq-layout {
    grid-template-columns: 1fr;
  }

  .footer-main {
    flex-direction: column;
  }
}

@media (max-width: 540px) {
  .nav-container {
    width: calc(100% - 30px);
  }

  .hero {
    padding: 110px 16px 60px;
  }

  .hero-description {
    font-size: 11px;
  }

  .hero-actions {
    align-items: stretch;
    flex-direction: column;

    max-width: 300px;

    margin-left: auto;
    margin-right: auto;
  }

  .hero-trust {
    flex-direction: column;
    gap: 7px;
  }

  .browser-top {
    height: 30px;
  }

  .browser-address {
    width: 130px;
  }

  .dashboard {
    height: 360px;

    grid-template-columns: 55px minmax(0, 1fr);
  }

  .demo-brand {
    justify-content: center;

    font-size: 0;
  }

  .demo-brand > span {
    width: 22px;
    height: 22px;
  }

  .demo-workspace,
  .demo-nav {
    font-size: 0;
  }

  .demo-nav {
    justify-content: center;
  }

  .demo-icon {
    font-size: 8px;
  }

  .demo-sidebar-bottom {
    justify-content: center;

    font-size: 0;
  }

  .demo-main {
    padding: 10px;
  }

  .demo-header h3 {
    font-size: 13px;
  }

  .demo-header p {
    display: none;
  }

  .stat-card {
    padding: 8px;
  }

  .stat-card > strong {
    font-size: 12px;
  }

  .conversation-row {
    padding: 7px 3px;
  }

  .business-types i {
    display: none;
  }

  .section {
    padding: 80px 17px;
  }

  .feature-card {
    min-height: auto;

    padding: 22px;
  }

  .steps-grid,
  .cases-grid,
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .process-step:not(:last-child) {
    margin-right: 0;
  }

  .handoff-section {
    padding: 80px 17px;
  }

  .support-body {
    min-height: 270px;

    padding: 16px;
  }

  .support-message {
    max-width: 88%;
  }

  .final-cta-section {
    padding: 20px 17px 70px;
  }

  .final-cta {
    padding: 55px 20px;
  }

  .cta-actions {
    flex-direction: column;

    max-width: 260px;

    margin-left: auto;
    margin-right: auto;
  }

  .footer {
    padding: 45px 20px 22px;
  }

  .footer-links {
    flex-wrap: wrap;
    gap: 35px;
  }

  .footer-bottom {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }
}
/* =========================
   LANDING TYPOGRAPHY FIX
========================= */

/* NAVBAR */

.brand {
  font-size: 15px;
}

.brand-mark {
  font-size: 12px;
}

.desktop-nav a,
.login-link {
  font-size: 14px;
}

.nav-cta {
  min-height: 38px;
  padding: 0 15px;
  font-size: 13px;
}

/* HERO */

.hero-badge {
  padding: 6px 11px;
  font-size: 12px;
}

.hero-description {
  max-width: 650px;
  font-size: 17px;
  line-height: 1.65;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  padding: 0 19px;
  font-size: 14px;
}

.hero-trust {
  font-size: 12px;
}

/* BUSINESS STRIP */

.business-strip p {
  font-size: 13px;
}

.business-types {
  font-size: 14px;
}

/* SECTION HEADERS */

.section-eyebrow {
  font-size: 12px;
}

.section-heading p,
.faq-heading p {
  font-size: 15px;
  line-height: 1.7;
}

/* FEATURE CARDS */

.feature-icon-box {
  font-size: 14px;
}

.feature-label {
  font-size: 12px;
}

.feature-card h3 {
  font-size: 24px;
}

.feature-card > p,
.feature-copy p {
  font-size: 14px;
  line-height: 1.65;
}

/* HOW IT WORKS */

.step-number {
  font-size: 11px;
}

.process-icon {
  font-size: 14px;
}

.process-step h3 {
  font-size: 17px;
}

.process-step p {
  font-size: 14px;
  line-height: 1.65;
}

/* HANDOFF SECTION */

.handoff-copy > p {
  font-size: 15px;
  line-height: 1.7;
}

.handoff-points > div {
  font-size: 14px;
}

.handoff-points > div > span {
  font-size: 10px;
}

.light-button {
  min-height: 42px;
  padding: 0 16px;
  font-size: 14px;
}

/* CASES */

.case-icon {
  font-size: 14px;
}

.case-card h3 {
  font-size: 17px;
}

.case-card p {
  font-size: 14px;
  line-height: 1.65;
}

/* PRICING */

.popular-badge {
  font-size: 11px;
}

.plan-name {
  font-size: 17px;
}

.pricing-header p {
  min-height: 48px;
  font-size: 14px;
  line-height: 1.55;
}

.price strong {
  font-size: 36px;
}

.price span {
  font-size: 13px;
}

.pricing-button {
  min-height: 42px;
  font-size: 14px;
}

.plan-features {
  font-size: 14px;
  line-height: 1.5;
}

.pricing-note {
  font-size: 13px;
}

/* FAQ */

.faq-item button {
  font-size: 15px;
}

.faq-plus {
  font-size: 18px;
}

.faq-answer p {
  font-size: 14px;
  line-height: 1.7;
}

/* FINAL CTA */

.cta-eyebrow {
  font-size: 12px;
}

.cta-content p {
  font-size: 15px;
  line-height: 1.7;
}

.cta-primary,
.cta-secondary {
  min-height: 43px;
  padding: 0 17px;
  font-size: 14px;
}

/* FOOTER */

.footer-brand p {
  font-size: 13px;
}

.footer-links strong {
  font-size: 13px;
}

.footer-links a {
  font-size: 13px;
}

.footer-bottom {
  font-size: 12px;
}

/* MOBILE */

@media (max-width: 760px) {
  .mobile-menu > a {
    font-size: 14px;
  }

  .mobile-actions a {
    min-height: 40px;
    font-size: 13px;
  }
}

@media (max-width: 540px) {
  .hero-description {
    font-size: 15px;
  }

  .primary-button,
  .secondary-button {
    font-size: 14px;
  }

  .section-heading p,
  .faq-heading p {
    font-size: 14px;
  }
}
</style>
