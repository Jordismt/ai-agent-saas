<script setup>
import { ref } from 'vue';
const props = defineProps({ scenario: { type: Object, required: true }, lead: Boolean });
const selected = ref(props.scenario.slots?.[1] || '');
const professional = ref(props.scenario.professionals?.[0] || '');
const confirmed = ref(false);
</script>
<template>
  <div class="solution-demo">
    <div class="demo-bar"><b>{{ scenario.business }}</b><span>Demo local · Datos ficticios</span></div>
    <div class="demo-columns">
      <div class="demo-conversation">
        <p class="demo-label">CLIENTE</p><p class="bubble question">{{ scenario.question }}</p>
        <p class="demo-label">RESBIX · RESPUESTA SIMULADA</p><p class="bubble answer">{{ scenario.answer }}</p>
        <template v-if="!lead">
          <fieldset :disabled="confirmed"><legend>1. Elige un horario ficticio</legend><div class="demo-options"><label v-for="slot in scenario.slots" :key="slot"><input v-model="selected" type="radio" :value="slot" :name="'slot-' + scenario.business">{{ slot }}</label></div></fieldset>
          <fieldset :disabled="confirmed"><legend>2. Elige profesional</legend><div class="demo-options"><label v-for="person in scenario.professionals" :key="person"><input v-model="professional" type="radio" :value="person" :name="'professional-' + scenario.business">{{ person }}</label></div></fieldset>
          <p class="demo-data">Cliente ficticio: {{ scenario.person }} · {{ scenario.service }}</p>
        </template>
        <p v-else class="bubble question">Sí, soy Lucía Martín. Mi correo de ejemplo es lucia@example.com.</p>
        <button class="seo-button" type="button" :disabled="confirmed" @click="confirmed = true">{{ confirmed ? (lead ? 'Contacto simulado guardado' : 'Cita simulada confirmada') : (lead ? 'Simular captación del contacto' : 'Confirmar cita simulada') }}</button>
        <button v-if="confirmed" class="demo-reset" type="button" @click="confirmed = false">Reiniciar demo</button>
      </div>
      <div class="demo-agenda"><p class="demo-label">{{ lead ? 'SEGUIMIENTO EN EL PANEL' : 'MINI AGENDA · ' + scenario.day }}</p>
        <div class="agenda-placeholder" v-if="!confirmed"><span aria-hidden="true">{{ lead ? '↗' : '▦' }}</span><p>{{ lead ? 'El contacto aparecerá aquí al simular la captación.' : 'La cita aparecerá aquí al confirmar la simulación.' }}</p></div>
        <div class="agenda-entry" v-else><strong>{{ lead ? 'Nuevo contacto' : selected }}</strong><b>{{ scenario.person }}</b><span>{{ scenario.service }}</span><span v-if="!lead">{{ professional }} · {{ scenario.duration }}</span><span v-else>lucia@example.com · Interés en sesión inicial</span><small>✓ {{ lead ? 'Disponible para seguimiento · Simulado' : 'Confirmada · Simulada' }}</small></div>
        <p class="demo-status" role="status">{{ confirmed ? (lead ? 'Contacto ficticio añadido al ejemplo de panel.' : 'Reserva ficticia añadida a la mini agenda.') : 'Sin conexión con el negocio real. Puedes probar sin registrarte.' }}</p>
      </div>
    </div>
  </div>
</template>
