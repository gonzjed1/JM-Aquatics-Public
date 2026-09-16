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
