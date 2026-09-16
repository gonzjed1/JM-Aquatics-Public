import { formatDayDate, formatTimeRange } from '@/data/format';
import type { Shift } from '@/data/mock-seed';

/** 'Fri, Aug 8 · 4:00 PM – 8:00 PM · SPRFC Severna Park' — the one-line way a shift is named everywhere. */
export function shiftLabel(shift: Shift): string {
  return `${formatDayDate(shift.date)} · ${formatTimeRange(shift.start, shift.end)} · ${shift.location}`;
}

/** '9:00 AM – 12:00 PM · LA Fitness Bowie' — time always travels with the location. */
export function shiftTimePlace(shift: Shift): string {
  return `${formatTimeRange(shift.start, shift.end)} · ${shift.location}`;
}

export function openSlots(shift: Shift): number {
  return Math.max(0, shift.slots - shift.assigned.length);
}

export function isOpen(shift: Shift): boolean {
  return openSlots(shift) > 0;
}

/** Same day and the hours intersect — a person can't take both. */
export function shiftsOverlap(a: Shift, b: Shift): boolean {
  return a.date === b.date && a.start < b.end && b.start < a.end;
}
