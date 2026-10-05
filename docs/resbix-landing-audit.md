# Resbix — mejora de la landing y auditoría SEO

Fecha: 5 de octubre de 2026. Cambios locales, sin publicación ni cambios de datos reales.

## UI/UX

### Estado encontrado

- Identidad existente: violeta, tinta oscura, fondos suaves, tipografía sans serif y representaciones del producto. Se conserva esta dirección visual.
- H1 centrado en una promesa («Tu próximo cliente no debería esperar») que no explicaba inmediatamente qué software era Resbix.
- Hero con un chat inclinado, elementos flotantes y una conversación inconclusa, sin mostrar su resultado.
- Demo limitada a cambiar pantallas ficticias de reservas, leads, conversaciones y web. Algunos botones de la sidebar conducían a reservas aunque su etiqueta describiera otra sección.
- Un carácter `>` sobrante en el menú móvil; tabs con semántica ARIA incompleta; FAQ creada solo al abrir cada pregunta.
- Fuentes remotas mediante `@import`, textos secundarios demasiado claros y favicon original de 1.053.654 bytes.
- Una misma entrada cargaba todos los módulos del SaaS en la portada.

### Mejoras

- Hero con producto, destinatarios y resultado explícitos. CTA principal «Crear mi cuenta» y secundario «Probar la demo». Destinos `/register` y `#demo` conservados.
- Vista del producto en el hero: consulta → asistencia → cita confirmada. Sin efectos flotantes que dificulten leerla.
- Narrativa: propuesta → sectores → problemas reales → demo guiada → capacidades → panel/web → configuración → sectores → precio → FAQ → CTA final.
- Se conservan las presentaciones visuales de funcionalidades y de panel/web, con controles limitados a las vistas realmente representadas.
- Presentación de precios y condiciones legible; importes, promoción, cupón y trial sin alterar. La prueba de 7 días, tarjeta obligatoria y ausencia de cobro inicial se verificaron en billing y se explican en la landing.
- FAQ nativa con `details`/`summary`: contenido presente desde el HTML inicial, apertura con teclado y sin necesidad de una librería.
- Enlace para saltar al contenido, foco visible, menú con estado accesible y Escape que devuelve el foco al botón, controles táctiles de la demo de al menos 44 px.
- Textos secundarios, condiciones y etiquetas con colores más oscuros. Microanimaciones de mensajes y nueva cita; sin animaciones costosas continuas. Se respeta `prefers-reduced-motion`.
- Desktop: chat y agenda simultáneos. Tablet: reordenación y anchos fluidos. Móvil: conversación y agenda como vistas independientes; «Ver en agenda» enfoca y desplaza hasta el panel de citas.

## Demo

### Antes

Pantallas ficticias intercambiables, sin interacción que conectara el mensaje del cliente con una nueva cita.

### Ahora

1. Iniciar la consulta de una limpieza facial en el negocio ficticio Centro Aura.
2. Ver los horarios de ejemplo de Elena: 16:00, 17:30 o 19:00.
3. Elegir uno de esos horarios.
4. Confirmar la identidad ficticia de Laura García y un teléfono enmascarado. No se solicitan datos al visitante.
5. Ver la respuesta de confirmación y una única nueva cita, ordenada cronológicamente en la agenda, con cliente, servicio, hora, profesional y estado.
6. En móvil, usar «Ver en agenda». Reiniciar y probar otro horario cuando se quiera.

La disponibilidad y creación de reservas por el agente están implementadas en `agentResponseSchema.js` y `SupabaseAgentActionExecutor.js`. También se verificaron leads, conversaciones, intervención humana, servicios, empleados, horarios y página pública. No se anuncian WhatsApp, SMS, pagos ni integraciones inexistentes. Los recordatorios/email ya presentes se conservaron con sus condiciones; no se cambiaron esos servicios.

`BookingDemo.vue` importa únicamente Vue. No importa servicios, clientes HTTP, Supabase, Groq, Stripe ni autenticación. No usa `fetch`, almacenamiento persistente o IDs reales. Solo emplea estado reactivo, datos ficticios y una respuesta temporizada. La cita se deriva del estado confirmado, no se añade repetidamente a una lista persistente. Cada transición comprueba el estado y bloquea clics mientras procesa. El timer se limpia al reiniciar y desmontar. La auditoría de red de la portada y de toda la demo solo registra documentos, JS, CSS y favicon del servidor local.

## SEO

### Metadata y contenido

