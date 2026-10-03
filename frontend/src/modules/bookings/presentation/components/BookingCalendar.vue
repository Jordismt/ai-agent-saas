<script setup>
import { computed, ref } from "vue";
import { calendarDays, addDays, shiftMonth, labelDate, groupBookings } from "../calendar/calendarDates.js";

const props = defineProps({
  bookings: { type: Array, required: true },
  dateKey: { type: Function, required: true },
  formatTime: { type: Function, required: true },
  statusLabel: { type: Function, required: true },
  today: { type: String, required: true },
  timezone: { type: String, required: true },
});
const emit = defineEmits(["select", "create"]);
const selectedDate = ref(props.today);
const view = ref("week");
const focusDate = computed(() => selectedDate.value || props.today);
const days = computed(() => calendarDays(focusDate.value, view.value));
const grouped = computed(() => groupBookings(props.bookings, props.dateKey));
const rowsFor = (day) => grouped.value.get(day) || [];
const dailyRows = computed(() => rowsFor(focusDate.value));
const periodLabel = computed(() => view.value === "month"
  ? labelDate(focusDate.value, { month: "long", year: "numeric" })
  : view.value === "day"
    ? labelDate(focusDate.value, { weekday: "long", day: "numeric", month: "long" })
    : `${labelDate(days.value[0], { day: "numeric", month: "short" })} – ${labelDate(days.value[6], { day: "numeric", month: "short", year: "numeric" })}`);
const visibleCount = computed(() => days.value.reduce((sum, day) => sum + rowsFor(day).length, 0));
function move(direction, mobile = false) {
  selectedDate.value = !mobile && view.value === "month"
    ? shiftMonth(focusDate.value, direction)
    : addDays(focusDate.value, direction * (!mobile && view.value === "week" ? 7 : 1));
}
function openDay(day) { selectedDate.value = day; view.value = "day"; }
</script>

<template>
  <section class="booking-calendar" aria-label="Calendario de reservas">
    <div class="calendar-toolbar">
      <div class="calendar-navigation">
        <button type="button" class="calendar-today" @click="selectedDate = today">Hoy</button>
        <button type="button" class="desktop-nav" aria-label="Periodo anterior" @click="move(-1)">‹</button>
        <button type="button" class="desktop-nav" aria-label="Periodo siguiente" @click="move(1)">›</button>
        <button type="button" class="mobile-nav" aria-label="Día anterior" @click="move(-1, true)">‹</button>
        <button type="button" class="mobile-nav" aria-label="Día siguiente" @click="move(1, true)">›</button>
      </div>
      <h3 class="desktop-period" aria-live="polite">{{ periodLabel }}</h3>
      <label class="calendar-date"><span>Fecha</span><input aria-label="Seleccionar fecha" v-model="selectedDate" type="date" required @change="selectedDate ||= today" /></label>
      <div class="calendar-views" role="group" aria-label="Vista del calendario">
        <button v-for="option in [{id:'day',label:'Día'},{id:'week',label:'Semana'},{id:'month',label:'Mes'}]"
          :key="option.id" type="button" :aria-pressed="view === option.id" @click="view = option.id">{{ option.label }}</button>
      </div>
    </div>
    <div class="calendar-context">
      <span class="desktop-period">{{ visibleCount }} {{ visibleCount === 1 ? 'reserva' : 'reservas' }} en esta vista</span>
      <span class="mobile-period" aria-live="polite">{{ labelDate(focusDate, {weekday:'long',day:'numeric',month:'long'}) }} · {{ dailyRows.length }} citas</span>
      <span>Zona horaria: {{ timezone }}</span>
    </div>

    <div class="desktop-calendar" :class="`view-${view}`">
      <div v-if="view === 'month'" class="month-weekdays" aria-hidden="true"><span v-for="day in ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']" :key="day">{{ day }}</span></div>
      <div class="calendar-grid">
        <section v-for="day in days" :key="day" class="calendar-day" :class="{ 'is-today':day === today, 'outside-month':view === 'month' && day.slice(0,7) !== focusDate.slice(0,7) }">
          <button type="button" class="calendar-day-heading" :aria-label="`Ver ${labelDate(day, {day:'numeric',month:'long'})}`" @click="openDay(day)">
            <span>{{ view === 'month' ? labelDate(day,{day:'numeric'}) : labelDate(day,{weekday:'short',day:'numeric',month:'short'}) }}</span>
            <small>{{ rowsFor(day).length }} citas</small>
          </button>
          <div class="day-bookings">
            <button v-for="booking in (view === 'month' ? rowsFor(day).slice(0,3) : rowsFor(day))" :key="booking.id"
              type="button" class="calendar-booking" :class="`booking-${booking.status}`" @click="emit('select', booking)">
              <span class="booking-time">{{ formatTime(booking.starts_at) }}<span v-if="view !== 'month'"> – {{ formatTime(booking.ends_at) }}</span></span>
              <strong>{{ booking.customer_name || 'Sin nombre' }}</strong>
              <span>{{ booking.service_name || 'Servicio' }}</span>
              <span>{{ booking.employee?.name || 'Sin asignar' }}<template v-if="booking.duration_minutes"> · {{ booking.duration_minutes }} min</template></span>
              <span class="calendar-status">{{ statusLabel(booking.status) }}</span>
            </button>
            <button v-if="view === 'month' && rowsFor(day).length > 3" type="button" class="more-bookings" @click="openDay(day)">Ver las {{ rowsFor(day).length }} citas</button>
            <p v-if="!rowsFor(day).length && view !== 'month'" class="day-empty">Sin reservas</p>
          </div>
        </section>
      </div>
      <div v-if="view === 'day' && !visibleCount" class="calendar-empty"><p>No tienes reservas para este día con los filtros actuales.</p><button type="button" @click="emit('create')">Crear reserva</button></div>
    </div>

    <div class="mobile-agenda">
      <button v-for="booking in dailyRows" :key="booking.id" type="button" class="agenda-booking" :class="`booking-${booking.status}`" @click="emit('select', booking)">
        <span class="agenda-time"><strong>{{ formatTime(booking.starts_at) }}</strong><small>{{ formatTime(booking.ends_at) }}</small></span>
        <span class="agenda-content"><strong>{{ booking.customer_name || 'Sin nombre' }}</strong><span>{{ booking.service_name || 'Servicio' }}</span><span>{{ booking.employee?.name || 'Sin asignar' }}<template v-if="booking.duration_minutes"> · {{ booking.duration_minutes }} min</template></span><span class="calendar-status">{{ statusLabel(booking.status) }}</span></span>
        <span aria-hidden="true">›</span>
      </button>
      <div v-if="!dailyRows.length" class="calendar-empty"><strong>Sin reservas para este día</strong><p>Prueba otra fecha o revisa los filtros.</p><button type="button" @click="emit('create')">Crear reserva</button></div>
    </div>
  </section>
