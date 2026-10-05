<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";

// Intentionally self-contained: no services, persistence, auth or network access.
const stage = ref(0);
const selectedTime = ref("");
const busy = ref(false);
const view = ref("chat");
const transcript = ref(null);
const agendaPanel = ref(null);
const controls = ref(null);
let timer;
const slots = ["16:00", "17:30", "19:00"];
const appointments = computed(() =>
  [
    {
      time: "09:00",
      name: "María López",
      service: "Depilación",
      professional: "Elena",
    },
    {
      time: "11:30",
      name: "Carla Ruiz",
      service: "Limpieza facial",
      professional: "Elena",
    },
    ...(stage.value === 3
      ? [
          {
            time: selectedTime.value,
            name: "Laura García",
            service: "Limpieza facial",
            professional: "Elena",
            fresh: true,
          },
        ]
      : []),
  ].sort((a, b) => a.time.localeCompare(b.time)),
);
const progress = computed(
  () =>
    [
      "Inicia la conversación",
      "Elige un horario",
      "Confirma los datos de ejemplo",
      "Reserva en la agenda",
    ][stage.value],
);
async function scrollChat() {
  await nextTick();
  if (transcript.value)
    transcript.value.scrollTop = transcript.value.scrollHeight;
}
function advance(expected, next) {
  if (busy.value || stage.value !== expected) return;
  busy.value = true;
  scrollChat();
  timer = setTimeout(
    () => {
      stage.value = next;
      busy.value = false;
      timer = undefined;
      scrollChat();
      nextTick(() =>
        controls.value
          ?.querySelector("button:not(:disabled)")
          ?.focus({ preventScroll: true }),
      );
    },
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650,
  );
}
function choose(time) {
  if (stage.value !== 1 || busy.value || !slots.includes(time)) return;
  selectedTime.value = time;
  advance(1, 2);
}
function reset() {
  clearTimeout(timer);
  timer = undefined;
  stage.value = 0;
  selectedTime.value = "";
  busy.value = false;
  view.value = "chat";
  scrollChat();
}
async function showAgenda() {
  view.value = "agenda";
  await nextTick();
  agendaPanel.value?.focus({ preventScroll: true });
  if (window.matchMedia("(max-width: 700px)").matches)
    agendaPanel.value?.scrollIntoView({ behavior: "instant", block: "start" });
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="booking-demo">
    <div class="demo-bar">
      <span
        ><span class="demo-mark">✳</span> Resbix
        <span class="demo-divider">/</span> Centro Aura</span
      ><span class="demo-label">Negocio ficticio · Demo guiada</span>
    </div>
    <div class="demo-progress">
      <span class="step-dot">{{ stage + 1 }}</span
      ><span>{{ progress }}</span
      ><button type="button" @click="reset">Reiniciar ↻</button>
    </div>
    <div class="demo-mobile-switch" aria-label="Vista de la demostración">
      <button
        type="button"
        :aria-pressed="view === 'chat'"
        @click="view = 'chat'"
      >
        Conversación
      </button>
      <button
        type="button"
        :aria-pressed="view === 'agenda'"
        @click="showAgenda"
      >
        Agenda <span v-if="stage === 3">+1</span>
      </button>
    </div>
    <div class="demo-columns">
      <section
        class="demo-chat"
        :class="{ 'mobile-hidden': view !== 'chat' }"
        aria-labelledby="demo-chat-title"
      >
        <div class="panel-heading">
          <span class="aura-avatar">A</span>
          <div>
            <h3 id="demo-chat-title">Asistente de Centro Aura</h3>
            <p>La experiencia de tu cliente</p>
          </div>
          <span class="agent-badge">Agente IA</span>
        </div>
        <div
          ref="transcript"
          class="demo-transcript"
          role="log"
          aria-label="Conversación simulada"
          aria-live="polite"
          :aria-busy="busy"
        >
          <p class="message agent">
            ¡Hola! Soy el asistente de Centro Aura. Te ayudo con nuestros
            servicios y reservas.
          </p>
          <template v-if="stage >= 1">
            <p class="message customer">
              Hola, quería reservar una limpieza facial para el viernes por la
              tarde.
            </p>
            <p class="message agent">
              ¡Claro! La limpieza facial dura 60 minutos. Estos son los horarios
              disponibles con Elena. ¿Cuál prefieres?
            </p>
          </template>
          <template v-if="stage >= 2">
            <p class="message customer">A las {{ selectedTime }}, por favor.</p>
            <p class="message agent">
              Perfecto. Para preparar tu reserva necesito tu nombre y teléfono.
            </p>
          </template>
          <template v-if="stage === 3">
            <p class="message customer">
              Laura García · 612 ••• 678 (ficticio)
            </p>
            <p class="message agent confirmation">
              ✓ Reserva confirmada para el viernes a las {{ selectedTime }}.
              Limpieza facial con Elena. ¡Te esperamos, Laura!
            </p>
          </template>
          <div
            v-if="busy"
            class="demo-typing"
            aria-label="El asistente está preparando la respuesta"
          >
            <i></i><i></i><i></i>
          </div>
        </div>
        <div ref="controls" class="demo-controls">
          <p v-if="stage < 3" class="control-hint">
            {{
              stage === 0
                ? "Prueba el recorrido de una reserva."
                : stage === 1
                  ? "Selecciona un horario de ejemplo."
                  : "Usaremos datos ficticios, sin pedirte datos personales."
            }}
          </p>
          <button
            v-if="stage === 0"
            type="button"
            class="demo-primary"
            :disabled="busy"
            @click="advance(0, 1)"
          >
            {{ busy ? "Preparando respuesta…" : "Iniciar demo →" }}
          </button>
          <div v-else-if="stage === 1" class="demo-slots">
            <button
              v-for="slot in slots"
              :key="slot"
              type="button"
              :disabled="busy"
              @click="choose(slot)"
            >
              {{ slot }}
            </button>
          </div>
          <template v-else-if="stage === 2"
            ><div class="example-contact">
              <span>LG</span>
              <div>
                <b>Laura García</b><small>612 ••• 678 · Datos ficticios</small>
              </div>
            </div>
            <button
              type="button"
              class="demo-primary"
              :disabled="busy"
              @click="advance(2, 3)"
            >
              {{ busy ? "Confirmando…" : "Confirmar reserva de ejemplo →" }}
            </button></template
          >
          <template v-else
            ><p class="demo-success" role="status">
              ✓ La cita ya aparece en la agenda del negocio.
            </p>
            <button
              type="button"
              class="demo-primary agenda-link"
              @click="showAgenda"
            >
              Ver en agenda →</button
            ><button type="button" class="demo-again" @click="reset">
              Probar otro horario ↻
            </button></template
          >
        </div>
      </section>
      <section
        ref="agendaPanel"
        class="demo-agenda"
        :class="{ 'mobile-hidden': view !== 'agenda' }"
        tabindex="-1"
        aria-labelledby="demo-agenda-title"
      >
        <div class="agenda-title">
          <div>
            <span class="panel-eyebrow">EL LADO DE TU NEGOCIO</span>
            <h3 id="demo-agenda-title">Agenda de reservas</h3>
          </div>
          <span class="agenda-icon" aria-hidden="true">▦</span>
        </div>
        <div class="agenda-day">
          <b>Viernes</b><span>{{ appointments.length }} citas de ejemplo</span>
        </div>
        <div class="agenda-list" aria-live="polite">
          <article
            v-for="appointment in appointments"
            :key="appointment.name"
            class="appointment"
            :class="{ fresh: appointment.fresh }"
          >
            <time>{{ appointment.time }}</time>
            <div>
              <span v-if="appointment.fresh" class="new-booking"
                >NUEVA RESERVA</span
              >
              <h4>{{ appointment.name }}</h4>
              <p>{{ appointment.service }}</p>
              <small>Profesional: {{ appointment.professional }}</small
              ><span class="booking-status">✓ Confirmada</span>
            </div>
          </article>
          <div v-if="stage < 3" class="agenda-empty">
            <span aria-hidden="true">↳</span>
            <p>
              Tu próxima reserva aparecerá aquí.<small
                >Completa la conversación para ver cómo llega al negocio.</small
              >
            </p>
          </div>
        </div>
        <div class="agenda-note">
          <span aria-hidden="true">↔</span>
          <p>
            La atención y las reservas, conectadas.<small
              >En tu panel puedes revisar las citas y gestionar los
              cambios.</small
            >
          </p>
        </div>
      </section>
    </div>
    <p class="demo-disclaimer">
      Demostración simulada. No envía mensajes ni crea reservas reales.
    </p>
  </div>
</template>

<style scoped>
.booking-demo {
  border: 1px solid #dcd8ef;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 24px 70px #30266a12;
  color: #20243b;
  font-size: 14px;
}
.demo-bar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 24px;
  background: #202139;
  color: #fff;
  font-weight: 700;
}
.demo-mark {
  color: #b4a8ff;
  margin-right: 7px;
  font-size: 23px;
}
.demo-divider {
  color: #9494af;
  margin: 0 12px;
}
.demo-label {
  font-size: 12px;
  color: #d4cfee;
  font-weight: 400;
}
.demo-progress {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eceaf4;
  color: #51477b;
  font-weight: 600;
}
.step-dot {
  display: grid;
  place-items: center;
  background: #eeeaff;
  color: #5942bc;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
}
.demo-progress button {
  margin-left: auto;
  background: none;
  color: #5942bc;
  padding: 10px;
  min-height: 44px;
  cursor: pointer;
  white-space: nowrap;
}
.demo-columns {
  display: grid;
  grid-template-columns: 1.08fr 1fr;
}
.demo-chat {
  min-width: 0;
  border-right: 1px solid #eceaf4;
  display: flex;
  flex-direction: column;
}
.panel-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-bottom: 1px solid #eceaf4;
}
.aura-avatar {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #ebe5ff;
  color: #614bc4;
  font-weight: 800;
  flex-shrink: 0;
}
.panel-heading h3 {
  font-size: 15px;
  line-height: 1.4;
  margin: 0;
}
.panel-heading p {
  font-size: 12px;
  color: #64667d;
  margin: 4px 0 0;
}
.agent-badge {
  margin-left: auto;
  background: #ecf7f0;
  color: #26714b;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 11px;
  white-space: nowrap;
}
.demo-transcript {
  height: 330px;
  overflow: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  background: #f9f8fd;
  scroll-behavior: auto;
}
.message {
  font-size: 14px;
  line-height: 1.65;
  max-width: 88%;
  padding: 13px 16px;
  margin: 0;
  border-radius: 14px;
  flex-shrink: 0;
  animation: message-in 0.25s ease-out;
}
.message.agent {
  background: #fff;
  border: 1px solid #e6e1f1;
  border-bottom-left-radius: 4px;
  color: #42405a;
}
.message.customer {
  align-self: flex-end;
  background: #6656ed;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.message.confirmation {
  background: #f0faf4;
  border-color: #bcdec8;
  color: #21603c;
}
.demo-controls {
  padding: 20px 24px;
  min-height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}
