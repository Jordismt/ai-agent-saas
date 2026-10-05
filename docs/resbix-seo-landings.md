# Informe de las tres landings SEO de Resbix

Fecha: 5 de octubre de 2026. Implementadas en el repositorio; no se han desplegado.

## Arquitectura y alcance

Se crean exactamente tres páginas públicas. No se añaden dependencias, imágenes, fuentes remotas ni servicios de backend.

Archivos creados:

- frontend/src/modules/landing/seo/solutionPages.js: contenido individual, metadata y generador de JSON-LD.
- frontend/src/modules/landing/seo/solutionApp.js: aplicación Vue independiente para las nuevas páginas.
- frontend/src/modules/landing/presentation/SolutionLandingView.vue: estructura semántica reutilizable, con orden y visuales adaptados a cada intención.
- frontend/src/modules/landing/presentation/components/SolutionDemo.vue: simulaciones locales de reserva y captación de contacto.
- frontend/src/modules/landing/presentation/solutionLanding.css: estilos exclusivos de estas páginas.
- frontend/tests/solutionSeo.test.mjs: comprobaciones del HTML de producción y configuración SEO.
- frontend/tests/run-solutions-audit.mjs: auditoría reproducible en Chrome mediante CDP.
- docs/resbix-seo-landings.md: este informe.

Archivos modificados:

- frontend/scripts/build-landing.mjs: amplía el render de compilación a las tres URLs y enlaza su CSS en el HTML inicial.
- frontend/src/modules/landing/seo/entry-server.js: añade renderSolution sin alterar render de la home.
- frontend/src/modules/landing/seo/bootstrap.js: hidrata las nuevas páginas mediante un import dinámico independiente.
- frontend/src/router/index.js: reserva únicamente las tres nuevas rutas antes de /:slug; una navegación SPA a ellas abre el documento público completo. Los guards y rutas existentes se conservan.
- frontend/vercel.json: tres rewrites explícitos antes del fallback a app.html. Se preservan los headers noindex de rutas privadas.
- frontend/public/sitemap.xml: conserva seis URLs y añade tres; nueve en total.
- frontend/src/modules/landing/presentation/LandingView.vue: únicamente tres enlaces en el grupo Explorar del footer.

Se reutilizan el render de Vue, la shell de Vite, landingBase.css, los datos reales Organization/WebSite y el recurso social existente. La demo de la home, BookingDemo, no se modifica. El contenido sectorial no importa módulos del SaaS. El build crea dist/<ruta>/index.html con texto y CSS antes de ejecutar JavaScript. La hidratación añade las interacciones locales; no es necesaria para leer el contenido ni las FAQ nativas.

## Investigación de intención

Se consultaron resultados web actuales sin copiar textos ni atribuir volúmenes o dificultad a las keywords. La interpretación editorial es:

- Estética: búsqueda comercial de agenda, tratamientos, profesionales y reservas. Resbix se presenta por esas capacidades comprobadas, sin prometer las funciones de gestión integral que ofrecen otros productos.
- Peluquerías: búsqueda comercial centrada en servicios de distinta duración, profesional preferido y disponibilidad.
- Agente IA: intención mixta, informativa y comercial; requiere explicar contexto, acciones y control antes de invitar a probar el producto.

Fuentes primarias consultadas como referencias de intención, no como fuentes del contenido de Resbix:

