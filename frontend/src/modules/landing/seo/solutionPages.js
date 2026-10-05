import { structuredData } from './content.js';

export const solutionPages = [
  {
    path: '/software-centros-estetica', kind: 'estetica', label: 'Software para centros de estética',
    title: 'Software para centros de estética: citas y consultas | Resbix',
    description: 'Organiza tratamientos, profesionales y citas de tu centro de estética con Resbix. Atiende consultas con un agente IA y reúne las reservas en tu agenda.',
    h1: 'Software para centros de estética que conecta consultas y citas',
    lead: 'Cuando estás en un tratamiento, atender otra consulta puede esperar. Tus clientes, a veces, no. Resbix presenta tus servicios, responde preguntas y ayuda a reservar con la disponibilidad de tu equipo.',
    eyebrow: 'RESBIX PARA ESTÉTICA', heroNote: 'Del interés por un tratamiento a una cita organizada',
    problemTitle: 'Una buena atención empieza antes de entrar en el centro',
    problem: 'Una clienta pregunta cuánto dura una limpieza facial. Otra quiere saber si Elena trabaja el viernes. Mientras atiendes en cabina, esas preguntas se acumulan. Tener servicios, horarios y citas conectados ayuda a dar una respuesta sin interrumpir cada tratamiento.',
    cases: [
      ['Explicar tus tratamientos', 'Configura la descripción, el precio y la duración de tus servicios. El agente utiliza la información del centro para responder consultas sobre lo que ofreces. Una limpieza facial y una manicura pueden tener tiempos diferentes.'],
      ['Encontrar una cita con la profesional adecuada', 'Asigna los servicios a cada profesional y configura sus horarios. La consulta de disponibilidad tiene en cuenta el servicio solicitado, el equipo y las reservas existentes.'],
      ['Conservar el interés aunque no haya reserva', 'Hay clientes que quieren preguntar antes de decidir. El agente puede recoger un nombre y un teléfono o correo para que revises el contacto y continúes la atención desde Resbix.'],
    ],
    workflowTitle: 'Cómo preparar la agenda de tu centro de estética',
    steps: [
      ['Describe los servicios que realmente realizas', 'Añade tus tratamientos, su duración y precio. Explica las diferencias que tus clientes suelen preguntar y mantén la información actualizada.'],
      ['Configura profesionales y horarios', 'Indica qué servicios realiza cada persona y cuándo trabaja. Así, solicitar una limpieza facial con Elena tiene un contexto concreto.'],
      ['Comparte tu página y supervisa las citas', 'Tu web pública permite consultar información, hablar con el agente y reservar manualmente. Desde el panel puedes revisar, crear, editar y cancelar citas.'],
    ],
    adviceTitle: 'Qué conviene decidir antes de abrir las reservas',
    advice: 'Empieza por los tratamientos que puedes describir y agendar con claridad. Si una consulta necesita valorar a la persona antes de elegir un tratamiento, usa la conversación para recoger el contacto y atiéndela personalmente. La información comercial del agente debe acompañar tu criterio profesional.',
    demo: { business: 'Centro Aura · Estética', question: 'Hola, quería reservar una limpieza facial para el viernes por la tarde.', answer: 'Para limpieza facial con Elena, en este ejemplo hay estos horarios el viernes:', slots: ['16:00', '17:30', '19:00'], service: 'Limpieza facial', person: 'Laura García', professionals: ['Elena'], day: 'Viernes', duration: '60 min' },
    demoTitle: 'Una limpieza facial, del mensaje a la mini agenda',
    demoText: 'Elige uno de los horarios ficticios y confirma la cita de Laura. Verás el tratamiento y la profesional en una agenda ilustrativa, sin enviar ningún dato.',
    benefitsTitle: 'Menos interrupciones entre tratamientos',
    benefits: 'Resbix reúne la consulta inicial y la organización de la cita. Puedes revisar qué quiere la clienta, quién la atenderá y cuándo está reservada, sin reconstruir el recorrido entre notas sueltas. Las consultas delicadas siguen teniendo una vía de atención humana.',
    faq: [
      ['¿Puedo configurar mis propios tratamientos?', 'Sí. Puedes añadir servicios con descripción, precio y duración, y asignarlos a los profesionales que los realizan. Tú decides qué información ofrecer sobre cada tratamiento.'],
      ['¿Puedo organizar citas de varias profesionales?', 'Sí. Resbix permite gestionar empleados, los servicios que realizan y sus horarios. Las reservas se consultan y gestionan desde el panel del negocio.'],
      ['¿Qué ocurre cuando una clienta solicita una cita?', 'El agente puede consultar disponibilidad y crear una reserva cuando se han concretado el servicio, el horario y los datos necesarios. También existe reserva manual desde la web pública del negocio.'],
      ['¿Cómo atiendo una consulta que necesita valoración personal?', 'Puedes tomar el control de la conversación y continuar personalmente. También puedes revisar los contactos captados para hacer seguimiento cuando la persona todavía no ha reservado.'],
      ['¿Es una herramienta para gestionar cabinas o bonos de tratamientos?', 'El enfoque de Resbix en esta página es la atención de consultas, los contactos y las citas por servicio y profesional. No incluye aquí gestión de cabinas, bonos o historiales clínicos.'],
    ],
    ctaTitle: 'Prepara la atención de tu centro, incluso mientras estás trabajando',
    related: [['/agente-ia-negocios', 'Cómo utiliza Resbix un agente IA'], ['/software-peluquerias', 'Si tu salón también ofrece peluquería']],
  },
  {
    path: '/software-peluquerias', kind: 'peluqueria', label: 'Software para peluquerías',
    title: 'Software para peluquerías: agenda y reservas online | Resbix',
    description: 'Gestiona las citas de tu peluquería con servicios, profesionales y horarios en Resbix. Reservas online y un agente IA para atender las consultas de tu salón.',
    h1: 'Software para peluquerías: cada servicio y profesional en su horario',
    lead: 'Un corte, un tinte y un arreglo de barba no necesitan el mismo tiempo ni siempre los hace la misma persona. Resbix conecta tus servicios y tu equipo con las reservas online y las consultas de tus clientes.',
    eyebrow: 'RESBIX PARA PELUQUERÍAS Y BARBERÍAS', heroNote: 'Servicio, profesional y hora: una cita con contexto',
    problemTitle: 'El hueco libre depende de quién atiende y de qué servicio se pide',
    problem: '«¿Tenéis sitio mañana?» no basta para organizar el salón. Hay que saber si el cliente quiere corte, color o corte y barba, y si prefiere a una persona del equipo. Resbix ayuda a concretar la petición antes de convertirla en una reserva.',
    cases: [
      ['Corte y barba con un tiempo definido', 'Puedes crear un servicio combinado de corte y barba con su propia duración y precio. Así el cliente pide una cita concreta, en lugar de dos servicios cuya organización todavía tendrías que aclarar.'],
      ['Clientes que quieren repetir profesional', 'Asigna a cada miembro del equipo los servicios que realiza y su jornada. El agente puede utilizar la preferencia de profesional al consultar la disponibilidad.'],
      ['Preguntas sobre color y tratamientos capilares', 'Publica lo que incluye cada servicio y sus condiciones en la descripción y en las instrucciones del agente. Si el trabajo requiere aclaraciones, continúa la conversación personalmente antes de cerrar la cita.'],
    ],
    workflowTitle: 'Organiza las reservas del salón desde tus servicios',
    steps: [
      ['Define tu catálogo de citas', 'Separa corte, tinte y tratamientos según cómo los agendas en tu peluquería. Usa duraciones que reflejen tu forma de trabajar; para combinaciones habituales puedes configurar un servicio propio.'],
      ['Relaciona servicios con tu equipo', 'Indica quién realiza cada servicio y sus horarios. Un profesional que solo hace corte no debe tener la misma configuración que quien también realiza color.'],
      ['Revisa la jornada desde la agenda', 'Consulta las citas del negocio y gestiona cambios desde el panel. Tu web pública ofrece una vía de reserva manual, además de la conversación con el agente.'],
    ],
    adviceTitle: 'Un tinte necesita una descripción clara antes de reservar',
    advice: 'Aclara qué contempla el servicio que publicas y qué debe consultar el cliente con el salón. La duración que configuras es la referencia para organizar la cita. Si un trabajo necesita una valoración previa, el agente puede atender la primera consulta y tú continuar la conversación con el contexto disponible.',
    demo: { business: 'Salón Norte · Peluquería', question: '¿Tenéis hueco mañana por la tarde para corte y barba?', answer: 'En esta simulación puedes elegir una hora y después el profesional para corte y barba:', slots: ['16:30', '18:00', '19:00'], service: 'Corte y barba', person: 'Marcos Ruiz', professionals: ['Diego', 'Alex'], day: 'Mañana', duration: '45 min' },
    demoTitle: 'Prueba una reserva de corte y barba',
    demoText: 'Elige una hora y un profesional del salón ficticio. Confirma la cita de Marcos y comprueba cómo queda ordenada en la mini agenda.',
    benefitsTitle: 'La siguiente cita se entiende de un vistazo',
    benefits: 'Ver el servicio y el profesional junto a la hora ayuda a preparar la jornada. El agente atiende las preguntas iniciales mientras el equipo está con un corte o un lavado, y las conversaciones que necesitan atención personal se pueden continuar desde el panel.',
    faq: [
      ['¿Sirve también para una barbería?', 'Sí. Puedes configurar servicios como corte, arreglo de barba o un servicio combinado, con sus duraciones, precios y profesionales. El funcionamiento de consultas y reservas es el mismo.'],
      ['¿Cómo organizo citas de distinta duración?', 'Cada servicio puede tener su duración configurada. La disponibilidad se consulta para el servicio solicitado, teniendo en cuenta horarios y reservas existentes.'],
      ['¿El cliente puede pedir un peluquero concreto?', 'El agente puede consultar disponibilidad con un profesional específico. Para ello debes configurar sus servicios y horarios en el negocio.'],
      ['¿Puedo configurar corte y barba como una sola cita?', 'Sí. Puedes dar de alta un servicio llamado corte y barba con un precio y una duración propios, y asignarlo a los profesionales que lo realizan.'],
      ['¿Puedo cambiar una cita desde el salón?', 'Sí. Puedes consultar, crear, editar y cancelar reservas manualmente desde el panel. La demo de esta página solo representa el recorrido con datos ficticios.'],
    ],
    ctaTitle: 'Conecta las preguntas de tus clientes con la agenda del salón',
    related: [['/agente-ia-negocios', 'Conoce el asistente IA de Resbix'], ['/software-centros-estetica', 'Para salones que también ofrecen estética']],
  },
  {
    path: '/agente-ia-negocios', kind: 'agente', label: 'Agente IA para negocios',
    title: 'Agente IA para negocios: qué es y cómo funciona | Resbix',
    description: 'Descubre qué es un agente IA para negocios y cómo Resbix lo aplica a consultas, captación de contactos y reservas, con información del negocio y control humano.',
    h1: 'Agente IA para negocios: de responder una consulta a dar el siguiente paso',
    lead: 'Un cliente pregunta por un servicio. Otro quiere dejar sus datos. Otro está listo para reservar. Un agente IA puede atender estas intenciones con información y acciones conectadas al negocio. Conoce cómo lo aplica Resbix.',
    eyebrow: 'GUÍA Y EJEMPLO PRÁCTICO', heroNote: 'Información → conversación → acción → seguimiento',
    problemTitle: 'Qué es un agente IA para negocios',
    problem: 'Es un sistema de software que interpreta lo que pide una persona, utiliza un contexto y puede ejecutar acciones que la aplicación le permite. En atención al cliente, el contexto puede ser el catálogo de servicios y los horarios; las acciones pueden ser recoger un contacto o consultar una cita. Su utilidad depende de la calidad de esos datos y del alcance que tenga permitido.',
    cases: [
      ['Responder con contexto del negocio', 'En Resbix, el agente utiliza los datos del negocio, los servicios y las instrucciones configuradas. Esa base le permite atender preguntas sobre lo que ofreces, los precios publicados y los horarios.'],
      ['Pasar de la respuesta a una acción', 'Cuando procede, puede recoger los datos de una persona interesada, consultar disponibilidad o crear una reserva. Son acciones concretas de Resbix, vinculadas al negocio y a la petición del cliente.'],
      ['Dejar una conversación que puedas continuar', 'Los contactos y las conversaciones se revisan desde el panel. Puedes tomar el control de una conversación para atender personalmente una petición que necesita tu intervención.'],
    ],
    workflowTitle: 'Cómo funciona: contexto, intención y acciones disponibles',
    steps: [
      ['El negocio aporta la información', 'Configuras su descripción, servicios, precios y horarios. También puedes definir el saludo, el tono y las instrucciones del agente. No basta con activar la IA: la información debe describir lo que realmente haces.'],
      ['El cliente expresa lo que necesita', 'El agente atiende la consulta en la conversación de tu web pública. Una pregunta informativa puede resolverse con una respuesta; una petición de cita necesita concretar servicio, disponibilidad y datos.'],
      ['Resbix conecta la acción con la gestión', 'Si se recoge un contacto, puedes revisarlo como lead. Si se crea una reserva, aparece en la gestión de citas. El panel reúne el seguimiento para que el negocio pueda continuar la atención.'],
    ],
    adviceTitle: 'Qué revisar al elegir un asistente IA para tu negocio',
    advice: 'Comprueba de dónde obtiene la información, qué acciones puede ejecutar y cómo retomas una conversación. Prueba preguntas frecuentes y situaciones que requieren tu criterio antes de compartirlo con clientes. La IA puede equivocarse: configura instrucciones claras, revisa conversaciones y actualiza los datos cuando cambien tus servicios.',
    demo: { business: 'Estudio Forma · Ejemplo de negocio', question: 'Estoy buscando información sobre vuestra sesión inicial. ¿Cuándo atendéis?', answer: 'En este ejemplo, la sesión inicial sirve para conocer tu objetivo y el estudio atiende de lunes a viernes, de 10:00 a 18:00. ¿Quieres dejar un contacto para que el equipo amplíe la información?', person: 'Lucía Martín', service: 'Información sobre sesión inicial' },
    demoTitle: 'Ejemplo: una consulta que termina en un contacto',
    demoText: 'Este recorrido no necesita una reserva. La persona pregunta, recibe información y decide dejar un contacto para que el negocio pueda continuar la conversación. Todos los datos son ficticios.',
    benefitsTitle: 'Cómo lo aplica Resbix en el día a día',
    benefits: 'Resbix combina una página pública, el agente IA y un panel con conversaciones, contactos y reservas. Si tu negocio trabaja con citas, puedes configurar servicios y profesionales. Si la persona todavía está comparando opciones, la conversación puede servir para resolver dudas y recoger su interés sin forzar una reserva.',
    faq: [
      ['¿Qué diferencia hay entre un chatbot y un agente IA?', 'Los términos se usan de formas distintas. Un chatbot es una interfaz de conversación; un agente añade capacidad de utilizar contexto y realizar acciones permitidas. En Resbix, esas acciones incluyen captar un contacto, consultar disponibilidad, crear una reserva y solicitar atención humana.'],
      ['¿Cómo conoce la información de mi negocio?', 'Utiliza los datos y servicios configurados en Resbix y las instrucciones que defines para el agente. Conviene mantener esa información actualizada y revisar cómo responde a las consultas habituales.'],
      ['¿Puedo controlar sus instrucciones?', 'Sí. La configuración del agente permite definir instrucciones, mensaje de bienvenida y tono de comunicación. Esos ajustes ayudan a adaptar la atención a tu negocio.'],
      ['¿Puede gestionar reservas aunque el cliente empiece preguntando?', 'Sí. Puede responder la consulta y, cuando la persona quiere reservar, consultar disponibilidad y crear una cita con los datos necesarios. No toda conversación tiene que terminar en una reserva.'],
      ['¿Puedo intervenir si la respuesta necesita mi criterio?', 'Sí. Resbix permite tomar el control de una conversación y continuar la atención personalmente desde el panel. Revisa las conversaciones para comprobar si los datos e instrucciones necesitan ajustes.'],
      ['¿Necesito programar para configurarlo?', 'No necesitas programar para añadir la información del negocio, servicios, horarios y configuración del agente desde el panel de Resbix.'],
    ],
    ctaTitle: 'Pon la información de tu negocio a trabajar en cada conversación',
    related: [['/software-centros-estetica', 'Un ejemplo aplicado a centros de estética'], ['/software-peluquerias', 'Consultas y citas en una peluquería']],
  },
];
export const getSolutionPage = path => solutionPages.find(page => page.path === path);
export function solutionSchema(page) {
  const url = `https://resbix.com${page.path}`;
  return { '@context': 'https://schema.org', '@graph': [
    ...structuredData['@graph'].filter(item => ['Organization', 'WebSite'].includes(item['@type'])),
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: page.title, description: page.description, inLanguage: 'es', isPartOf: { '@id': 'https://resbix.com/#website' }, about: { '@type': 'SoftwareApplication', name: 'Resbix', url: 'https://resbix.com/', applicationCategory: 'BusinessApplication', operatingSystem: 'Web' }, breadcrumb: { '@id': `${url}#breadcrumbs` } },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`, itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://resbix.com/' }, { '@type': 'ListItem', position: 2, name: page.label, item: url }] },
  ] };
}
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function solutionHead(page) {
  const url = `https://resbix.com${page.path}`;
  const image = 'https://resbix.com/resbix-social.png';
  const tags = [['name', 'description', page.description], ['name', 'robots', 'index, follow, max-image-preview:large'], ['property', 'og:type', 'website'], ['property', 'og:site_name', 'Resbix'], ['property', 'og:locale', 'es_ES'], ['property', 'og:title', page.title], ['property', 'og:description', page.description], ['property', 'og:url', url], ['property', 'og:image', image], ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'], ['property', 'og:image:alt', 'Resbix: agente IA, web pública y reservas para negocios de servicios'], ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', page.title], ['name', 'twitter:description', page.description], ['name', 'twitter:image', image], ['name', 'twitter:image:alt', 'Resbix: agente IA, web pública y reservas para negocios de servicios']];
  return `<title>${escape(page.title)}</title>\n<link rel="canonical" href="${url}" />\n${tags.map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escape(value)}" />`).join('\n')}\n<script id="landing-schema" type="application/ld+json">${JSON.stringify(solutionSchema(page)).replaceAll('<', '\\u003c')}</script>`;
}
