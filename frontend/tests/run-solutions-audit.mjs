import { mkdir, writeFile } from 'node:fs/promises';
const output='/tmp/resbix-solutions-audit';
await mkdir(output,{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let id=0;const pending=new Map(),errors=[],requests=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))errors.push(m.params.args.map(x=>x.value||x.description));if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url)};
const call=(method,params={})=>new Promise((resolve,reject)=>{const seq=++id;pending.set(seq,{resolve,reject});ws.send(JSON.stringify({id:seq,method,params}))});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(value,message)=>{if(!value)throw Error(message)};
await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
await call('Page.addScriptToEvaluateOnNewDocument',{source:"window.auditCLS=0;window.auditLCP=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.auditCLS+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{window.auditLCP=l.getEntries().at(-1).startTime}).observe({type:'largest-contentful-paint',buffered:true});"});
const report=[];
for(const path of ['/', '/software-centros-estetica','/software-peluquerias','/agente-ia-negocios']){
 for(const width of [320,360,375,390,430,768,1024,1440,1920]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await call('Page.navigate',{url:`http://127.0.0.1:5174${path}`});await pause(300);
  const base=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,cls:window.auditCLS,lcp:window.auditLCP,transfer:performance.getEntriesByType('resource').reduce((n,e)=>n+e.transferSize,0),assets:performance.getEntriesByType('resource').map(e=>e.name)})`);
  assert(base.scroll<=width,`${path} overflow at ${width}: ${base.scroll}`);assert(base.h1===1,'H1 count');
  if(path!=='/'){
   assert(!base.assets.some(x=>/main-.*\.(js|css)|supabase/.test(x)), 'SaaS loaded');
   await evaluate("document.querySelector('.solution-demo .seo-button').click()");await pause(30);
   assert(await evaluate("!!document.querySelector('.agenda-entry')"),'Demo failed');
   assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Confirmed demo overflow');
   await evaluate("document.querySelector('details summary').click()");
   assert(await evaluate("document.querySelector('details').open"),'FAQ failed');
   await evaluate("document.querySelector('.demo-reset').click()");
   assert(await evaluate("!document.querySelector('.agenda-entry')"),'Reset failed');
   if(width===390||width===1440){await evaluate("scrollTo(0,0)");const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${output}/${path.slice(1)}-${width}.png`,Buffer.from(screenshot.data,'base64'))}
  }
  report.push({path,width,...base});
 }
}
assert(!requests.some(x=>/supabase|groq|\/api\//i.test(x)),'Unexpected backend call');
assert(errors.length===0,JSON.stringify(errors));
// Cold-cache comparison under the same local mobile and desktop conditions.
const performance=[];
await call('Network.setCacheDisabled',{cacheDisabled:true});
for(const width of [390,1440]) {
 await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
 await call('Emulation.setCPUThrottlingRate',{rate:width===390?4:1});
 await call('Network.emulateNetworkConditions',{offline:false,latency:width===390?150:0,downloadThroughput:width===390?200000:-1,uploadThroughput:width===390?90000:-1});
 for(const path of ['/', '/software-centros-estetica','/software-peluquerias','/agente-ia-negocios']) {
  await call('Page.navigate',{url:`http://127.0.0.1:5174${path}`});await pause(width===390?2500:800);
  performance.push({path,width,...await evaluate(`({cls:window.auditCLS,lcp:window.auditLCP,transfer:performance.getEntriesByType('resource').reduce((n,e)=>n+e.transferSize,0),requests:performance.getEntriesByType('resource').length})`)});
 }
}
await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
await call('Emulation.setCPUThrottlingRate',{rate:1});
// Verify useful public content with JavaScript disabled.
await call('Emulation.setScriptExecutionDisabled',{value:true});
for(const path of ['/software-centros-estetica','/software-peluquerias','/agente-ia-negocios']){await call('Page.navigate',{url:`http://127.0.0.1:5174${path}`});await pause(100);assert(await evaluate("document.querySelector('h1').textContent.length>30 && document.querySelectorAll('details').length>=5"),'Missing no-JS content')}
await call('Emulation.setScriptExecutionDisabled',{value:false});
await writeFile(`${output}/report.json`,JSON.stringify({report,performance,errors,requests},null,2));
console.log(JSON.stringify({views:report.length,errors:errors.length,networkCalls:requests.filter(x=>/\/api\//.test(x)),output}));ws.close();
