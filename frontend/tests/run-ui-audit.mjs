import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const output = resolve(process.env.RESBIX_AUDIT_OUTPUT || "/tmp/resbix-ui-audit");
await mkdir(output,{recursive:true});
const tabs = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const socket = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let seq=0;
const pending = new Map();
const errors=[];
socket.onmessage=event=>{
 const message=JSON.parse(event.data);
 if (message.id) {
  const request=pending.get(message.id);pending.delete(message.id);
  if(message.error)request?.reject(new Error(JSON.stringify(message.error)));else request?.resolve(message.result);
 }
 if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
};
function call(method,params={}){
 return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression){
 const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
 if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result.value;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitReady(){for(let i=0;i<100;i++){if(await evaluate('Boolean(window.uiReady)'))return;await pause(100);}throw new Error('Preview did not load');}
async function navigate(name,scenario='normal'){
 await evaluate(`window.uiNavigate(${JSON.stringify(name)},${JSON.stringify(scenario)})`);
 await pause(scenario==='loading'?80:130);
}
async function screenshot(name){const {data}=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${output}/${name}.png`,Buffer.from(data,'base64'));}
async function clickText(text,selector='button'){
 const found=await evaluate(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length&&e.textContent.replace(/\\s+/g,' ').trim().endsWith(${JSON.stringify(text)}));if(!el)return false;el.click();return true;})()`);
 if(!found)throw new Error(`Control missing: ${text}`);await pause(80);
}
async function setValue(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing ${selector}');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause(80);}
await call('Runtime.enable');await call('Page.enable');
await call('Page.navigate',{url:'http://127.0.0.1:5174/tests/ui-preview.html'});
await waitReady();
const pages=['dashboard','businesses','create-business','business-detail','business-agent-config','business-bookings','business-leads','business-conversations','conversation-detail','business-employees','employee-detail','business-public-page','business-billing','account-settings'];
const widths=[320,360,375,390,430,768,1024,1440,1920];
const checks=[];
const calendarChecks=[];
const modalChecks=[];
for(const width of widths){
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 for(const page of pages){
  await navigate(page);
  const check=await evaluate(`(()=>{
    const width=innerWidth;
    const visible=e=>e.getClientRects().length&&!e.closest('[inert]')&&getComputedStyle(e).visibility!=='hidden';
    const overflow=[...document.querySelectorAll('.app-main *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>width+1||r.left<-1);}).map(e=>({tag:e.tagName,class:e.className,width:Math.round(e.getBoundingClientRect().width),right:Math.round(e.getBoundingClientRect().right)})).slice(0,15);
    const unlabelled=[...document.querySelectorAll('.app-main input,.app-main select,.app-main textarea')].filter(visible).filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>({tag:e.tagName,id:e.id,type:e.type,placeholder:e.placeholder,class:e.className}));
    return {viewport:width,scrollWidth:document.documentElement.scrollWidth,overflow,unlabelled,title:document.querySelector('.app-main h1')?.textContent.trim(),alerts:[...document.querySelectorAll('.error-banner,.alert-error')].filter(visible).map(e=>e.textContent.trim())};
  })()`);
  checks.push({page,width,...check});
  await screenshot(`${page}-${width}`);
 }
}
// Explicit tablet orientations and each available calendar presentation.
for (const [width,height] of [[768,1024],[1024,768]]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 for (const page of pages) {
  await navigate(page);
  const scrollWidth=await evaluate('document.documentElement.scrollWidth');
  if(scrollWidth>width+1)throw Error(`Tablet overflow: ${page} ${width}x${height}`);
  await screenshot(`${page}-tablet-${width}x${height}`);
 }
}
for (const width of widths) {
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await navigate('business-bookings','dense');
 for (const view of width>700?['Día','Semana','Mes']:['Agenda']) {
  if(view!=='Agenda')await clickText(view);
  const scrollWidth=await evaluate('document.documentElement.scrollWidth');
  calendarChecks.push({width,view,scrollWidth});
  if(scrollWidth>width+1)throw Error(`Calendar overflow: ${view} ${width}`);
  await screenshot(`calendar-${view}-${width}`);
 }
 await clickText('+ Nueva reserva');
 const bounds=await evaluate(`(()=>{const el=document.querySelector('.manual-modal');const r=el.getBoundingClientRect();const footer=document.querySelector('.manual-modal-footer').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerHeight,scrollable:el.scrollHeight>el.clientHeight,footerBottom:footer.bottom};})()`);
 modalChecks.push({width,...bounds});
 if(bounds.left<0||bounds.right>width+1||bounds.top<0||bounds.bottom>bounds.viewport+1||bounds.footerBottom>bounds.viewport+1)throw Error(`Modal outside viewport: ${width}`);
 await screenshot(`manual-modal-${width}`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause(60);
 if(await evaluate(`Boolean(document.querySelector('.manual-modal'))`))throw Error('Modal Escape failed');
}
await writeFile(`${output}/layout-report.json`,JSON.stringify({checks,errors},null,2));
const interactions=[];
function passed(name){interactions.push({name,passed:true});}
function assert(condition,message){if(!condition)throw new Error(message);}
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await navigate('business-bookings');
assert(await evaluate(`document.querySelectorAll('.desktop-calendar .calendar-booking').length > 0`),'No bookings in calendar');passed('Calendar initial week');
await clickText('Día');
assert(await evaluate(`document.querySelectorAll('.desktop-calendar .calendar-booking').length===6`),'Incorrect daily count');passed('Daily chronological appointments');
const times=await evaluate(`[...document.querySelectorAll('.view-day .booking-time')].map(e=>e.textContent.trim())`);
const expected=await evaluate(`window.uiFixtures.bookings.slice(0,6).map(b=>new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(b.starts_at)))`);
assert(times.every((time,index)=>time.startsWith(expected[index])),'Business timezone mismatch');passed('Business timezone matches booking instants');
await evaluate(`document.querySelector('.desktop-nav[aria-label="Periodo siguiente"]').click()`);await pause(60);
assert(await evaluate(`document.querySelectorAll('.view-day .calendar-booking').length===6`),'Next day mismatch');passed('Next day');
await clickText('Hoy');await clickText('Semana');
await evaluate(`document.querySelector('.desktop-nav[aria-label="Periodo siguiente"]').click()`);await pause(60);
await evaluate(`document.querySelector('.desktop-nav[aria-label="Periodo siguiente"]').click()`);await pause(60);
assert(await evaluate(`document.querySelectorAll('.desktop-calendar .calendar-booking').length===0`),'Empty week mismatch');passed('Next week without appointments');
await clickText('Hoy');await clickText('Mes');
assert(await evaluate(`document.querySelectorAll('.view-month .calendar-day').length===42`),'Month grid mismatch');passed('Complete month view');
await evaluate(`document.querySelector('.desktop-nav[aria-label="Periodo siguiente"]').click()`);await pause(60);passed('Next month');
await clickText('Hoy');
await evaluate(`document.querySelector('.more-bookings').click()`);await pause(60);passed('Month overflow opens full daily agenda');
await clickText('Día');
await evaluate(`document.querySelector('.desktop-calendar .calendar-booking').click()`);await pause(60);
assert(await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`),'Detail dialog missing');passed('Booking detail');
await screenshot('booking-detail-desktop');
await setValue('.booking-detail-fields select','pending');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PATCH'&&c.path.endsWith('/status')&&c.body.status==='pending')`),'Status endpoint not called');passed('Existing status action');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause(60);
assert(await evaluate(`!document.querySelector('.booking-detail-modal')`),'Escape failed');passed('Dialog Escape');
await setValue('[aria-label="Filtrar por empleado"]','33333333-3333-4333-8333-333333333333');
assert(await evaluate(`document.querySelectorAll('.desktop-calendar .calendar-booking').length===3`),'Employee filter mismatch');passed('Employee filter');
await setValue('[aria-label="Filtrar por empleado"]','all');
await setValue('[aria-label="Buscar reservas"]','nombre largo');
assert(await evaluate(`document.querySelectorAll('.desktop-calendar .calendar-booking').length===1`),'Search filter mismatch');passed('Search');
await setValue('[aria-label="Buscar reservas"]','');
await clickText('Lista');await setValue('[aria-label="Filtrar por fecha"]','all');assert(await evaluate(`document.querySelectorAll('tbody tr').length===18`),'List lost bookings');passed('Preserved list');
await clickText('+ Nueva reserva');await screenshot('manual-booking-desktop');
assert(await evaluate(`Boolean(document.querySelector('.manual-modal'))`),'Manual dialog missing');
await setValue('.manual-form select[required]','22222222-2222-4222-8222-222222222222');await pause(80);
await setValue('.manual-form input[type="date"]', await evaluate('window.uiFixtures.today'));
await clickText('17:00');
await setValue('input[placeholder="Nombre y apellidos"]','Cliente de prueba');await setValue('input[placeholder="600 000 000"]','600000000');
await clickText('Crear reserva');
assert(await evaluate(`window.uiCalls.some(c=>c.path.endsWith('/bookings/manual')&&c.method==='POST'&&c.body.customerPhone==='600000000'&&c.body.customerEmail===null)`),'Manual payload changed');passed('Manual create with optional email and backend availability');
await clickText('Calendario');await clickText('Día');
await evaluate(`document.querySelector('.desktop-calendar .calendar-booking').click()`);await pause(60);
await clickText('Editar reserva');
assert(await evaluate(`document.querySelector('#manual-modal-title').textContent==='Editar reserva'`),'Edit action missing');passed('Edit opens existing manual form');
await clickText('Cerrar');
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
await navigate('business-bookings');
assert(await evaluate(`getComputedStyle(document.querySelector('.mobile-agenda')).display!=='none'&&getComputedStyle(document.querySelector('.desktop-calendar')).display==='none'`),'Mobile view mismatch');passed('Mobile daily agenda');
await evaluate(`document.querySelector('[aria-label="Día siguiente"]').click()`);await pause(60);passed('Mobile next day');
await clickText('Hoy');await screenshot('mobile-agenda');
await setValue('.calendar-date input','');
assert(await evaluate(`document.querySelectorAll('.mobile-agenda .agenda-booking').length===6`),'Clearing date caused an invalid calendar');passed('Empty date picker safely falls back to today');
await clickText('Hoy');
await evaluate(`document.querySelector('.mobile-menu-button').focus();document.querySelector('.mobile-menu-button').click()`);await pause(80);
assert(await evaluate(`document.querySelector('.app-content').inert&&document.querySelector('.sidebar').contains(document.activeElement)`),'Drawer focus/inert missing');passed('Mobile drawer focus and background isolation');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',modifiers:8});await pause(30);
assert(await evaluate(`document.activeElement.classList.contains('logout-button')`),'Drawer reverse Tab trap failed');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab'});await pause(30);
assert(await evaluate(`document.activeElement.classList.contains('brand')`),'Drawer forward Tab trap failed');passed('Drawer keyboard focus cycles safely');
await screenshot('mobile-navigation');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause(80);
assert(await evaluate(`!document.querySelector('.app-content').inert&&document.activeElement.classList.contains('mobile-menu-button')`),'Drawer focus restore failed');passed('Drawer Escape and focus restoration');
// Existing handlers exercised against fixture endpoints only.
await navigate('business-bookings');
await evaluate(`document.querySelector('.mobile-agenda .agenda-booking').click()`);await pause(60);
await clickText('Editar reserva');await screenshot('manual-booking-mobile');
await clickText('Guardar cambios');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PATCH'&&c.path.endsWith('/manual')&&c.body.customerName)`),'Booking edit endpoint missing');passed('Existing manual edit payload');
await evaluate(`document.querySelector('.mobile-agenda .agenda-booking').click()`);await pause(60);
await clickText('Cancelar reserva');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PATCH'&&c.path.endsWith('/manual/cancel'))&&window.uiConfirmations.length>0`),'Booking cancel confirmation missing');passed('Existing cancellation and confirmation');
await clickText('Abrir conversación');
assert(await evaluate(`window.uiRouter.currentRoute.value.name==='conversation-detail'`),'Conversation navigation failed');passed('Booking to conversation navigation');
await navigate('business-leads');
assert(await evaluate(`document.querySelectorAll('.leads-table td').length===5`),'Lead card lost data');
await setValue('.leads-table .status-control select','qualified');
assert(await evaluate(`window.uiCalls.some(c=>c.path.endsWith('/leads/lead-1/status')&&c.body.status==='qualified')`),'Lead status missing');passed('Lead status action and complete mobile card');
await setValue('[aria-label="Buscar leads"]','no match');
assert(await evaluate(`document.querySelector('.empty-state')?.textContent.includes('No hay resultados')`),'Lead empty search missing');passed('Lead search and empty result');
await navigate('conversation-detail');
await setValue('[aria-label="Respuesta al cliente"]','Respuesta de prueba');await clickText('Enviar');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='POST'&&c.path.endsWith('/messages')&&c.body.content==='Respuesta de prueba')`),'Message action missing');passed('Conversation message send');
await clickText('Devolver a IA');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PATCH'&&c.path.includes('/conversations/')&&c.body.status==='active')`),'Return to AI missing');passed('Conversation existing status action');
await navigate('business-agent-config');await clickText('Guardar configuración');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PUT'&&c.path.endsWith('/agent-config')&&c.body.tone==='professional')`),'Agent config save missing');passed('Agent settings existing payload');
await navigate('business-public-page');await clickText('Guardar cambios');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PUT'&&c.path.endsWith('/public-page')&&c.body.slug==='estetica-aurora')`),'Public settings save missing');passed('Public page settings save');
await navigate('employee-detail');await clickText('Guardar datos');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PATCH'&&c.path.startsWith('/employees/')&&c.body.name==='Laura García')`),'Employee profile save missing');passed('Employee profile save');
await clickText('Guardar servicios');await clickText('Guardar horario');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PUT'&&c.path.startsWith('/employees/')&&c.path.endsWith('/services'))&&window.uiCalls.some(c=>c.method==='PUT'&&c.path.startsWith('/employees/')&&c.path.endsWith('/hours'))`),'Employee service/hour action missing');passed('Employee services and hours save');
await navigate('business-employees');await clickText('Añadir empleado');await screenshot('employee-create-mobile');
assert(await evaluate(`document.querySelector('[role="dialog"]')?.contains(document.activeElement)`),'Employee modal focus missing');
await setValue('#employee-name','Profesional de prueba');await clickText('Crear y configurar');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='POST'&&c.path.endsWith('/employees')&&c.body.name==='Profesional de prueba')`),'Employee creation missing');passed('Employee creation dialog');
await navigate('business-detail');await clickText('Guardar horarios');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PUT'&&c.path.startsWith('/business-hours/')&&Array.isArray(c.body.hours))`),'Business hours missing');passed('Business hours save');
await setValue('#service-name','Servicio de prueba');await setValue('#service-price','35');await setValue('#service-duration','30');await clickText('Añadir');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='POST'&&c.path.endsWith('/services')&&c.body.name==='Servicio de prueba')`),'Service create missing');passed('Service creation');
await clickText('Editar');await clickText('Guardar');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='PUT'&&c.path.includes('/services/'))`),'Service edit missing');passed('Service editing');
await clickText('Eliminar');assert(await evaluate(`window.uiCalls.some(c=>c.method==='DELETE'&&c.path.includes('/services/'))`),'Service deletion missing');passed('Service deletion retains confirmation');
await navigate('create-business');await setValue('#name','Negocio de prueba');await clickText('Crear negocio');
assert(await evaluate(`window.uiCalls.some(c=>c.method==='POST'&&c.path==='/businesses'&&c.body.name==='Negocio de prueba')`),'Business creation missing');passed('Business creation and existing billing navigation');
await navigate('business-billing');await clickText('Cancelar renovación');
assert(await evaluate(`Boolean(document.querySelector('.confirm'))`),'Billing confirmation inaccessible');passed('Subscription confirmation presentation only, no Stripe operation');
await navigate('account-settings');await clickText('Eliminar mi cuenta');
assert(await evaluate(`Boolean(document.querySelector('.confirmation-form'))`),'Account confirmation inaccessible');passed('Account confirmation presentation only, no deletion');
await clickText('Cancelar');
for (const page of ['business-bookings','business-leads','business-conversations','business-employees','businesses','dashboard']) {
 await navigate(page,'empty');passed(`${page} empty state`);
}
assert(checks.every(c=>c.scrollWidth<=c.width+1),'Responsive overflow remains');
assert(checks.every(c=>!c.unlabelled.length),'Unlabelled form control remains');
assert(errors.length===0,'Browser runtime errors');
for(const scenario of ['empty','one','loading','error']){
 await navigate('business-bookings',scenario);await screenshot(`booking-${scenario}-mobile`);passed(`Booking ${scenario} presentation`);
}
await writeFile(`${output}/report.json`,JSON.stringify({checks,calendarChecks,modalChecks,interactions,errors},null,2));
console.log(JSON.stringify({output,pages:pages.length,viewports:widths.length,checks:checks.length,calendarChecks,modalChecks,overflow:checks.filter(c=>c.scrollWidth>c.width+1).map(c=>({page:c.page,width:c.width,scrollWidth:c.scrollWidth,overflow:c.overflow})),unlabelled:checks.filter(c=>c.width===390&&c.unlabelled.length).map(c=>({page:c.page,controls:c.unlabelled})),interactions,errors},null,2));
socket.close();
