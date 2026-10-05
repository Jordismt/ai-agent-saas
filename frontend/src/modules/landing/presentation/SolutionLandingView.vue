<script setup>
import { getSolutionPage } from '../seo/solutionPages.js';
import SolutionDemo from './components/SolutionDemo.vue';
import './solutionLanding.css';
const props = defineProps({ path: { type: String, required: true } });
const page = getSolutionPage(props.path);
</script>
<template>
  <div class="seo-landing" :class="'seo-' + page.kind">
    <a class="seo-skip" href="#contenido">Ir al contenido</a>
    <header class="seo-header seo-container"><a href="/" class="seo-brand" aria-label="Resbix, inicio">Resbix<span>.</span></a><nav aria-label="Navegación principal"><a href="/#precios">Precios</a><a href="/login">Iniciar sesión</a><a href="/register" class="seo-button">Crear cuenta ↗</a></nav></header>
    <main id="contenido">
      <div class="seo-container"><nav class="seo-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">{{ page.label }}</span></nav></div>
      <section class="seo-hero seo-container"><div><p class="seo-kicker">{{ page.eyebrow }}</p><h1>{{ page.h1 }}</h1><p class="seo-lead">{{ page.lead }}</p><div class="seo-actions"><a class="seo-button" href="/register">Crear mi cuenta ↗</a><a class="seo-button seo-secondary" href="#demo">Probar el ejemplo ↓</a></div><a class="seo-terms" href="/#precios">Consulta el plan y las condiciones de la prueba de 7 días</a></div>
        <aside class="seo-hero-visual" aria-label="Ejemplo ilustrativo del recorrido del cliente"><span class="seo-kicker">{{ page.demo.business }}</span><p class="hero-message">“{{ page.demo.question }}”</p><div v-if="page.kind === 'agente'" class="hero-context"><span>01 · Información del negocio</span><span>02 · Respuesta a la consulta</span><span>03 · Contacto para seguimiento</span></div><div v-else class="hero-ticket"><strong>{{ page.demo.slots[1] }}</strong><div><b>{{ page.demo.service }}</b><p>{{ page.demo.professionals[0] }} · {{ page.demo.duration }}</p><small>{{ page.demo.day }} · Ejemplo ficticio</small></div></div><p class="hero-note">{{ page.heroNote }}</p><a href="#demo">Explorar la simulación ↗</a></aside>
      </section>
      <section class="seo-section seo-tinted"><div class="seo-container seo-explainer"><div><p class="seo-kicker">{{ page.kind === 'agente' ? 'QUÉ ES' : 'EL DÍA A DÍA' }}</p><h2>{{ page.problemTitle }}</h2></div><p>{{ page.problem }}</p></div></section>
      <section v-if="page.kind === 'agente'" class="seo-section seo-container"><p class="seo-kicker">CÓMO FUNCIONA</p><h2>{{ page.workflowTitle }}</h2><ol class="seo-steps"><li v-for="(step, i) in page.steps" :key="step[0]"><span class="step-number">0{{ i + 1 }}</span><h3>{{ step[0] }}</h3><p>{{ step[1] }}</p></li></ol></section>
      <section class="seo-section seo-container"><p class="seo-kicker">{{ page.kind === 'agente' ? 'QUÉ PUEDE HACER EN RESBIX' : 'CASOS DE USO' }}</p><h2>{{ page.kind === 'agente' ? 'Consultas, contactos y reservas: tres necesidades distintas' : 'Una respuesta útil para lo que tus clientes necesitan' }}</h2><div class="seo-cards"><article v-for="item in page.cases" :key="item[0]"><h3>{{ item[0] }}</h3><p>{{ item[1] }}</p></article></div></section>
      <section id="demo" class="seo-section seo-tinted"><div class="seo-container"><p class="seo-kicker">{{ page.kind === 'agente' ? 'EJEMPLO SIN RESERVA' : 'PRUEBA EL RECORRIDO' }}</p><h2>{{ page.demoTitle }}</h2><p class="seo-section-lead">{{ page.demoText }}</p><SolutionDemo :scenario="page.demo" :lead="page.kind === 'agente'" /></div></section>
      <section v-if="page.kind !== 'agente'" class="seo-section seo-container"><p class="seo-kicker">CONFIGURACIÓN</p><h2>{{ page.workflowTitle }}</h2><ol class="seo-steps"><li v-for="(step, i) in page.steps" :key="step[0]"><span class="step-number">0{{ i + 1 }}</span><h3>{{ step[0] }}</h3><p>{{ step[1] }}</p></li></ol></section>
      <section class="seo-section seo-container seo-explainer"><div><p class="seo-kicker">{{ page.kind === 'agente' ? 'RESBIX EN LA PRÁCTICA' : 'GESTIÓN POSTERIOR' }}</p><h2>{{ page.benefitsTitle }}</h2><p>{{ page.benefits }}</p><a href="/">Explora el producto completo de Resbix ↗</a></div><aside class="seo-advice"><h3>{{ page.adviceTitle }}</h3><p>{{ page.advice }}</p></aside></section>
      <section class="seo-section seo-tinted"><div class="seo-container seo-faq"><p class="seo-kicker">PREGUNTAS FRECUENTES</p><h2>{{ page.kind === 'agente' ? 'Dudas sobre los agentes IA y Resbix' : 'Antes de configurar tu negocio' }}</h2><details v-for="faq in page.faq" :key="faq[0]"><summary>{{ faq[0] }}</summary><p>{{ faq[1] }}</p></details></div></section>
      <section class="seo-section seo-container"><div class="seo-final-cta"><h2>{{ page.ctaTitle }}</h2><p>Crea tu cuenta y configura Resbix con la información de tu negocio. La prueba de 7 días requiere tarjeta, sin cobro inicial.</p><div class="seo-actions"><a href="/register" class="seo-button">Crear mi cuenta ↗</a><a href="/#precios" class="seo-button seo-secondary">Ver precios y condiciones</a></div></div><nav class="seo-related" aria-label="Recursos relacionados"><a v-for="link in page.related" :key="link[0]" :href="link[0]">{{ link[1] }} ↗</a></nav></section>
    </main>
    <footer class="seo-footer seo-container"><a href="/" class="seo-brand">Resbix<span>.</span></a><nav aria-label="Información legal"><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav></footer>
  </div>
</template>
