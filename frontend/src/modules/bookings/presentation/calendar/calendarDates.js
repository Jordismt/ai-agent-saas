// Civil-date arithmetic for presentation only. Booking instants remain unchanged.
export function addDays(key, amount) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function startOfWeek(key) {
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
  return addDays(key, -(weekday === 0 ? 6 : weekday - 1));
}

export function shiftMonth(key, amount) {
  const date = new Date(`${key}T12:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}

export function calendarDays(key, view) {
  if (view === "day") return [key];
  const start = startOfWeek(view === "month" ? `${key.slice(0, 7)}-01` : key);
  return Array.from({ length: view === "month" ? 42 : 7 }, (_, index) => addDays(start, index));
}

export function labelDate(key, options = {}) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", ...options })
    .format(new Date(`${key}T12:00:00Z`));
}

export function groupBookings(bookings, dateKey) {
  const groups = new Map();
  for (const booking of bookings) {
    const key = dateKey(booking.starts_at);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(booking);
  }
  for (const rows of groups.values()) rows.sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  return groups;
}
