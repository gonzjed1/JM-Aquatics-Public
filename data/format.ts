/**
 * Display formatting shared by every screen. Dates travel through the app as
 * 'YYYY-MM-DD' strings and clock times as 'HH:MM' (24h) so mock data reads
 * plainly and an API can hand us the same shapes later.
 */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' → local midnight. `new Date('2025-08-07')` would parse as UTC and shift a day. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(iso: string): number {
  return parseISODate(iso).getDay();
}

/** '2025-08-07' → 'Thu, Aug 7' */
export function formatDayDate(iso: string): string {
  const d = parseISODate(iso);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** '2025-08-07' → 'Thu, Aug 7, 2025' */
export function formatDayDateYear(iso: string): string {
  return `${formatDayDate(iso)}, ${parseISODate(iso).getFullYear()}`;
}

/** '2025-08-07' → 'Aug 7' */
export function formatMonthDay(iso: string): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** ('2025-08-04', '2025-08-10') → 'Aug 4 – Aug 10, 2025' */
export function formatDateRange(startISO: string, endISO: string): string {
  return `${formatMonthDay(startISO)} – ${formatMonthDay(endISO)}, ${parseISODate(endISO).getFullYear()}`;
}

/** '09:00' → '9:00 AM' */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** ('09:00', '12:00') → '9:00 AM – 12:00 PM' */
export function formatTimeRange(start: string, end: string): string {
  return `${formatClock(start)} – ${formatClock(end)}`;
}

/** Hours between two 'HH:MM' times on the same day. */
export function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/** A real Date → '8:02 AM' in the device's locale. */
export function formatWallClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatCurrency(value: number): string {
  const [whole, cents] = value.toFixed(2).split('.');
  return `$${whole.replace(/\B(?=(\d{3})+$)/g, ',')}.${cents}`;
}

/** 24.4 → '24.4h', 0 → '0h' */
export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}
