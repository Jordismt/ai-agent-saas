// Development-only fixture harness. Never imported by the application or production build.
import { createApp, nextTick, h } from "vue";
import { createRouter, createMemoryHistory, RouterView } from "vue-router";
import "../src/style.css";
import DashboardLayout from "../src/layouts/DashboardLayout.vue";
import DashboardView from "../src/modules/dashboard/presentation/DashboardView.vue";
import BusinessListView from "../src/modules/businesses/presentation/BusinessListView.vue";
import CreateBusinessView from "../src/modules/businesses/presentation/CreateBusinessView.vue";
import BusinessDetailView from "../src/modules/businesses/presentation/BusinessDetailView.vue";
import BusinessAgentConfigView from "../src/modules/businesses/presentation/BusinessAgentConfigView.vue";
import BookingListView from "../src/modules/bookings/presentation/BookingListView.vue";
import LeadListView from "../src/modules/leads/presentation/LeadListView.vue";
import ConversationListView from "../src/modules/conversations/presentation/ConversationListView.vue";
import ConversationDetailView from "../src/modules/conversations/presentation/ConversationDetailView.vue";
import EmployeeListView from "../src/modules/employees/presentation/EmployeeListView.vue";
import EmployeeDetailView from "../src/modules/employees/presentation/EmployeeDetailView.vue";
import PublicPageSettingsView from "../src/modules/publicPages/presentation/PublicPageSettingsView.vue";
import BusinessBillingView from "../src/modules/billing/presentation/BusinessBillingView.vue";
import AccountSettingsView from "../src/modules/account/presentation/AccountSettingsView.vue";
import { supabase } from "../src/infrastructure/supabase/supabaseClient.js";
import { addDays } from "../src/modules/bookings/presentation/calendar/calendarDates.js";

