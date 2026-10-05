// The public landing loads only Vue and its local presentation components.
// The original SaaS entry remains the entry for every other route.
if (window.location.pathname === "/") {
  const [{ createLandingApp }] = await Promise.all([
    import("./landingApp.js"),
    import("./landingBase.css"),
  ]);
  const target = document.getElementById("app");
  createLandingApp(target.hasChildNodes()).mount(target);
} else if (['/software-centros-estetica', '/software-peluquerias', '/agente-ia-negocios'].includes(window.location.pathname.replace(/\/$/, ''))) {
  const [{ createSolutionApp }] = await Promise.all([
    import('./solutionApp.js'),
    import('./landingBase.css'),
  ]);
  const target = document.getElementById('app');
  createSolutionApp(window.location.pathname.replace(/\/$/, ''), target.hasChildNodes()).mount(target);
} else {
  await import("../../../main.js");
}
