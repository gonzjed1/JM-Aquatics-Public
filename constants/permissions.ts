import type { Role } from '@/contexts/auth-context';

/**
 * What each role may see or do.
 *
 * Screens ask `can(role, 'viewPayroll')` instead of comparing role names, so
 * adding Mike's manager role later (schedules and approves, but never sees pay)
 * is one line in GRANTS rather than a hunt through every screen.
 *
 * Golden rule from AGENTS.md: pay data for anyone other than yourself is
 * Jed-only. That is `viewPayroll`, and only `admin` holds it.
 */
export type Capability =
  | 'viewOwnPay'
  | 'viewPayroll' // other people's pay and company totals
  | 'manageStaff'
  | 'manageSchedule'
  | 'approveRequests'
  | 'viewAllHours';

const GRANTS: Record<Role, ReadonlySet<Capability>> = {
  admin: new Set<Capability>([
    'viewOwnPay',
    'viewPayroll',
    'manageStaff',
    'manageSchedule',
    'approveRequests',
    'viewAllHours',
  ]),
  worker: new Set<Capability>(['viewOwnPay']),
};

export function can(role: Role | null, capability: Capability): boolean {
  return role !== null && GRANTS[role].has(capability);
}