</template>

<style scoped>
.booking-calendar { min-width:0; }
.calendar-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:12px; padding:20px; border-bottom:1px solid var(--border); }
.calendar-navigation,.calendar-views { display:flex; gap:4px; }
.calendar-toolbar button,.calendar-empty button,.more-bookings { min-height:44px; padding:0 12px; border:1px solid var(--border-strong); border-radius:8px; background:white; color:var(--text); cursor:pointer; font-weight:600; }
.calendar-navigation button:not(.calendar-today) { width:44px; font-size:24px; }
.calendar-toolbar h3 { flex:1; font-size:16px; text-transform:capitalize; }
.calendar-date { display:flex; align-items:center; gap:8px; color:var(--text-secondary); }
.calendar-date input { width:155px; padding:8px; }
.calendar-views { padding:3px; background:var(--surface-soft); border:1px solid var(--border); border-radius:10px; }
.calendar-views button { border:0; background:transparent; }
.calendar-views button[aria-pressed=true] { color:var(--primary); background:white; box-shadow:var(--shadow-sm); }
.calendar-context { padding:12px 20px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; color:var(--text-secondary); font-size:12px; }
.calendar-grid,.month-weekdays { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); }
.calendar-day { min-width:0; border-top:1px solid var(--border); border-right:1px solid var(--border); }
.calendar-day-heading { width:100%; min-height:60px; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:4px; padding:10px; color:var(--text); background:var(--surface-soft); cursor:pointer; text-align:left; }
.calendar-day-heading span { font-weight:650; text-transform:capitalize; }
.calendar-day-heading small { color:var(--text-secondary); font-size:11px; }
.is-today .calendar-day-heading { background:var(--primary-soft); color:var(--primary); }
.day-bookings { display:flex; flex-direction:column; gap:8px; padding:8px; }
.calendar-booking { display:flex; flex-direction:column; gap:5px; width:100%; padding:10px 8px; border:1px solid var(--border); border-left:3px solid var(--primary); border-radius:8px; background:#f8faff; color:var(--text); text-align:left; cursor:pointer; overflow-wrap:anywhere; line-height:1.4; font-size:12px; }
.calendar-booking strong { font-size:13px; }
.calendar-booking:hover,.agenda-booking:hover { border-color:var(--primary); box-shadow:var(--shadow-sm); }
.booking-time { font-weight:700; color:var(--primary); font-variant-numeric:tabular-nums; }
.calendar-status { align-self:flex-start; padding:3px 6px; border-radius:5px; background:white; font-size:11px; font-weight:650; }
.booking-pending { border-left-color:#b45309; background:#fffbeb; }
.booking-completed { border-left-color:#15803d; background:#f0fdf4; }
.booking-cancelled { border-left-color:#b91c1c; background:#fff5f5; }
.booking-no_show { border-left-color:#64748b; background:#f1f5f9; }
.day-empty { padding:24px 4px; text-align:center; font-size:12px; color:var(--text-secondary); }
.calendar-day { min-height:180px; }
.view-day .calendar-grid { grid-template-columns:1fr; }
.view-day .calendar-booking { padding:16px; font-size:14px; }
.view-day .calendar-booking strong { font-size:15px; }
.month-weekdays span { padding:12px; font-size:12px; color:var(--text-secondary); }
.view-month .calendar-day { min-height:145px; }
.view-month .calendar-day-heading { min-height:44px; flex-direction:row; justify-content:space-between; align-items:center; padding:8px; }
.view-month .calendar-booking { font-size:11px; }
.view-month .calendar-booking strong { font-size:12px; }
.view-month .calendar-booking > span:not(.booking-time) { display:none; }
.view-month .calendar-booking > .calendar-status { display:block !important; }
.outside-month .calendar-day-heading { color:var(--text-secondary); background:white; }
.more-bookings { padding:6px; font-size:11px; }
.calendar-empty { padding:32px 20px; display:grid; gap:12px; justify-items:center; text-align:center; color:var(--text-secondary); }
.calendar-empty button { background:var(--primary); color:white; border-color:var(--primary); }
.mobile-agenda,.mobile-nav,.mobile-period { display:none; }
@media (min-width:701px) and (max-width:1200px) {
 .calendar-toolbar { display:grid; grid-template-columns:auto minmax(0,1fr); }
 .calendar-toolbar h3 { min-width:0; line-height:1.5; }
 .calendar-date { justify-self:start; }
 .calendar-views { justify-self:end; }
 .view-week .calendar-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .view-week .calendar-day:last-child { grid-column:1/-1; }
 .view-month .calendar-booking { padding:6px 4px; }
 .view-month .calendar-day-heading small { display:none; }
 .view-month .calendar-booking > strong { font-size:11px; }
}
@media(max-width:700px) {
 .desktop-calendar,.desktop-nav,.desktop-period,.calendar-views { display:none; }
 .mobile-nav,.mobile-period { display:block; }
 .calendar-toolbar { padding:12px; gap:8px; justify-content:space-between; }
 .calendar-date > span { display:none; }
 .calendar-date input { width:140px; font-size:16px; }
 .calendar-context { padding:12px; flex-direction:column; }
 .mobile-agenda { display:grid; gap:10px; padding:0 12px 16px; }
 .agenda-booking { background:#f8faff; width:100%; display:flex; gap:12px; padding:14px 12px; border:1px solid var(--border); border-left:3px solid var(--primary); border-radius:10px; color:var(--text); text-align:left; cursor:pointer; }
 .agenda-time { display:flex; flex-direction:column; gap:4px; flex-shrink:0; font-variant-numeric:tabular-nums; }
 .agenda-time strong { font-size:16px; }
 .agenda-time small { color:var(--text-secondary); }
 .agenda-content { display:flex; flex:1; min-width:0; flex-direction:column; gap:5px; overflow-wrap:anywhere; }
 .agenda-content > span { font-size:13px; }
}
@media(max-width:360px) { .calendar-date { width:100%; } .calendar-date input { width:100%; } }

.agenda-booking.booking-pending { border-left-color:#b45309; background:#fffbeb; }
.agenda-booking.booking-completed { border-left-color:#15803d; background:#f0fdf4; }
.agenda-booking.booking-cancelled { border-left-color:#b91c1c; background:#fff5f5; }
.agenda-booking.booking-no_show { border-left-color:#64748b; background:#f1f5f9; }
</style>