- [Daltira, software para centros de estética](https://daltira.com/software-centro-estetica/)
- [Salonware, centros de estética](https://salonware.app/estetica/)
- [Puragenda, agenda para barberías](https://www.puragenda.cl/software-agenda-barberias)
- [Barbico, reservas y agenda](https://barbico.com/)

La búsqueda de agentes IA también mostró resultados sobre atención al cliente y automatización empresarial más amplia. Se delimita la página a las acciones que Resbix implementa. La descripción del producto se basa en el código, especialmente SupabaseAgentActionExecutor, GetAvailableSlots, configuración de servicios y empleados, configuración del agente y vistas de conversaciones, leads y reservas. No se asume que todas las herramientas de IA tengan el mismo alcance.

## Software para centros de estética

- URL: /software-centros-estetica
- H1: Software para centros de estética que conecta consultas y citas
- Title: Software para centros de estética: citas y consultas | Resbix
- Description: Organiza tratamientos, profesionales y citas de tu centro de estética con Resbix. Atiende consultas con un agente IA y reúne las reservas en tu agenda.

Contenido específico:

- **Explicar tus tratamientos:** Configura la descripción, el precio y la duración de tus servicios. El agente utiliza la información del centro para responder consultas sobre lo que ofreces. Una limpieza facial y una manicura pueden tener tiempos diferentes.
- **Encontrar una cita con la profesional adecuada:** Asigna los servicios a cada profesional y configura sus horarios. La consulta de disponibilidad tiene en cuenta el servicio solicitado, el equipo y las reservas existentes.
- **Conservar el interés aunque no haya reserva:** Hay clientes que quieren preguntar antes de decidir. El agente puede recoger un nombre y un teléfono o correo para que revises el contacto y continúes la atención desde Resbix.

Funcionamiento: Describe los servicios que realmente realizas → Configura profesionales y horarios → Comparte tu página y supervisa las citas.

Criterio práctico: Empieza por los tratamientos que puedes describir y agendar con claridad. Si una consulta necesita valorar a la persona antes de elegir un tratamiento, usa la conversación para recoger el contacto y atiéndela personalmente. La información comercial del agente debe acompañar tu criterio profesional.

Demo: «Hola, quería reservar una limpieza facial para el viernes por la tarde.». Horarios 16:00, 17:30, 19:00; Laura García; Limpieza facial; profesionales Elena; cita confirmada visible en mini agenda. Todos los horarios y datos son ficticios.

FAQ:

- **¿Puedo configurar mis propios tratamientos?** Sí. Puedes añadir servicios con descripción, precio y duración, y asignarlos a los profesionales que los realizan. Tú decides qué información ofrecer sobre cada tratamiento.
- **¿Puedo organizar citas de varias profesionales?** Sí. Resbix permite gestionar empleados, los servicios que realizan y sus horarios. Las reservas se consultan y gestionan desde el panel del negocio.
- **¿Qué ocurre cuando una clienta solicita una cita?** El agente puede consultar disponibilidad y crear una reserva cuando se han concretado el servicio, el horario y los datos necesarios. También existe reserva manual desde la web pública del negocio.
- **¿Cómo atiendo una consulta que necesita valoración personal?** Puedes tomar el control de la conversación y continuar personalmente. También puedes revisar los contactos captados para hacer seguimiento cuando la persona todavía no ha reservado.
- **¿Es una herramienta para gestionar cabinas o bonos de tratamientos?** El enfoque de Resbix en esta página es la atención de consultas, los contactos y las citas por servicio y profesional. No incluye aquí gestión de cabinas, bonos o historiales clínicos.

Enlaces relacionados: Cómo utiliza Resbix un agente IA (/agente-ia-negocios); Si tu salón también ofrece peluquería (/software-peluquerias). CTA al registro existente y condiciones en /#precios.

## Software para peluquerías

- URL: /software-peluquerias
- H1: Software para peluquerías: cada servicio y profesional en su horario
- Title: Software para peluquerías: agenda y reservas online | Resbix
- Description: Gestiona las citas de tu peluquería con servicios, profesionales y horarios en Resbix. Reservas online y un agente IA para atender las consultas de tu salón.

Contenido específico:

- **Corte y barba con un tiempo definido:** Puedes crear un servicio combinado de corte y barba con su propia duración y precio. Así el cliente pide una cita concreta, en lugar de dos servicios cuya organización todavía tendrías que aclarar.
- **Clientes que quieren repetir profesional:** Asigna a cada miembro del equipo los servicios que realiza y su jornada. El agente puede utilizar la preferencia de profesional al consultar la disponibilidad.
- **Preguntas sobre color y tratamientos capilares:** Publica lo que incluye cada servicio y sus condiciones en la descripción y en las instrucciones del agente. Si el trabajo requiere aclaraciones, continúa la conversación personalmente antes de cerrar la cita.

Funcionamiento: Define tu catálogo de citas → Relaciona servicios con tu equipo → Revisa la jornada desde la agenda.

Criterio práctico: Aclara qué contempla el servicio que publicas y qué debe consultar el cliente con el salón. La duración que configuras es la referencia para organizar la cita. Si un trabajo necesita una valoración previa, el agente puede atender la primera consulta y tú continuar la conversación con el contexto disponible.

Demo: «¿Tenéis hueco mañana por la tarde para corte y barba?». Horarios 16:30, 18:00, 19:00; Marcos Ruiz; Corte y barba; profesionales Diego o Alex; cita confirmada visible en mini agenda. Todos los horarios y datos son ficticios.

FAQ:

- **¿Sirve también para una barbería?** Sí. Puedes configurar servicios como corte, arreglo de barba o un servicio combinado, con sus duraciones, precios y profesionales. El funcionamiento de consultas y reservas es el mismo.
- **¿Cómo organizo citas de distinta duración?** Cada servicio puede tener su duración configurada. La disponibilidad se consulta para el servicio solicitado, teniendo en cuenta horarios y reservas existentes.
- **¿El cliente puede pedir un peluquero concreto?** El agente puede consultar disponibilidad con un profesional específico. Para ello debes configurar sus servicios y horarios en el negocio.
- **¿Puedo configurar corte y barba como una sola cita?** Sí. Puedes dar de alta un servicio llamado corte y barba con un precio y una duración propios, y asignarlo a los profesionales que lo realizan.
- **¿Puedo cambiar una cita desde el salón?** Sí. Puedes consultar, crear, editar y cancelar reservas manualmente desde el panel. La demo de esta página solo representa el recorrido con datos ficticios.

Enlaces relacionados: Conoce el asistente IA de Resbix (/agente-ia-negocios); Para salones que también ofrecen estética (/software-centros-estetica). CTA al registro existente y condiciones en /#precios.

## Agente IA para negocios

- URL: /agente-ia-negocios
- H1: Agente IA para negocios: de responder una consulta a dar el siguiente paso
- Title: Agente IA para negocios: qué es y cómo funciona | Resbix
- Description: Descubre qué es un agente IA para negocios y cómo Resbix lo aplica a consultas, captación de contactos y reservas, con información del negocio y control humano.

Contenido específico:

- **Responder con contexto del negocio:** En Resbix, el agente utiliza los datos del negocio, los servicios y las instrucciones configuradas. Esa base le permite atender preguntas sobre lo que ofreces, los precios publicados y los horarios.
- **Pasar de la respuesta a una acción:** Cuando procede, puede recoger los datos de una persona interesada, consultar disponibilidad o crear una reserva. Son acciones concretas de Resbix, vinculadas al negocio y a la petición del cliente.
- **Dejar una conversación que puedas continuar:** Los contactos y las conversaciones se revisan desde el panel. Puedes tomar el control de una conversación para atender personalmente una petición que necesita tu intervención.

Funcionamiento: El negocio aporta la información → El cliente expresa lo que necesita → Resbix conecta la acción con la gestión.

Criterio práctico: Comprueba de dónde obtiene la información, qué acciones puede ejecutar y cómo retomas una conversación. Prueba preguntas frecuentes y situaciones que requieren tu criterio antes de compartirlo con clientes. La IA puede equivocarse: configura instrucciones claras, revisa conversaciones y actualiza los datos cuando cambien tus servicios.

Demo: «Estoy buscando información sobre vuestra sesión inicial. ¿Cuándo atendéis?». Respuesta sobre una sesión inicial y horario; Lucía Martín deja un correo ficticio; se muestra un contacto en el ejemplo de panel. No se crea una cita.

FAQ:

- **¿Qué diferencia hay entre un chatbot y un agente IA?** Los términos se usan de formas distintas. Un chatbot es una interfaz de conversación; un agente añade capacidad de utilizar contexto y realizar acciones permitidas. En Resbix, esas acciones incluyen captar un contacto, consultar disponibilidad, crear una reserva y solicitar atención humana.
- **¿Cómo conoce la información de mi negocio?** Utiliza los datos y servicios configurados en Resbix y las instrucciones que defines para el agente. Conviene mantener esa información actualizada y revisar cómo responde a las consultas habituales.
- **¿Puedo controlar sus instrucciones?** Sí. La configuración del agente permite definir instrucciones, mensaje de bienvenida y tono de comunicación. Esos ajustes ayudan a adaptar la atención a tu negocio.
- **¿Puede gestionar reservas aunque el cliente empiece preguntando?** Sí. Puede responder la consulta y, cuando la persona quiere reservar, consultar disponibilidad y crear una cita con los datos necesarios. No toda conversación tiene que terminar en una reserva.
- **¿Puedo intervenir si la respuesta necesita mi criterio?** Sí. Resbix permite tomar el control de una conversación y continuar la atención personalmente desde el panel. Revisa las conversaciones para comprobar si los datos e instrucciones necesitan ajustes.
- **¿Necesito programar para configurarlo?** No necesitas programar para añadir la información del negocio, servicios, horarios y configuración del agente desde el panel de Resbix.

Enlaces relacionados: Un ejemplo aplicado a centros de estética (/software-centros-estetica); Consultas y citas en una peluquería (/software-peluquerias). CTA al registro existente y condiciones en /#precios.

## Conceptos trabajados y diferenciación

Estética: software para centros de estética, tratamientos, agenda, citas, profesionales y consultas durante la atención. Peluquerías: software para peluquerías, reservas online, corte y barba, color, duración y elección de profesional. Agente IA: definición, contexto, atención al cliente, instrucciones, captación de contactos, acciones y supervisión humana.

La home mantiene la intención general del producto. Las cuatro URLs tienen H1, titles y descriptions diferentes. Las tres nuevas páginas tienen 16 preguntas distintas, escenarios propios y consejos específicos. Se comparte la estructura de presentación para mantener consistencia, pero no se sustituye una keyword en párrafos comunes: cada sector tiene problemas, decisiones y ejemplos propios. La página informativa coloca la explicación del funcionamiento antes de las capacidades y demuestra una conversación sin reserva. No hay localizaciones, variaciones masivas, párrafos repetidos para aumentar longitud ni enlaces forzados con keywords. Cada recurso se puede leer y probar directamente antes de registrarse, evitando que sea una mera puerta de entrada al registro.

## SEO técnico

- Autocanonical: https://resbix.com seguida de la ruta correspondiente, sin barra final; la home conserva https://resbix.com/.
- Robots: index, follow, max-image-preview:large en las nuevas páginas. robots.txt permanece intacto y permite rastrearlas. No se alteran protecciones de URLs privadas.
- Sitemap XML válido: nueve URLs públicas; se preservan las seis originales. Sin rutas privadas.
- Title y description únicos; Open Graph y Twitter Card completos con textos propios y el recurso social existente. La imagen compartida se describe con alt veraz; no pretende ser una captura sectorial.
- JSON-LD: Organization y WebSite reutilizados; WebPage propio con about SoftwareApplication para el mismo producto, y BreadcrumbList coincidente con la navegación visible. No se inventa un software distinto por sector ni un Service adicional. Sin ratings, reviews ni datos empresariales inventados. No se añade FAQPage por obtener resultados enriquecidos.
- Un H1 por página; H2 y H3 semánticos. Los visuales se construyen con HTML y CSS, sin imágenes que necesiten alt.
- Enlaces a inicio, registro, login, precios y legales. Enlaces entre recursos con contexto (salones mixtos y explicación del agente). Tres enlaces discretos desde el footer de la home.
- HTML inicial real: estética 9.719 bytes de markup; peluquerías 9.683; agente IA 10.114. Contiene el contenido de las FAQ incluso cuando están cerradas. Comprobado también con JavaScript desactivado.

## Validación

- npm run build en frontend: correcto.
- node --test tests/landingSeo.test.mjs tests/solutionSeo.test.mjs: correcto. Verifica HTML inicial, H1, metadata, canonical, robots, schema, FAQ, anchors, sitemap y rewrites.
- node --test frontend/tests/calendarDates.test.js: correcto; sin cambios en la lógica de calendario.
- Auditoría existente run-landing-audit.mjs: correcta en nueve anchos, todos los horarios de la demo, reinicio durante temporizador, doble clic, reduced motion, menú táctil/Escape y destinos de login y registro. Cero errores y warnings; CTA y noindex de las páginas de cuenta conservados.
- Auditoría Chrome de las cuatro URLs: 36 vistas, cero errores de consola/hidratación, sin overflow horizontal. Anchos: 320, 360, 375, 390, 430, 768, 1024, 1440 y 1920.
- Interacciones: confirmación, mini agenda/contacto, reinicio y apertura de FAQ en los nueve anchos. Sin llamadas a APIs, Supabase o Groq. No se carga main.js/main.css del SaaS en las páginas SEO.
- Revisadas visualmente capturas móvil de estética y desktop de peluquerías. Capturas de las tres páginas en 390 y 1440 disponibles en /tmp/resbix-solutions-audit.
- Accesibilidad de implementación: enlaces reales, skip link, landmarks, foco visible, fieldsets/legends, radios nativos, labels, estado anunciado con role=status, FAQ details/summary y controles de al menos 44 px. Sin animaciones añadidas. No se ha ejecutado una auditoría automatizada completa de contraste/lector de pantalla.

Comparación local con caché desactivada (Chrome; móvil: CPU ×4, latencia 150 ms y descarga 200.000 B/s; desktop: CPU ×1 sin limitación de red):

| URL | Ancho | LCP observado | CLS | Recursos transferidos* |
|---|---:|---:|---:|---:|
| / | 390 | 752 ms | 0 | 187656 B |
| /software-centros-estetica | 390 | 584 ms | 0 | 121525 B |
| /software-peluquerias | 390 | 584 ms | 0 | 121525 B |
| /agente-ia-negocios | 390 | 584 ms | 0 | 121525 B |
| / | 1440 | 40 ms | 0 | 187656 B |
| /software-centros-estetica | 1440 | 32 ms | 0 | 121525 B |
| /software-peluquerias | 1440 | 28 ms | 0 | 121525 B |
| /agente-ia-negocios | 1440 | 32 ms | 0 | 121525 B |

*Resource Timing para subrecursos; excluye el documento HTML. Servidor local sin compresión HTTP. Son observaciones de una ejecución, no puntuaciones Lighthouse, datos de campo ni una garantía de rendimiento en producción. Las nuevas páginas cargaron menos recursos que la home en esta comparación y no mostraron desplazamientos de layout. CSS nuevo: 7,43 KB sin comprimir (2,16 KB gzip estimado por Vite); JavaScript sectorial: 25,52 KB (8,61 KB gzip), más Vue compartido y bootstrap. No se dispone de Lighthouse instalado; no se han inventado puntuaciones.

Durante la integración se corrigió el patrón del nombre del CSS generado por Vite: el chunk se llama solutionApp, no solutionLanding. El build sigue avisando del tamaño del bundle main del SaaS; la auditoría confirma que estas páginas no lo cargan. Se corrigió también una ejecución inicial del build desde la raíz: el script pertenece a frontend.

## Revisión del diff y límites

La home cambia solo en tres anchors del footer. Hero, contenido principal, demo, precios y estilos permanecen intactos. No se han modificado backend, Supabase, RLS, base de datos, Stripe, webhooks, billing, trial, FOUNDERS50, autenticación, vistas de registro/login, dashboard, calendario real, reservas, leads, conversaciones, empleados, servicios, Groq, prompts, emails, páginas públicas de negocios, APIs, endpoints ni payloads. La única adición en el router consiste en reservar las tres URLs SEO; las rutas existentes y sus controles conservan su código.

Las páginas están listas en el build local. No se ha publicado ni verificado un despliegue remoto. La indexación real dependerá del despliegue y del rastreo posterior.
