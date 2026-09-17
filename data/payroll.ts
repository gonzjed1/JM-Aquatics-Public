import { addDays, parseISODate, toISODate } from '@/data/format';
import type { PayrollLine, StaffMember } from '@/data/mock-seed';

/**
 * Pay math for the admin payroll screens, in one place. Not confirmed with J&M
 * yet — every figure downstream is an estimate until the rules are.
 */
export const OVERTIME_MULTIPLIER = 1.5;

export function grossFor(line: PayrollLine, hourlyRate: number): number {
  return line.hours * hourlyRate + line.overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
}

export type PayrollRow = { staff: StaffMember; line: PayrollLine; gross: number };

/** Lines joined to people, alphabetical. Lines for unknown staff are dropped, not crashed on. */
export function payrollRows(
  lines: PayrollLine[],
  staffById: (id: string) => StaffMember | undefined
): PayrollRow[] {
  return lines
    .flatMap((line) => {
      const staff = staffById(line.staffId);
      return staff ? [{ staff, line, gross: grossFor(line, staff.hourlyRate) }] : [];
    })
    .sort((a, b) => a.staff.name.localeCompare(b.staff.name));
}

export function payrollTotal(rows: PayrollRow[]): number {
  return rows.reduce((sum, row) => sum + row.gross, 0);
}

/** RFC 4180-style CSV: every cell quoted, CRLF line ends, a Total row last. */
export function payrollCsv(rows: PayrollRow[], period: { start: string; end: string }): string {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const line = (cells: (string | number)[]) => cells.map(cell).join(',');
  const header = line(['Employee', 'Hours', 'OT Hours', 'Rate', 'Gross Pay', 'Period Start', 'Period End']);
  const body = rows.map((r) =>
    line([
      r.staff.name,
      r.line.hours,
      r.line.overtimeHours,
      r.staff.hourlyRate.toFixed(2),
      r.gross.toFixed(2),
      period.start,
      period.end,
    ])
  );
  const total = line(['Total', '', '', '', payrollTotal(rows).toFixed(2), '', '']);
  return [header, ...body, total].join('\r\n');
}

// --- totals over a date range ------------------------------------------------------
//
// The seed holds one pay period (Aug 1–15), so anything longer than that is a
// projection from it rather than a ledger: each person's hours in the period
// become a weekly rate, and a range is that rate times its length. Weekly
// figures land on real numbers; monthly and annual are estimates and the
// screen says so. When payroll history is served, `payrollForRange` reads it
// and nothing above this line changes.

/** Length of the seeded pay period, used to turn its totals into a weekly rate. */
const SEED_PERIOD_DAYS = 15;

export type RangeScale = 'weekly' | 'monthly' | 'annual';
export type DateRange = { start: string; end: string };

export function weeklyHoursFor(line: PayrollLine): number {
  return (line.hours + line.overtimeHours) / (SEED_PERIOD_DAYS / 7);
}

/** Inclusive, so Mon–Sun is 7. */
export function daysInRange(range: DateRange): number {
  const ms = parseISODate(range.end).getTime() - parseISODate(range.start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** The week (Mon–Sun), month, or year that `anchor` falls in. */
export function rangeFor(scale: RangeScale, anchor: string): DateRange {
  const date = parseISODate(anchor);
  if (scale === 'weekly') {
    const weekday = date.getDay();
    const start = addDays(anchor, weekday === 0 ? -6 : 1 - weekday);
    return { start, end: addDays(start, 6) };
  }
  const year = date.getFullYear();
  if (scale === 'monthly') {
    const month = date.getMonth();
    return { start: toISODate(new Date(year, month, 1)), end: toISODate(new Date(year, month + 1, 0)) };
  }
  return { start: toISODate(new Date(year, 0, 1)), end: toISODate(new Date(year, 11, 31)) };
}

/** Moves the anchor one range forward or back. */
export function stepAnchor(scale: RangeScale, anchor: string, delta: number): string {
  if (scale === 'weekly') return addDays(anchor, 7 * delta);
  const date = parseISODate(anchor);
  return toISODate(
    scale === 'monthly'
      ? new Date(date.getFullYear(), date.getMonth() + delta, 1)
      : new Date(date.getFullYear() + delta, 0, 1)
  );
}

/** Each person's hours and gross across the range, biggest first. */
export function payrollForRange(rows: PayrollRow[], range: DateRange): PayrollRow[] {
  const weeks = daysInRange(range) / 7;
  return rows
    .map(({ staff, line }) => {
      const hours = weeklyHoursFor(line) * weeks;
      // Overtime is a per-week rule, so a projection can't say where it lands.
      const scaled: PayrollLine = { staffId: line.staffId, hours, overtimeHours: 0 };
      return { staff, line: scaled, gross: grossFor(scaled, staff.hourlyRate) };
    })
    .sort((a, b) => b.line.hours - a.line.hours || a.staff.name.localeCompare(b.staff.name));
}
