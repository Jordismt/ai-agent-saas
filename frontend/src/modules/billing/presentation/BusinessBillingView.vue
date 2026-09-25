<script setup>
import { onMounted,ref,computed } from "vue";
import { useRoute } from "vue-router";
import { BillingService } from "../infrastructure/BillingService.js";
const route=useRoute(), service=new BillingService();
const id=computed(()=>route.params.id), billing=ref(null), busy=ref(false), loading=ref(true), error=ref("");
const showCancel=ref(false);
const active=computed(()=>["trialing","active"].includes(billing.value?.status));
async function refresh(){loading.value=true;error.value="";try{billing.value=(await service.getStatus(id.value)).billing;}catch(e){error.value=e.message;}finally{loading.value=false;}}
async function open(kind){busy.value=true;error.value="";try{const result=kind==="checkout"?await service.createCheckout(id.value):await service.createPortal(id.value);if(!result?.url)throw Error("Stripe no devolvió una URL");window.location.assign(result.url);}catch(e){error.value=e.message;busy.value=false;}}
async function changeRenewal(cancel){busy.value=true;error.value="";try{await service.setRenewal(id.value,cancel);showCancel.value=false;await refresh();}catch(e){error.value=e.message;}finally{busy.value=false;}}
const dateLabel = v => v ? new Intl.DateTimeFormat("es-ES",{dateStyle:"long"}).format(new Date(v)) : "Pendiente de confirmar";
onMounted(refresh);
</script>
<template>
 <main class="billing-screen"><RouterLink to="/businesses" class="back">← Mis negocios</RouterLink>
  <section class="bill-card"><div class="eyebrow">RESBIX / SUSCRIPCIÓN POR NEGOCIO</div><h1>Activa tu negocio<span>.</span></h1>
  <p class="intro">Tus datos están guardados. Para activar el agente IA, las reservas y la web, completa tu suscripción.</p>
  <div class="price">110 €<small>/mes</small></div><p class="trial">7 días gratis · Tarjeta obligatoria · Sin cobro inicial</p>
  <div class="founder">¿Tienes el código <strong>FUNDADORES50</strong>? Introdúcelo en Stripe Checkout para obtener el 50 % durante 12 meses, si quedan canjes disponibles.</div>
  <p v-if="error" role="alert" class="error">{{error}}</p>
  <p v-if="loading">Comprobando suscripción…</p>
  <template v-else><p class="status">Estado: <strong>{{billing?.status || "Pendiente de contratación"}}</strong></p>
   <template v-if="active">
    <RouterLink :to="`/businesses/${id}`" class="button">Entrar en mi negocio →</RouterLink>
    <div class="management"><h2>Gestionar suscripción</h2>
      <p v-if="billing?.cancel_at_period_end">La renovación está cancelada. Acceso hasta: <strong>{{dateLabel(billing?.cancel_at || billing?.current_period_end)}}</strong>.</p>
      <p v-else>Próxima renovación o fin de prueba: <strong>{{dateLabel(billing?.current_period_end || billing?.trial_end)}}</strong>.</p>
      <button v-if="billing?.cancel_at_period_end" class="secondary" :disabled="busy" @click="changeRenewal(false)">Reactivar renovación</button>
      <template v-else><button class="secondary" :disabled="busy" @click="open('portal')">Actualizar método de pago ↗</button>
        <button class="danger" :disabled="busy" @click="showCancel=true">Cancelar renovación</button></template>
      <div v-if="showCancel" class="confirm" role="group" aria-label="Confirmar cancelación"><p>¿Cancelar la renovación de este negocio? Mantendrás el acceso hasta el final del periodo actual.</p>
        <button class="danger" :disabled="busy" @click="changeRenewal(true)">Sí, cancelar renovación</button>
        <button class="secondary" :disabled="busy" @click="showCancel=false">Volver</button></div>
    </div>
   </template>
   <button v-else-if="!billing?.stripe_subscription_id" class="button" :disabled="busy" @click="open('checkout')">{{busy?'Conectando…':'Comenzar 7 días gratis →'}}</button>
   <button v-else class="button" :disabled="busy" @click="open('portal')">Gestionar pago y suscripción ↗</button>
   <button class="refresh" :disabled="busy" @click="refresh">Actualizar estado</button>
  </template><p class="fine">Volver de Checkout no activa el servicio. Esperamos la confirmación segura del webhook.</p></section>
 </main>
</template>
<style scoped>
.billing-screen{min-height:80vh;background:#f7f8fc;padding:48px 20px;color:#19263e;font-family:Inter,system-ui,sans-serif}.back{display:block;max-width:730px;margin:auto auto 28px;color:#60708c;text-decoration:none;font-weight:700}.bill-card{max-width:730px;margin:auto;padding:clamp(26px,5vw,56px);border-radius:24px;background:#fff;border:1px solid #e4e9f3;box-shadow:0 24px 70px #2130520b}.eyebrow{font-size:11px;letter-spacing:.19em;color:#6279b0;font-weight:850}.bill-card h1{font-size:clamp(34px,6vw,58px);letter-spacing:-.055em;margin:16px 0}.bill-card h1 span{color:#3759ee}.intro{line-height:1.7;color:#65748b;max-width:560px}.price{font-size:66px;font-weight:850;letter-spacing:-.06em;margin-top:28px}.price small{font-size:18px;letter-spacing:0;color:#8290a5;font-weight:500}.trial{color:#536783;font-weight:700}.founder{background:#edf3ff;border-radius:14px;padding:18px;margin:28px 0;line-height:1.6}.button{display:block;box-sizing:border-box;text-align:center;text-decoration:none;background:#3153ed;border:0;border-radius:12px;color:#fff;padding:17px;width:100%;font-weight:800;cursor:pointer;font-size:15px}.button:disabled{opacity:.5}.refresh{background:none;border:0;display:block;margin:20px auto;cursor:pointer;color:#596b89}.fine{font-size:12px;color:#8490a2;margin-top:24px}.error{color:#bd2635}.status{color:#65748b}.management{margin-top:28px;padding-top:24px;border-top:1px solid #e4e9f3}.management h2{font-size:21px}.management p{line-height:1.6;color:#60708c}.secondary,.danger{display:block;width:100%;padding:13px;margin-top:12px;border-radius:10px;cursor:pointer;font-weight:750;background:#fff;border:1px solid #cbd5e1;color:#3153ed}.danger{color:#b42335;border-color:#f0c6cb}.confirm{padding:16px;background:#fff5f5;border-radius:12px;margin-top:16px}
</style>
