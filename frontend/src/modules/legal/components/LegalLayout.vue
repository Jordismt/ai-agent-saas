<script setup>
import { RouterLink } from "vue-router";

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
});

const links = [
  { label: "Aviso legal", to: "/aviso-legal" },
  { label: "Privacidad", to: "/privacidad" },
  { label: "Cookies", to: "/cookies" },
  { label: "Términos", to: "/terminos" },
  { label: "Protección de datos", to: "/tratamiento-datos" },
];
</script>

<template>
  <div class="legal-page">
    <header class="legal-header">
      <RouterLink to="/" class="legal-brand">
        <span class="brand-icon">✦</span>
        Resbix
      </RouterLink>

      <RouterLink to="/" class="back-link"> ← Volver al inicio </RouterLink>
    </header>

    <main class="legal-container">
      <div class="legal-intro">
        <span class="legal-eyebrow"> RESBIX · INFORMACIÓN LEGAL </span>

        <h1>{{ title }}</h1>

        <p v-if="subtitle">{{ subtitle }}</p>

        <span class="legal-date"> Última actualización: 25 de septiembre de 2026 </span>
      </div>

      <div class="legal-content">
        <article class="legal-article">
          <slot />
        </article>

        <aside class="legal-sidebar">
          <h3>Documentación legal</h3>

          <nav>
            <RouterLink v-for="link in links" :key="link.to" :to="link.to" active-class="active">
              {{ link.label }}
              <span>↗</span>
            </RouterLink>
          </nav>
        </aside>
      </div>
    </main>

    <footer class="legal-footer">
      <RouterLink to="/" class="footer-brand"> ✦ Resbix </RouterLink>

      <div class="footer-links">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">
          {{ link.label }}
        </RouterLink>
      </div>

      <p>© {{ new Date().getFullYear() }} Resbix.</p>
    </footer>
  </div>
</template>

<style>
.legal-page {
  min-height: 100vh;
  background: #080b12;
  color: #e5e7eb;
  font-family: Inter, system-ui, sans-serif;
}

.legal-header {
  max-width: 1200px;
  margin: auto;
  padding: 26px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ffffff12;
}

.legal-header a,
.legal-footer a {
  text-decoration: none;
}

.legal-brand {
  font-size: 24px;
  font-weight: 900;
  color: white;
}

.brand-icon {
  color: #818cf8;
}

.back-link {
  color: #9ca3af;
  font-size: 14px;
}

.back-link:hover {
  color: white;
}

.legal-container {
  max-width: 1200px;
  margin: auto;
  padding: 85px 32px 110px;
}

.legal-intro {
  max-width: 800px;
  margin-bottom: 70px;
}

.legal-eyebrow {
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #818cf8;
}

.legal-intro h1 {
  font-size: clamp(38px, 6vw, 65px);
  font-weight: 900;
  letter-spacing: -2px;
  margin: 18px 0;
  color: white;
}

.legal-intro p {
  color: #9ca3af;
  line-height: 1.8;
  font-size: 17px;
}

.legal-date {
  display: inline-block;
  margin-top: 20px;
  color: #6b7280;
  font-size: 12px;
}

.legal-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 75px;
  align-items: start;
}

.legal-article {
  min-width: 0;
}

.legal-article h2 {
  color: white;
  font-size: 22px;
  font-weight: 800;
  margin: 42px 0 16px;
}

.legal-article h2:first-child {
  margin-top: 0;
}

.legal-article h3 {
  color: white;
  font-size: 17px;
  margin: 25px 0 12px;
}

.legal-article p,
.legal-article li {
  color: #a1a1aa;
  font-size: 15px;
  line-height: 1.95;
}

.legal-article p {
  margin-bottom: 17px;
}

.legal-article ul {
  padding-left: 22px;
  margin-bottom: 22px;
}

.legal-article li {
  margin-bottom: 8px;
}

.legal-article a {
  color: #a5b4fc;
}

.legal-article strong {
  color: #e5e7eb;
}

.legal-article .legal-notice {
  padding: 22px;
  margin: 28px 0;
  border: 1px solid #6366f144;
  border-radius: 14px;
  background: #6366f10c;
}

.legal-sidebar {
  position: sticky;
  top: 30px;
  padding: 25px;
  border: 1px solid #ffffff12;
  border-radius: 16px;
  background: #ffffff05;
}

.legal-sidebar h3 {
  color: white;
  margin: 0 0 20px;
  font-size: 14px;
}

.legal-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.legal-sidebar a {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 13px;
  text-decoration: none;
  transition: 0.2s;
}

.legal-sidebar a:hover,
.legal-sidebar a.active {
  color: white;
  background: #6366f122;
}

.legal-footer {
  border-top: 1px solid #ffffff12;
  padding: 40px 32px;
  text-align: center;
}

.footer-brand {
  color: white;
  font-size: 20px;
  font-weight: 900;
}

.footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin: 25px 0;
}

.footer-links a {
  color: #9ca3af;
  font-size: 12px;
}

.legal-footer p {
  color: #6b7280;
  font-size: 12px;
}

@media (max-width: 850px) {
  .legal-content {
    grid-template-columns: 1fr;
  }

  .legal-sidebar {
    position: static;
    grid-row: 1;
  }

  .legal-container {
    padding: 55px 22px;
  }

  .legal-header {
    padding: 22px;
  }
}
</style>
