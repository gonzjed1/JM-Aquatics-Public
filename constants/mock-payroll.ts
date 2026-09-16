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