| Elemento | Antes | Después |
| --- | --- | --- |
| Title | Resbix \| Agente IA para negocios y reservas online | Resbix \| Agente IA y reservas para negocios de servicios |
| Description | Automatiza tu negocio con Resbix: agente IA 24/7, página web incluida, reservas online y gestión de clientes desde un único panel. | Atiende consultas, capta contactos y organiza reservas con Resbix. Agente IA, web pública y agenda para tu negocio de servicios. Descubre cómo funciona. |
| H1 | Tu próximo cliente no debería esperar. | Tu agente IA para atender consultas y organizar reservas. |
| Canonical | https://resbix.com/ | Mismo dominio real y URL, también al acceder con query params. |
| HTML inicial | `#app` vacío | Landing completa prerenderizada, aproximadamente 37,5 KB de marcado visible. |
| Schema de precio | 110 EUR, discrepante con la landing | 89 EUR de tarifa habitual y descripción de la promoción visible de 44,50 EUR. |
| Preview social | Logo grande con proporción inadecuada para una tarjeta panorámica | Imagen dedicada de 1200 × 630, 42.367 bytes. |
| Twitter/X | Solo tipo de tarjeta | Tipo, título, descripción, imagen y alt. |

Un H1. Los H2 organizan problemas, demo, atención/reservas, propuesta, panel/web, configuración, sectores, precios, FAQ y CTA. Los H3 describen los paneles de la demo, capacidades, vistas del producto y pasos de configuración; las citas usan H4 bajo la agenda.

Intenciones trabajadas de forma natural: agente IA para negocios de servicios; automatización de atención al cliente; organización de reservas y agenda; captura de contactos/leads; software para centros de estética y peluquerías. Se seleccionaron por compatibilidad con el producto, sin afirmar volúmenes de búsqueda ni hacer keyword stuffing. Texto contextual antes de la demo y contenido principal disponibles sin completar ninguna interacción.

Se mantienen `header`, `nav`, `main`, `section`, `article` y `footer`. El enlace al contenido principal tiene un destino real. Todos los anchors de la landing se verifican; los enlaces a registro, login y cinco páginas legales se conservan. La FAQ incluye funcionamiento, configuración, control humano, web, gestión de reservas, prueba, demo y promoción.

### Indexación y datos estructurados

- Landing: `index, follow, max-image-preview:large`.
- Sitemap existente validado y conservado: raíz y cinco URLs legales reales. No contiene rutas privadas ni nuevas URLs inventadas.
- Robots permite rastreo. Las rutas privadas usan `noindex`, en lugar de impedir al robot leer esa instrucción. `robots.txt` sigue apuntando al sitemap real.
- `vercel.json` configura `X-Robots-Tag: noindex, nofollow` para dashboard, negocios/configuración/billing, cuenta, autenticación, recuperación de contraseña, chats y gestión de reservas por token. También excluye la shell técnica `app.html`.
- Shells estáticas de las rutas fijas privadas incluyen `noindex` en su HTML inicial. Las rutas dinámicas quedan cubiertas por las cabeceras de hosting y por el hook de metadata del cliente.
- Al navegar en la SPA se retiran canonical, datos estructurados y metadata social heredados de la landing. El hook solo modifica metadata: no cambia guards, rutas, autenticación ni componentes de negocio.
- La portada prerenderizada se sirve solo en `/`; las otras rutas conservan la SPA mediante `app.html`. Esto evita servir contenido comercial de la landing en páginas privadas o de negocios.
- JSON-LD: `Organization`, `WebSite` y `SoftwareApplication`, con referencias coherentes y datos verificables. Sin ratings, reviews, dirección, premios ni clientes inventados. Validado sintácticamente y contra el contenido generado.
- Se evaluó `FAQPage` y no se añadió: la FAQ sigue siendo HTML semántico y no se promete elegibilidad de resultados enriquecidos. Las políticas de Google no justifican esa promesa para este SaaS.
- Open Graph: website, nombre, locale, título, descripción, URL, imagen, dimensiones y alt. Twitter: summary_large_image con contenido consistente.
- Sin manifest existente: no se introduce uno porque no aporta indexación ni hay una solicitud de PWA.

Las cabeceras de producción se han configurado y comprobado como configuración; no se ha realizado un despliegue ni una comprobación HTTP contra el hosting remoto.

### Assets, rendimiento y Core Web Vitals

- La landing no carga fotografías pesadas: chat, calendario, cards y previews son HTML/CSS. No hay imágenes de contenido que requieran `alt` o lazy loading. Las imágenes sociales tienen alt en metadata y dimensiones explícitas.
- Nuevo favicon de 64 × 64 que conserva el logo: 6.577 bytes. El logo original compartido permanece intacto.
- CSS de landing enlazado directamente en el HTML prerenderizado para evitar mostrar contenido sin estilos antes del JS.
- Eliminado `@import` de fuentes remotas; fallbacks locales. Sin nuevas dependencias.
- Entrada aislada: carga exclusivamente Vue y la landing en `/`. Los módulos de servicios del SaaS se cargan en sus otras rutas mediante la entrada original.
- Comparación orientativa durante la implementación, antes/después de separar la entrada: JS inicial gzip ≈183,4 KB → ≈46,1 KB; CSS inicial gzip ≈64,3 KB → ≈11,8 KB. Son tamaños de build, no mediciones de transferencia real en producción.
- CLS local observado: 0 en la carga de la build final. Sin warnings de hidratación. Se prevén mejoras de LCP por HTML/CSS disponibles al inicio, de INP por menos JS y de CLS por estilos iniciales y ausencia de cambios de fuente. No se inventan tiempos de LCP/INP, puntuaciones Lighthouse o resultados de campo.