supabase.auth.getSession = async () => ({ data:{session:null} });
supabase.auth.logout = async () => ({});
const businessId = "11111111-1111-4111-8111-111111111111";
const serviceId = "22222222-2222-4222-8222-222222222222";
const employeeId = "33333333-3333-4333-8333-333333333333";
const conversationId = "44444444-4444-4444-8444-444444444444";
const business = { id:businessId,name:"Estética Aurora · Centro de bienestar",timezone:"Europe/Madrid",description:"Cuidado personal, tratamientos y bienestar",phone:"600000000",address:"Calle Mayor 12, Madrid" };
const services = [{id:serviceId,business_id:businessId,name:"Tratamiento facial y cuidado de la piel",duration_minutes:60,price:65,description:"Tratamiento personalizado"},{id:"service-2",name:"Manicura",duration_minutes:30,price:25}];
const employees = [{id:employeeId,name:"Laura García",active:true,email:"laura@example.com",phone:"600000000"},{id:"employee-2",name:"Ana Martínez",active:true,email:"ana@example.com"},{id:"employee-3",name:"Marta López",active:false}];
const parts = new Intl.DateTimeFormat("en-CA",{timeZone:business.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
const today = `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
const bookings = Array.from({length:18},(_,i)=>({
 id:`booking-${i}`,business_id:businessId,service_id:serviceId,employee_id:i%2?employeeId:"employee-2",employee:employees[i%2?0:1],
 customer_name:i===0?"María García de los Santos y Fernández con un nombre largo":"Cliente "+(i+1),
 customer_phone:"600000000",customer_email:i%2?"cliente@example.com":null,service_name:services[i%2].name,
 duration_minutes:30,price:25,starts_at:`${addDays(today,Math.floor(i/6))}T${String(7+Math.floor((i%6)/2)).padStart(2,'0')}:${i%2?'30':'00'}:00Z`,ends_at:`${addDays(today,Math.floor(i/6))}T${String(7+Math.floor((i%6)/2)+(i%2)).padStart(2,'0')}:${i%2?'00':'30'}:00Z`,
 status:["confirmed","pending","completed","cancelled","no_show"][i%5],notes:"Información de la cita. "+"Texto largo para comprobar la lectura y el ajuste de línea. ".repeat(3),conversation_id:conversationId,
}));
const leads = [{id:"lead-1",name:"Carmen López",email:"carmen.nombre.apellido.muy.largo@example.com",phone:"600000000",notes:"Interesada en un tratamiento facial. "+"Información importante. ".repeat(8),created_at:new Date().toISOString(),status:"new"}];
const conversations = ["human","active","closed"].map((status,i)=>({id:i?`conversation-${i}`:conversationId,business_id:businessId,status,channel:"web",visitor_id:"visitor-1",created_at:new Date().toISOString()}));
const hours = Array.from({length:7},(_,day)=>({id:`hours-${day}`,day_of_week:day,open_time:"08:00:00",close_time:"20:00:00",is_closed:false}));
const employeeHours = hours.map(h=>({weekday:h.day_of_week,start_time:"09:00:00",end_time:"18:00:00",is_closed:false}));
const publicPage = {id:"page-1",business_id:businessId,slug:"estetica-aurora",headline:"Tu momento de bienestar",published:false,theme_primary:"#2563eb"};
let scenario = "normal";
window.uiCalls = [];
window.uiConfirmations = [];
window.confirm = message => { window.uiConfirmations.push(message); return true; };
const nativeFetch = window.fetch.bind(window);
window.fetch = async (resource,options={}) => {
 const url = String(resource);
 if (!url.startsWith("http://127.0.0.1:3000")) return nativeFetch(resource,options);
 const path = url.slice("http://127.0.0.1:3000".length).split('?')[0];
 const method = options.method || "GET";
 const body = options.body ? JSON.parse(options.body) : null;
 window.uiCalls.push({path,method,body});
 if (scenario === "loading") await new Promise(resolve=>setTimeout(resolve,1000));
 if (scenario === "error") return new Response(JSON.stringify({error:"No se ha podido conectar. Inténtalo de nuevo."}),{status:503});
 const empty = scenario === "empty";
 let result;
 if (path === "/dashboard/summary") result={stats:{businesses:empty?0:1,conversations:3,leads:1,upcomingBookings:8},attention:{newLeads:1,humanConversations:1,pendingBookings:3},businesses:empty?[]:[{...business,conversations:3,leads:1,upcomingBookings:8,newLeads:1,humanConversations:1,pendingBookings:3}],recentActivity:empty?[]:[{id:"activity-1",entityId:conversationId,businessId,businessName:business.name,type:"conversation",title:"Nueva conversación",description:"Cliente esperando atención humana",date:new Date().toISOString()}]};
 else if (path === "/account/summary") result={email:"propietaria@example.com",businesses:empty?[]:[business]};
 else if (path === "/billing/status") result={billing:{status:"active",stripe_subscription_id:"fixture",current_period_end:"2099-11-03",cancel_at_period_end:false}};
 else if (path === "/businesses") result=method === "GET" ? (empty?[]:[business]) : {...business,...body};
 else if (path.includes("/agent-config")) result={system_instructions:"Atiende con claridad y amabilidad.",welcome_message:"Hola, ¿cómo podemos ayudarte?",tone:"professional"};
 else if (path.includes("/public-page")) result=publicPage;
 else if (path.endsWith("/bookings/availability")) result=[{localTime:"17:00",startsAt:`${today}T15:00:00Z`,endsAt:`${today}T15:30:00Z`,employees:employees.filter(e=>e.active)}];
 else if (path.startsWith("/bookings/")) {
   const row=bookings.find(b=>path.includes(`/${b.id}/`)) || bookings[0];
   if (path.endsWith('/status')) row.status=body.status;
   if (path.endsWith('/cancel')) row.status='cancelled';
   result={...row,...(body?.customerName?{customer_name:body.customerName}:{} )};
 }
 else if (path.endsWith("/bookings/manual")) result={...bookings[0],id:"booking-created"};
 else if (path.endsWith("/bookings")) result=empty?[]:scenario === "one"?[bookings[0]]:scenario === "dense"?[...bookings.slice(0,6),...Array.from({length:40},(_,i)=>({...bookings[i%6],id:`dense-${i}`,customer_name:"NombreLargo".repeat(12),service_name:"Tratamiento facial · ".repeat(6)}))]:bookings;
 else if (path.startsWith("/business-hours/")) result=hours;
 else if (path.startsWith("/employees/") && path.endsWith("/services")) result=empty?[]:services;
 else if (path.startsWith("/employees/") && path.endsWith("/hours")) result=employeeHours;
 else if (path.includes("/time-off")) result=empty?[]:[{id:"absence-1",type:"vacation",starts_at:"2099-12-01T09:00:00Z",ends_at:"2099-12-04T18:00:00Z",notes:"Vacaciones"}];
 else if (path.startsWith("/employees/")) result={...employees[0],...body};
 else if (path.endsWith("/employees")) result=method==='GET'?(empty?[]:employees):{...employees[0],...body};
 else if (path.includes("/services")) result=method==='GET'?(empty?[]:services):{...services[0],...(method==='POST'?{id:"service-created"}:{}),...body};
 else if (path.endsWith("/leads") || path.startsWith("/leads/business/")) result=empty?[]:leads;
 else if (path.startsWith("/leads/")) result={...leads[0],...body};
 else if (path.startsWith("/conversations/business/")) result=empty?[]:conversations;
 else if (path.endsWith("/messages")) result=method==='POST'?{id:"message-new",role:"assistant",content:body.content,created_at:new Date().toISOString()}:empty?[]:[{id:"m-1",role:"user",content:"Hola, quiero reservar un tratamiento facial.",created_at:new Date().toISOString()},{id:"m-2",role:"assistant",content:"Claro, te ayudo a encontrar una cita. "+"Mensaje largo de prueba. ".repeat(10),created_at:new Date().toISOString()}];
 else if (path.startsWith("/conversations/")) result={...conversations[0],...body};
 else if (path.startsWith(`/businesses/${businessId}`)) result=business;
 else throw new Error(`Unmocked endpoint: ${method} ${path}`);
 return new Response(JSON.stringify(result),{status:200,headers:{"Content-Type":"application/json"}});
};
const routes = [
 ["dashboard","dashboard",DashboardView],["businesses","businesses",BusinessListView],["businesses/create","create-business",CreateBusinessView],
 ["businesses/:id","business-detail",BusinessDetailView],["businesses/:id/agent-config","business-agent-config",BusinessAgentConfigView],
 ["businesses/:id/bookings","business-bookings",BookingListView],["businesses/:id/leads","business-leads",LeadListView],
 ["businesses/:id/conversations","business-conversations",ConversationListView],["businesses/:id/conversations/:conversationId","conversation-detail",ConversationDetailView],
 ["businesses/:id/employees","business-employees",EmployeeListView],["businesses/:id/employees/:employeeId","employee-detail",EmployeeDetailView],
 ["businesses/:id/public-page","business-public-page",PublicPageSettingsView],["businesses/:id/billing","business-billing",BusinessBillingView],
 ["settings","account-settings",AccountSettingsView],
].map(([path,name,component])=>({path,name,component}));
const router = createRouter({history:createMemoryHistory(),routes:[{path:"/",component:DashboardLayout,children:routes}]});
await router.push("/dashboard");
createApp({render:() => h(RouterView)}).use(router).mount("#app");
window.uiReady = true;
window.uiRouter = router;
window.uiFixtures = {today,bookings,employees,businessId,employeeId,serviceId,conversationId};
window.uiNavigate = async (name,nextScenario="normal") => {
 scenario = nextScenario;
 await router.push("/dashboard");
 await nextTick();
 await router.push({name,params:{id:businessId,employeeId,conversationId}});
 await nextTick();
};