.control-hint {
  font-size: 12px;
  color: #626078;
  line-height: 1.6;
  margin: 0;
}
.demo-primary {
  border: 0;
  border-radius: 10px;
  background: #6656ed;
  color: white;
  min-height: 48px;
  padding: 12px 16px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.demo-primary:hover {
  background: #5141cf;
}
.demo-primary:disabled,
.demo-slots button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.demo-slots {
  display: flex;
  gap: 10px;
}
.demo-slots button {
  flex: 1;
  min-height: 48px;
  border: 1px solid #b7ace9;
  border-radius: 10px;
  background: #f4f1ff;
  color: #5844b6;
  font-weight: 700;
  cursor: pointer;
}
.demo-slots button:hover {
  background: #e5dfff;
}
.example-contact {
  display: flex;
  gap: 12px;
  align-items: center;
}
.example-contact > span {
  background: #f1edfc;
  color: #634bbb;
  border-radius: 50%;
  padding: 10px;
}
.example-contact small {
  display: block;
  color: #656078;
  font-size: 11px;
  line-height: 1.5;
  margin-top: 3px;
}
.demo-agenda {
  min-width: 0;
  padding: 28px;
  background: #fcfcff;
}
.agenda-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}
.panel-eyebrow {
  color: #655a93;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
}
.agenda-title h3 {
  font-size: 24px;
  letter-spacing: -0.8px;
  line-height: 1.25;
  margin: 8px 0 0;
}
.agenda-icon {
  display: grid;
  place-items: center;
  background: #eeebfc;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #6752c8;
  font-size: 24px;
}
.agenda-day {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 24px 0 14px;
  border-bottom: 1px solid #e8e6f0;
}
.agenda-day span {
  color: #6c697e;
  font-size: 12px;
}
.agenda-list {
  padding-top: 10px;
  min-height: 330px;
}
.appointment {
  display: flex;
  gap: 18px;
  border: 1px solid #e7e5ef;
  border-radius: 12px;
  padding: 16px;
  background: white;
  margin-bottom: 10px;
}
.appointment time {
  color: #5b4e90;
  font-weight: 700;
  font-size: 13px;
}
.appointment > div {
  border-left: 2px solid #d9d1f4;
  padding-left: 14px;
}
.appointment h4 {
  font-size: 14px;
  margin: 0 0 4px;
}
.appointment p {
  font-size: 13px;
  margin: 0;
  color: #5c5970;
}
.appointment small {
  display: block;
  font-size: 11px;
  color: #6c687e;
  margin: 6px 0;
}
.booking-status {
  display: inline-block;
  color: #226342;
  background: #edf7f1;
  border-radius: 5px;
  font-size: 10px;
  padding: 4px 7px;
}
.appointment.fresh {
  background: #f5f2ff;
  border-color: #a795e5;
  animation: message-in 0.35s ease-out;
}
.appointment.fresh > div {
  border-color: #8062d8;
}
.new-booking {
  display: block;
  font-size: 9px;
  color: #6344bb;
  letter-spacing: 1px;
  font-weight: 800;
  margin-bottom: 7px;
}
.agenda-empty {
  display: flex;
  gap: 14px;
  align-items: center;
  border: 1px dashed #d7d0e8;
  border-radius: 12px;
  padding: 20px;
  color: #655a88;
}
.agenda-empty > span {
  font-size: 28px;
}
.agenda-empty p,
.agenda-note p {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}
.agenda-empty small,
.agenda-note small {
  display: block;
  font-size: 12px;
  color: #706982;
  margin-top: 5px;
}
.agenda-note {
  display: flex;
  gap: 13px;
  border-top: 1px solid #e4e0ee;
  padding-top: 18px;
  margin-top: 14px;
  color: #524572;
}
.agenda-note > span {
  font-size: 22px;
}
.demo-disclaimer {
  margin: 0;
  border-top: 1px solid #eceaf4;
  padding: 14px 24px;
  color: #686279;
  font-size: 12px;
  text-align: center;
}
.demo-success {
  color: #23613f;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
.demo-again {
  background: none;
  color: #614bbc;
  min-height: 44px;
  cursor: pointer;
}
.demo-typing {
  display: flex;
  gap: 5px;
  padding: 14px;
  align-self: flex-start;
  background: #eeebf8;
  border-radius: 10px;
}
.demo-typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8977bd;
  animation: typing-dot 0.8s infinite alternate;
}
.demo-typing i:nth-child(2) {
  animation-delay: 0.15s;
}
.demo-typing i:nth-child(3) {
  animation-delay: 0.3s;
}
.demo-mobile-switch,
.agenda-link {
  display: none;
}
button:focus-visible,
[tabindex]:focus-visible {
  outline: 3px solid #9a7de4;
  outline-offset: -3px;
}
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes typing-dot {
  to {
    opacity: 0.3;
  }
}
@media (max-width: 700px) {
  .demo-bar {
    padding: 16px;
    flex-wrap: wrap;
    gap: 6px;
  }
  .demo-label {
    width: 100%;
    padding-left: 30px;
  }
  .demo-progress {
    padding: 10px 12px;
    font-size: 12px;
    gap: 8px;
  }
  .demo-progress button {
    font-size: 12px;
    padding: 8px;
  }
  .demo-columns {
    grid-template-columns: 1fr;
  }
  .demo-chat {
    border-right: 0;
  }
  .mobile-hidden {
    display: none;
  }
  .demo-mobile-switch {
    display: flex;
    padding: 10px 12px;
    gap: 8px;
    background: #f6f4fc;
  }
  .demo-mobile-switch button {
    flex: 1;
    min-height: 44px;
    border-radius: 9px;
    background: transparent;
    color: #686078;
    cursor: pointer;
  }
  .demo-mobile-switch button[aria-pressed="true"] {
    background: white;
    color: #5b3caa;
    box-shadow: 0 2px 7px #34224e12;
    font-weight: 700;
  }
  .demo-mobile-switch span {
    background: #e9f7ed;
    color: #21653e;
    border-radius: 5px;
    padding: 3px 5px;
  }
  .panel-heading {
    padding: 16px;
    gap: 9px;
  }
  .panel-heading h3 {
    font-size: 13px;
  }
  .agent-badge {
    font-size: 9px;
    padding: 5px;
  }
  .aura-avatar {
    width: 34px;
    height: 34px;
  }
  .demo-transcript {
    padding: 16px;
    height: 330px;
  }
  .demo-controls {
    padding: 18px 16px;
    min-height: 180px;
  }
  .demo-agenda {
    padding: 22px 16px;
    min-height: 590px;
  }
  .agenda-link {
    display: block;
  }
  .demo-disclaimer {
    font-size: 11px;
    padding: 12px;
  }
  .booking-demo {
    border-radius: 16px;
  }
  .appointment {
    gap: 12px;
  }
  .message {
    max-width: 94%;
    font-size: 13px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
</style>