Referencia: [Google sobre SEO de JavaScript y prerender](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [configuración oficial de Vercel](https://vercel.com/docs/project-configuration/vercel-json).

## Archivos

Modificados:

- `frontend/src/modules/landing/presentation/LandingView.vue`: contenido, hero, nueva sección de demo, FAQ, responsive, accesibilidad y estilos scoped.
- `frontend/index.html`: metadata pública y selección de entrada.
- `frontend/package.json`: script de build con prerender.
- `frontend/src/main.js`: instalación de hook de metadata, exclusivamente SEO.
- `frontend/public/robots.txt`: explicación de política de indexación y newline.
- `frontend/vercel.json`: separación de HTML de landing/SPA y cabeceras SEO privadas.

Creados:

- `frontend/src/modules/landing/presentation/components/BookingDemo.vue`.
- `frontend/src/modules/landing/seo/content.js`: FAQ y datos SEO.
- `frontend/src/modules/landing/seo/landingApp.js`: app aislada de presentación.
- `frontend/src/modules/landing/seo/bootstrap.js`: entrada pública ligera y delegación al SaaS en otras rutas.
- `frontend/src/modules/landing/seo/entry-server.js`: render de la landing en build.
- `frontend/src/modules/landing/seo/landingBase.css`: reset solo de la entrada aislada.
- `frontend/scripts/build-landing.mjs`.
- `frontend/public/resbix-social.png` y `frontend/public/resbix-favicon.png`.
- `frontend/tests/landingSeo.test.mjs` y `frontend/tests/run-landing-audit.mjs`.
- Este informe.

Los artefactos de build permanecen en `dist` ignorado por Git. No se modificaron componentes compartidos, CSS global, router/guards, dashboard, auth, web pública de negocios, backend, base de datos, Supabase, Stripe ni APIs funcionales.

## Validación

- `npm run build --prefix frontend`: OK. Prerender y shell separada generados.
- `node --test frontend/tests/landingSeo.test.mjs frontend/tests/calendarDates.test.js`: OK. Metadata, marcado, schema, shells privadas, sitemap, aislamiento de demo y prueba existente del calendario.
- Auditoría de Chrome: OK en 320, 360, 375, 390, 430, 768, 1024, 1440 y 1920 px. Sin overflow de página/componentes comprobados ni botones de demo inferiores a 44 px. Estado inicial y confirmado revisados.
- Emulación móvil real adicional a 320 px: viewport y scrollWidth 320. Menú con touch, cierre con Escape y recuperación de foco: OK.
- Tres horarios, reinicio durante respuesta pendiente, doble clic, reduced motion, FAQ y destinos de CTA: OK.
- Login y registro se renderizan con sus títulos originales, noindex y sin landing/canonical heredada. Sin envío de formularios.
- Cero excepciones JS y cero warnings de hidratación en auditoría.
- `git diff --check`: OK. Formato de archivos nuevos comprobado con Prettier. Frontend no tiene script de lint configurado.
- Lint adicional del backend: un error preexistente (`marta` sin usar en `tests/CreateBookingEmployees.test.js:17`).
- Tests adicionales del backend: 426 pasan y 3 fallan, todos en `SupabaseBookingRepository.test.js` (create, findById, findByBusinessId). Código y tests del backend están sin cambios en el diff. No se corrigen problemas fuera del alcance.
- Aviso Vite de chunk grande: corresponde a la entrada completa del SaaS (≈537,6 KB), que la landing ya no solicita. No se refactoriza el SaaS para eliminarlo.

Evidencia local: `/tmp/resbix-landing-audit/report.json`, capturas `hero-*`, `demo-*`, `demo-confirmed-*` y `agenda-*` en el mismo directorio. Logs de backend: `/tmp/resbix-landing-backend-lint.log` y `/tmp/resbix-landing-backend-tests.log`.

## Revisión de alcance

Diff completo revisado. Cambios limitados a landing/demo, assets y estilos exclusivos, pruebas/informe y configuración técnica necesaria para SEO público y su carga aislada. No se cambiaron precios de producto, cupón, trial, checkout, payloads, contratos, persistencia ni lógica funcional del SaaS. No se publicó ni se realizó ninguna operación con datos reales.
