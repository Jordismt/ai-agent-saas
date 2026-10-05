import { landingSeo, structuredData } from "./content.js";

const privatePath =
  /^\/(?:dashboard|businesses|settings|login|register|forgot-password|reset-password|booking|chat)(?:\/|$)/;
const legalPaths = new Set([
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
  "/tratamiento-datos",
]);
function meta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, value);
}
// Metadata only. Does not redirect, authenticate or alter route components.
export function installLandingMetadata(router) {
  router.afterEach((to) => {
    if (to.path === "/") {
      document.title = landingSeo.title;
      meta('meta[name="description"]', {
        name: "description",
        content: landingSeo.description,
      });
      meta('meta[name="robots"]', {
        name: "robots",
        content: "index, follow, max-image-preview:large",
      });
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = landingSeo.url;
      const og = {
        type: "website",
        site_name: "Resbix",
        locale: "es_ES",
        title: landingSeo.title,
        description:
          "Tu web pública, tu agente IA y tu agenda, en un mismo lugar. Atiende consultas, capta contactos y organiza las reservas de tu negocio.",
        url: landingSeo.url,
        image: landingSeo.image,
        "image:width": "1200",
        "image:height": "630",
        "image:alt":
          "Resbix: agente IA, web pública y reservas para negocios de servicios",
      };
      for (const [key, content] of Object.entries(og))
        meta(`meta[property="og:${key}"]`, { property: `og:${key}`, content });
      const twitter = {
        card: "summary_large_image",
        title: landingSeo.title,
        description:
          "Atiende consultas y organiza reservas. Tu web pública, tu agente IA y tu agenda, en un mismo lugar.",
        image: landingSeo.image,
        "image:alt": og["image:alt"],
      };
      for (const [key, content] of Object.entries(twitter))
        meta(`meta[name="twitter:${key}"]`, {
          name: `twitter:${key}`,
          content,
        });
      let schema = document.getElementById("landing-schema");
      if (!schema) {
        schema = document.createElement("script");
        schema.id = "landing-schema";
        schema.type = "application/ld+json";
        document.head.appendChild(schema);
      }
      schema.textContent = JSON.stringify(structuredData);
    } else {
      // Prevent inherited landing claims/canonical on another route in this SPA.
      document.title = "Resbix";
      document.head
        .querySelectorAll(
          'meta[name="description"],link[rel="canonical"],meta[property^="og:"],meta[name^="twitter:"],#landing-schema',
        )
        .forEach((element) => element.remove());
      meta('meta[name="robots"]', {
        name: "robots",
        content: privatePath.test(to.path)
          ? "noindex, nofollow"
          : "index, follow",
      });
      if (legalPaths.has(to.path)) {
        const canonical = document.createElement("link");
        canonical.rel = "canonical";
        canonical.href = `https://resbix.com${to.path}`;
        document.head.appendChild(canonical);
      }
    }
  });
}
