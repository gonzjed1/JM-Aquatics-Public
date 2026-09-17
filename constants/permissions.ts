import type { Role } from '@/contexts/auth-context';

/**
 * What each tier may see or do.
 *
 * Screens ask `can(role, 'viewPayroll')` instead of comparing role names, so
 * the three tiers stay defined in exactly one place. Adding a tier or moving a
 * capability is a change here, not a hunt through the screens.
 *
 * Golden rule from AGENTS.md: pay data for anyone other than yourself is
 * Owner-only. That is `viewPayroll`, and only `owner` holds it.
 */
export type Capability =
  | 'viewOwnPay'
  | 'viewPayroll' // other people's pay amounts, the payroll total, CSV export
  | 'editPayRules' // Settings → Pay rules
  | 'assignRoles' // Staff Management role toggle
  | 'manageStaff'
  | 'manageSchedule'
  | 'approveRequests'
  | 'viewAllHours';

const ADMIN_CAPABILITIES: Capability[] = [
  'manageSchedule',
  'approveRequests',
  'viewAllHours',
  'manageStaff',
];

const GRANTS: Record<Role, ReadonlySet<Capability>> = {
  owner: new Set<Capability>([
    ...ADMIN_CAPABILITIES,
    'viewOwnPay',
    'viewPayroll',
    'editPayRules',
    'assignRoles',
  ]),
  // Pay amounts and the payroll total are hidden from admins by default.
  admin: new Set<Capability>(ADMIN_CAPABILITIES),
  worker: new Set<Capability>(['viewOwnPay']),
};

export function can(role: Role | null, capability: Capability): boolean {
  return role !== null && GRANTS[role].has(capability);
}

/** How each tier is named on screen. */
export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  worker: 'Employee',
};
