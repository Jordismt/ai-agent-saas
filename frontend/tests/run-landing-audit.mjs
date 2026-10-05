import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.RESBIX_LANDING_URL || "http://127.0.0.1:5174";
const output = "/tmp/resbix-landing-audit";
await mkdir(output, { recursive: true });
const tabs = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const socket = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});
let sequence = 0;
const pending = new Map(),
  errors = [],
  warnings = [],
  requests = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    message.error
      ? request?.reject(Error(JSON.stringify(message.error)))
      : request?.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown")
    errors.push(
      message.params.exceptionDetails.exception?.description ||
        message.params.exceptionDetails.text,
    );
  if (
    message.method === "Runtime.consoleAPICalled" &&
    ["error", "warning"].includes(message.params.type)
  )
    warnings.push(
      message.params.args.map((x) => x.value || x.description).join(" "),
    );
  if (message.method === "Network.requestWillBeSent")
    requests.push(message.params.request.url);
};
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
  return result.result.value;
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(condition, message) {
  if (!condition) throw Error(message);
}
async function click(text, selector = "button") {
  const found = await evaluate(
    `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length && e.textContent.trim().includes(${JSON.stringify(text)}));if(!e)return false;e.click();return true})()`,
  );
  assert(found, `Missing visible control ${text}`);
  await pause(30);
}
async function ready() {
  for (let n = 0; n < 100; n++) {
    if (
      await evaluate(
        `!!document.querySelector('.booking-demo button') && document.querySelector('h1')?.textContent.includes('agente IA')`,
      )
    ) {
      await pause(150);
      return;
    }
    await pause(100);
  }
  throw Error("Landing failed to load");
}
async function screenshot(name) {
  const { data } = await call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(`${output}/${name}.png`, Buffer.from(data, "base64"));
  await pause(150);
}
await call("Runtime.enable");
await call("Page.enable");
await call("Network.enable");
await call("Page.addScriptToEvaluateOnNewDocument", {
  source: `window.landingCLS=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.landingCLS+=e.value}).observe({type:'layout-shift',buffered:true});`,
});
await call("Page.navigate", { url: `${base}/?campaign=seo-check` });
await ready();
const seo = await evaluate(
  `({title:document.title,description:document.querySelector('meta[name=description]').content,canonical:document.querySelector('link[rel=canonical]').href,robots:document.querySelector('meta[name=robots]').content,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),headings:[...document.querySelectorAll('h2,h3')].map(e=>({tag:e.tagName,text:e.textContent.trim()})),schema:JSON.parse(document.querySelector('#landing-schema').textContent),images:[...document.images].map(e=>({alt:e.alt,w:e.width,h:e.height})),brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(e=>!document.querySelector(e.getAttribute('href'))).map(e=>e.href),cls:window.landingCLS})`,
);
assert(seo.h1.length === 1, "Expected one H1");
assert(seo.canonical === "https://resbix.com/", "Canonical query duplication");
assert(!seo.brokenAnchors.length, "Broken anchors");
assert(
  seo.schema["@graph"].find((e) => e["@type"] === "SoftwareApplication").offers
    .price === "89.00",
  "Incorrect schema price",
);
const responsive = [];
for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await pause(400);
  await screenshot(`hero-${width}`);
  await evaluate(
    `document.querySelector('#demo').scrollIntoView({behavior:'instant'})`,
  );
  await pause(200);
  await screenshot(`demo-${width}`);
  const result = await evaluate(
    `(()=>{const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';const overflow=[...document.querySelectorAll('.booking-demo *,.navbar *,.pricing-card *,.footer *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>document.documentElement.clientWidth+1||r.left<-1}).map(e=>({tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right}));return{width:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,overflow,tinyDemoButtons:[...document.querySelectorAll('.booking-demo button')].filter(visible).filter(e=>e.getBoundingClientRect().height<44).map(e=>e.textContent),demoWidth:document.querySelector('.booking-demo').getBoundingClientRect().width}})()`,
  );
  responsive.push(result);
  console.log(JSON.stringify(result));
  assert(result.scrollWidth <= result.clientWidth, `Page overflow at ${width}`);
  assert(
    result.overflow.length === 0,
    `Component overflow at ${width}: ${JSON.stringify(result.overflow)}`,
  );
  assert(!result.tinyDemoButtons.length, `Small demo touch target at ${width}`);
  await click("Reiniciar");
  await click("Iniciar demo");
  await pause(720);
  await click("17:30");
  await pause(720);
  await click("Confirmar reserva");
  await pause(720);
  assert(
    await evaluate(
      `document.querySelectorAll('.appointment.fresh').length===1 && document.querySelector('.appointment.fresh time').textContent==='17:30'`,
    ),
    `Booking missing at ${width}`,
  );
  const completedOverflow = await evaluate(
    `({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})`,
  );
  assert(
    completedOverflow.scroll <= completedOverflow.client,
    `Completed demo overflow at ${width}`,
  );
  await evaluate(
    `document.querySelector('.booking-demo').scrollIntoView({behavior:'instant',block:'start'})`,
  );
  await pause(400);
  await screenshot(`demo-confirmed-${width}`);
  if (width < 700) {
    await click("Ver en agenda");
    assert(
      await evaluate(
        `getComputedStyle(document.querySelector('.demo-agenda')).display!=='none'`,
      ),
      "Mobile agenda hidden",
    );
    await screenshot(`agenda-${width}`);
  }
  await click("Reiniciar");
  assert(
    await evaluate(
      `document.querySelectorAll('.appointment.fresh').length===0`,
    ),
    "Reset left a duplicate reservation",
  );
}
await call("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
for (const slot of ["16:00", "19:00"]) {
  await click("Iniciar demo");
  await pause(720);
  await click(slot);
  await pause(720);
  await click("Confirmar reserva");
  await pause(720);
  assert(
    await evaluate(
      `document.querySelector('.appointment.fresh time').textContent===${JSON.stringify(slot)}`,
    ),
    `Incorrect ${slot} booking`,
  );
  await click("Reiniciar");
}
// Race: restarting during a pending response must invalidate that response.
await click("Iniciar demo");
await click("Reiniciar");
await pause(800);
assert(
  await evaluate(
    `!![...document.querySelectorAll('.demo-controls button')].find(e=>e.textContent.includes('Iniciar demo')) && document.querySelectorAll('.message').length===1`,
  ),
  "Orphan timer after reset",
);
// Rapid clicks must create only one reservation.
await evaluate(
  `document.querySelector('.demo-primary').click();document.querySelector('.demo-primary').click()`,
);
await pause(720);
await click("16:00");
await pause(720);
await evaluate(
  `document.querySelector('.demo-primary').click();document.querySelector('.demo-primary').click()`,
);
await pause(720);
assert(
  await evaluate(`document.querySelectorAll('.appointment.fresh').length===1`),
  "Duplicate reservation",
);
await call("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await click("Reiniciar");
await click("Iniciar demo");
await pause(50);
await click("19:00");
await pause(50);
await click("Confirmar reserva");
await pause(50);
assert(
  await evaluate(`document.querySelectorAll('.appointment.fresh').length===1`),
  "Reduced motion flow failed",
);
// Real mobile emulation, touch input and keyboard dismissal of the navigation.
await call("Emulation.setDeviceMetricsOverride", {
  width: 320,
  height: 900,
  screenWidth: 320,
  screenHeight: 900,
  deviceScaleFactor: 1,
  mobile: true,
});
await call("Emulation.setTouchEmulationEnabled", { enabled: true });
await call("Page.navigate", { url: `${base}/` });
await ready();
const mobileViewport = await evaluate(
  `({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})`,
);
assert(
  mobileViewport.scroll <= mobileViewport.client &&
    mobileViewport.width === 320,
  "Real mobile emulation overflow",
);
const menuPoint = await evaluate(
  `(()=>{const r=document.querySelector('.menu-toggle').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
);
await call("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ ...menuPoint, radiusX: 1, radiusY: 1 }],
});
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await pause(80);
assert(
  await evaluate(`!!document.querySelector('#mobile-navigation')`),
  "Touch menu failed",
);
await evaluate(`document.querySelector('#mobile-navigation a').focus()`);
await call("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
});
await call("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "Escape",
  code: "Escape",
});
await pause(80);
assert(
  await evaluate(
    `!document.querySelector('#mobile-navigation') && document.activeElement.classList.contains('menu-toggle')`,
  ),
  "Menu Escape/focus failed",
);
await evaluate(`document.querySelector('.faq-item summary').click()`);
assert(
  await evaluate(`document.querySelector('.faq-item').open`),
  "Native FAQ failed",
);
const destinations = await evaluate(
  `[...document.querySelectorAll('a[href^="/"]')].map(e=>e.getAttribute('href'))`,
);
assert(
  destinations.includes("/login") && destinations.includes("/register"),
  "Authentication CTA destinations changed",
);
for (const path of [
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
  "/tratamiento-datos",
])
  assert(destinations.includes(path), `Missing legal link ${path}`);
const demoRequests = [...requests];
assert(
  demoRequests.every((url) => url.startsWith(base) || url.startsWith("data:")),
  `Landing contacted external services: ${JSON.stringify(demoRequests)}`,
);
assert(
  demoRequests.every(
    (url) => !/supabase|groq|stripe|\/api\/|\/bookings/.test(url),
  ),
  "Demo contacted a SaaS service",
);
assert(!errors.length, `Runtime exceptions: ${errors}`);
assert(
  !warnings.some((x) => /hydration/i.test(x)),
  `Hydration warnings: ${warnings}`,
);
// Smoke-test destination pages without submitting any real forms.
const routeChecks = [];
await call("Network.setBlockedURLs", {
  urls: ["*supabase*", "*groq*", "*stripe*", "*/api/*"],
});
for (const [path, heading] of [
  ["/register/", "Crea tu cuenta"],
  ["/login/", "Inicia sesión en tu cuenta"],
]) {
  await call("Page.navigate", { url: `${base}${path}` });
  for (let n = 0; n < 100; n++) {
    if (
      await evaluate(
        `document.querySelector('h1')?.textContent.includes(${JSON.stringify(heading)})`,
      )
    )
      break;
    await pause(100);
  }
  const check = await evaluate(
    `({path:location.pathname,h1:document.querySelector('h1')?.textContent.trim(),robots:document.querySelector('meta[name=robots]')?.content,canonical:document.querySelector('link[rel=canonical]')?.href,landing:!!document.querySelector('.landing')})`,
  );
  assert(
    check.h1 === heading &&
      check.robots.includes("noindex") &&
      !check.canonical &&
      !check.landing,
    `Destination route regression: ${JSON.stringify(check)}`,
  );
  routeChecks.push(check);
}
await call("Network.setBlockedURLs", { urls: [] });
assert(!errors.length, `Navigation runtime exceptions: ${errors}`);
await writeFile(
  `${output}/report.json`,
  JSON.stringify(
    {
      seo,
      responsive,
      errors,
      warnings,
      requests: demoRequests,
      mobileViewport,
      routeChecks,
      flows: [
        "nine widths",
        "all three slots",
        "restart during timer",
        "double clicks",
        "reduced motion",
      ],
      passed: true,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      passed: true,
      widths: responsive.length,
      flows: 5,
      errors,
      warnings,
      requests: demoRequests,
      mobileViewport,
      routeChecks,
      seo,
      output,
    },
    null,
    2,
  ),
);
socket.close();
