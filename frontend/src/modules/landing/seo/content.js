export const faqs = [
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
    q: "¿Cómo funciona la prueba gratuita?",
    a: "La suscripción incluye 7 días de prueba. Para iniciarla se solicita una tarjeta, sin cobro inicial. Puedes gestionar la renovación desde el apartado de facturación del negocio.",
  },
  {
    q: "¿La demo crea una reserva real?",
    a: "No. La demo de Centro Aura es una simulación con datos ficticios. Puedes probar el recorrido sin registrarte y sin enviar datos a un negocio real.",
  },
  {
    q: "¿Qué ocurre después de los primeros 3 meses de la oferta?",
    a: "La promoción de los primeros 20 clientes es de aprox. 40 €/mes durante los primeros 3 meses. Después se aplica la tarifa habitual de 79,99 €/mes.",
  },
  {
    q: "¿La promoción se aplica automáticamente?",
    a: "La promoción está limitada a los primeros 20 clientes. La disponibilidad y las condiciones definitivas deben confirmarse antes de contratar.",
  },
];

export const landingSeo = {
  title: "Resbix | Agente IA y reservas para negocios de servicios",
  description:
    "Atiende consultas, capta contactos y organiza reservas con Resbix. Agente IA, web pública y agenda para tu negocio de servicios. Descubre cómo funciona.",
  url: "https://resbix.com/",
  image: "https://resbix.com/resbix-social.png",
};
export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${landingSeo.url}#organization`,
      name: "Resbix",
      url: landingSeo.url,
      logo: `${landingSeo.url}resbix-logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${landingSeo.url}#website`,
      name: "Resbix",
      url: landingSeo.url,
      inLanguage: "es",
      publisher: { "@id": `${landingSeo.url}#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${landingSeo.url}#software`,
      name: "Resbix",
      url: landingSeo.url,
      description: landingSeo.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "es",
      offers: {
        "@type": "Offer",
        price: "79.99",
        priceCurrency: "EUR",
        url: `${landingSeo.url}#precios`,
        description:
          "Tarifa habitual mensual. Promoción limitada a los primeros 20 clientes: aprox. 40 €/mes durante 3 meses con FOUNDERS50, sujeta a disponibilidad.",
      },
    },
  ],
};
