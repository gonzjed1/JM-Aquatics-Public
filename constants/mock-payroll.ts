/**
 * Mock payroll values shared by every screen that shows money.
 *
 * AGENTS.md requires one rate across all screens ($24.50/hr). Keeping it here
 * means Timesheet and Pay cannot drift apart again, while each screen still
 * owns its own fenced mock data block and its own pay math, per the mock data
 * convention.
 *
 * When the payroll API lands this is replaced by a rate from the worker's
 * profile — the screens keep reading a single value either way.
 */
export const MOCK_HOURLY_RATE = 24.5;

/**
 * The signed-in worker's current week, shared by My Hours and My Pay so the
 * two can't drift. Mon Aug 4 – Sun Aug 10 2025 around the frozen demo day;
 * 21.5h, which sits inside the 24.4h My Pay reports for Aug 1–15.
 */
export type MockWorkDay = {
  day: string;
  date: string;
  /** null when the worker was off that day. */
  in: string | null;
  /** null while the shift is still open. */
  out: string | null;
  hours: number;
};

export const MOCK_MY_WEEK_LABEL = 'Mon, Aug 4 – Sun, Aug 10';

export const MOCK_MY_WEEK: MockWorkDay[] = [
  { day: 'Mon', date: 'Aug 4', in: '8:02 AM', out: '4:31 PM', hours: 8 },
  { day: 'Tue', date: 'Aug 5', in: '7:58 AM', out: '4:29 PM', hours: 8 },
  { day: 'Wed', date: 'Aug 6', in: '8:05 AM', out: '12:08 PM', hours: 4 },
  { day: 'Thu', date: 'Aug 7', in: null, out: null, hours: 0 },
  { day: 'Fri', date: 'Aug 8', in: '8:02 AM', out: null, hours: 1.5 },
];

export function mockWeekHours(): number {
  return MOCK_MY_WEEK.reduce((sum, d) => sum + d.hours, 0);
}
