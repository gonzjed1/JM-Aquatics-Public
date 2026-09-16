/**
 * ============================================================================
 * MOCK SEED — the whole company as of one frozen demo day.
 *
 * Every screen reads from this through the AppData store, so the numbers agree
 * with each other: the shift Sam sees on Home is the same row Jed sees on the
 * admin Schedule, and a punch on the Time tab shows up in Jed's activity feed.
 *
 * "Today" is pinned to Thu, Aug 7, 2025 to match the design reference, so the
 * demo reads the same no matter when it is opened. Replace this file with API
 * responses; the shapes below are what the store expects.
 * ============================================================================
 */

import type { Role } from '@/contexts/auth-context';

/** The frozen demo day and the Monday that starts its week. */
export const MOCK_TODAY = '2025-08-07';
export const MOCK_WEEK_START = '2025-08-04';

/** Pay period the Pay and Payroll screens open on. */
export const MOCK_PAY_PERIOD = { start: '2025-08-01', end: '2025-08-15' };

/** The two pools J&M staffs. */
export type Location = 'LA Fitness Bowie' | 'SPRFC Severna Park';
export const LOCATIONS: Location[] = ['LA Fitness Bowie', 'SPRFC Severna Park'];

export type StaffMember = {
  id: string;
  name: string;
  /** 'Sarah M.' — how names appear in dense lists. */
  short: string;
  role: Role;
  hourlyRate: number;
  phone: string;
  email: string;
};

export type Shift = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  start: string; // 'HH:MM'
  end: string;
  location: Location;
  slots: number;
  assigned: string[]; // staff ids
};

export type Punch = {
  id: string;
  staffId: string;
  kind: 'in' | 'out';
  at: string; // ISO timestamp
  location: Location;
};

export type RequestKind = 'punch-correction' | 'swap' | 'time-off' | 'availability';
export type RequestStatus = 'pending' | 'approved' | 'denied';

export type ApprovalRequest = {
  id: string;
  staffId: string;
  kind: RequestKind;
  summary: string;
  detail: string;
  at: string; // ISO
  status: RequestStatus;
};

export type ActivityKind =
  | 'availability'
  | 'correction'
  | 'message'
  | 'punch'
  | 'swap'
  | 'shift'
  | 'staff'
  | 'response';

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  who: string; // display name
  text: string;
  at: string; // ISO
};

export type Message = { from: string; text: string; at: string };

export type Conversation = {
  id: string;
  name: string; // group name; ignored for DMs (the other party's name is shown)
  group: boolean;
  participants: string[]; // staff ids; groups list everyone
  unread: number;
  messages: Message[];
};

export type PayrollLine = {
  staffId: string;
  hours: number;
  overtimeHours: number;
};

/** How a worker answered "are you available for this shift?" */
export type ShiftAnswer = 'yes' | 'no';

/** shiftId → staffId → answer. No entry means the person hasn't answered yet. */
export type ShiftResponses = Record<string, Record<string, ShiftAnswer>>;

export type AppNotification = {
  id: string;
  kind: 'shift-posted';
  /** Workers hear about new shifts; nothing is aimed at owner/admin yet. */
  audience: 'workers' | 'admin';
  shiftId: string;
  at: string; // ISO
  /** Staff ids who have seen it. */
  readBy: string[];
};

// --- helpers for building timestamps on the demo day --------------------------

const at = (hhmm: string, dayOffset = 0): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2025, 7, 7 + dayOffset, h, m);
  return d.toISOString();
};

// --- people -----------------------------------------------------------------------
// Three tiers: Jed owns the business, Mike runs the schedule, everyone else teaches.
// Sam is the worker persona the demo signs in as.

export const STAFF: StaffMember[] = [
  { id: 'jed', name: 'Jed Morick', short: 'Jed', role: 'owner', hourlyRate: 0, phone: '(301) 555-0100', email: 'jed@jmaquatics.com' },
  { id: 'mike', name: 'Mike Alvarez', short: 'Mike A.', role: 'admin', hourlyRate: 0, phone: '(301) 555-0111', email: 'mike@jmaquatics.com' },
  { id: 'sam', name: 'Sam Ortiz', short: 'Sam O.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0123', email: 'sam@jmaquatics.com' },
  { id: 'sarah', name: 'Sarah Mitchell', short: 'Sarah M.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0112', email: 'sarah@jmaquatics.com' },
  { id: 'chris', name: 'Chris Tran', short: 'Chris T.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0113', email: 'chris@jmaquatics.com' },
  { id: 'alex', name: 'Alex Rivera', short: 'Alex R.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0114', email: 'alex@jmaquatics.com' },
  { id: 'tony', name: 'Tony Russo', short: 'Tony R.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0115', email: 'tony@jmaquatics.com' },
  { id: 'dana', name: 'Dana Kim', short: 'Dana K.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0116', email: 'dana@jmaquatics.com' },
  { id: 'priya', name: 'Priya Shah', short: 'Priya S.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0117', email: 'priya@jmaquatics.com' },
  { id: 'luis', name: 'Luis Moreno', short: 'Luis M.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0118', email: 'luis@jmaquatics.com' },
  { id: 'emma', name: 'Emma Walsh', short: 'Emma W.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0119', email: 'emma@jmaquatics.com' },
  { id: 'noah', name: 'Noah Brooks', short: 'Noah B.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0120', email: 'noah@jmaquatics.com' },
  { id: 'grace', name: 'Grace Lee', short: 'Grace L.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0121', email: 'grace@jmaquatics.com' },
  { id: 'omar', name: 'Omar Haddad', short: 'Omar H.', role: 'worker', hourlyRate: 24.5, phone: '(301) 555-0122', email: 'omar@jmaquatics.com' },
];

/** Who the demo signs in as for each tier. */
export const DEMO_USER_FOR_ROLE: Record<Role, string> = { owner: 'jed', admin: 'mike', worker: 'sam' };

// --- schedule ---------------------------------------------------------------------
// s9–s11 are open shifts Sam is not on (and that don't clash with his), so the
// worker side has something to say ✓ / ✗ to from the first screen.

export const SHIFTS: Shift[] = [
  { id: 's1', date: '2025-08-04', start: '08:00', end: '16:00', location: 'LA Fitness Bowie', slots: 5, assigned: ['sarah', 'chris', 'alex', 'dana', 'priya'] },
  { id: 's2', date: '2025-08-05', start: '11:30', end: '15:30', location: 'SPRFC Severna Park', slots: 5, assigned: ['luis', 'emma', 'noah', 'grace'] },
  { id: 's3', date: '2025-08-06', start: '09:00', end: '17:00', location: 'SPRFC Severna Park', slots: 5, assigned: ['sarah', 'chris', 'omar', 'dana', 'tony'] },
  { id: 's4', date: '2025-08-07', start: '09:00', end: '12:00', location: 'LA Fitness Bowie', slots: 5, assigned: ['sam', 'sarah', 'alex'] },
  { id: 's5', date: '2025-08-08', start: '08:00', end: '16:00', location: 'LA Fitness Bowie', slots: 4, assigned: ['chris', 'priya', 'luis', 'emma'] },
  { id: 's9', date: '2025-08-08', start: '16:00', end: '20:00', location: 'SPRFC Severna Park', slots: 2, assigned: [] },
  { id: 's6', date: '2025-08-09', start: '08:00', end: '16:00', location: 'LA Fitness Bowie', slots: 4, assigned: ['sam', 'noah', 'grace'] },
  { id: 's7', date: '2025-08-10', start: '08:00', end: '12:00', location: 'SPRFC Severna Park', slots: 3, assigned: ['sam', 'omar', 'tony'] },
  { id: 's10', date: '2025-08-10', start: '13:00', end: '17:00', location: 'SPRFC Severna Park', slots: 3, assigned: ['dana'] },
  { id: 's11', date: '2025-08-11', start: '09:00', end: '13:00', location: 'LA Fitness Bowie', slots: 4, assigned: ['chris', 'priya'] },
  { id: 's8', date: '2025-08-12', start: '09:00', end: '17:00', location: 'SPRFC Severna Park', slots: 5, assigned: ['sam', 'sarah', 'dana'] },
];

// --- who has said ✓ / ✗ to the open shifts -------------------------------------------
// Sam hasn't answered any yet, so his Home has pending items to act on.

export const SHIFT_RESPONSES: ShiftResponses = {
  s4: { dana: 'yes', priya: 'yes', luis: 'no' },
  s6: { chris: 'yes', emma: 'no', omar: 'yes' },
  s9: { sarah: 'yes', tony: 'no' },
  s10: { grace: 'yes' },
  s11: { noah: 'yes', alex: 'no' },
};

// --- notifications (in-app; push is a later phase) -----------------------------------------
// The three newest open shifts were posted yesterday and Sam hasn't seen them.

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', kind: 'shift-posted', audience: 'workers', shiftId: 's11', at: at('17:20', -1), readBy: [] },
  { id: 'n2', kind: 'shift-posted', audience: 'workers', shiftId: 's10', at: at('17:18', -1), readBy: [] },
  { id: 'n3', kind: 'shift-posted', audience: 'workers', shiftId: 's9', at: at('17:15', -1), readBy: [] },
];

// --- time clock -------------------------------------------------------------------

export const PUNCHES: Punch[] = [
  { id: 'p1', staffId: 'sarah', kind: 'in', at: at('08:01'), location: 'LA Fitness Bowie' },
  { id: 'p2', staffId: 'sam', kind: 'in', at: at('08:02'), location: 'LA Fitness Bowie' },
  { id: 'p3', staffId: 'chris', kind: 'in', at: at('08:07'), location: 'LA Fitness Bowie' },
  { id: 'p4', staffId: 'alex', kind: 'in', at: at('08:12'), location: 'LA Fitness Bowie' },
  { id: 'p5', staffId: 'sam', kind: 'out', at: at('12:01'), location: 'LA Fitness Bowie' },
];

// --- approvals ----------------------------------------------------------------------

export const REQUESTS: ApprovalRequest[] = [
  { id: 'r1', staffId: 'tony', kind: 'punch-correction', summary: 'Punch correction request', detail: 'Forgot to clock out Tue Aug 5 — left at 3:30 PM.', at: at('13:47'), status: 'pending' },
  { id: 'r2', staffId: 'sarah', kind: 'swap', summary: 'Shift swap request', detail: 'Swap Fri Aug 8 (8–4, LA Fitness Bowie) with Chris.', at: at('11:30'), status: 'pending' },
  { id: 'r3', staffId: 'noah', kind: 'time-off', summary: 'Time off request', detail: 'Aug 14–15, family trip.', at: at('10:05'), status: 'pending' },
  { id: 'r4', staffId: 'emma', kind: 'swap', summary: 'Shift swap request', detail: 'Give away Tue Aug 12 (SPRFC Severna Park).', at: at('16:20', -1), status: 'pending' },
  { id: 'r5', staffId: 'luis', kind: 'punch-correction', summary: 'Punch correction request', detail: 'Clocked in at 8:06 AM Mon but app shows 8:26 AM.', at: at('09:40', -1), status: 'pending' },
  { id: 'r6', staffId: 'grace', kind: 'time-off', summary: 'Time off request', detail: 'Aug 22, dentist.', at: at('14:10', -2), status: 'approved' },
  { id: 'r7', staffId: 'omar', kind: 'swap', summary: 'Shift swap request', detail: 'Swap Sun Aug 10 with Dana.', at: at('12:30', -3), status: 'denied' },
];

// --- activity feed (owner / admin Home) -----------------------------------------------

export const ACTIVITY: ActivityItem[] = [
  { id: 'a0', kind: 'response', who: 'Dana', text: '✓ Available for Thu, Aug 7 · 9:00 AM – 12:00 PM · LA Fitness Bowie', at: at('14:30') },
  { id: 'a1', kind: 'availability', who: 'Sam', text: 'Availability submitted', at: at('14:14') },
  { id: 'a2', kind: 'correction', who: 'Tony', text: 'Punch correction request', at: at('13:47') },
  { id: 'a3', kind: 'message', who: 'All Staff', text: 'New message in All Staff', at: at('09:15') },
  { id: 'a4', kind: 'punch', who: 'Alex', text: 'Clocked in at LA Fitness Bowie', at: at('08:12') },
  { id: 'a5', kind: 'punch', who: 'Chris', text: 'Clocked in at LA Fitness Bowie', at: at('08:07') },
  { id: 'a6', kind: 'punch', who: 'Sarah', text: 'Clocked in at LA Fitness Bowie', at: at('08:01') },
];

// --- messages (shell only — real messaging is a later phase) ----------------------------

const everyone = STAFF.map((s) => s.id);

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c-all', name: 'All Staff', group: true, participants: everyone, unread: 3,
    messages: [
      { from: 'jed', text: 'Schedule for next week is posted.', at: at('09:02') },
      { from: 'jed', text: 'Who can cover Saturday 8-4?', at: at('09:15') },
    ],
  },
  {
    id: 'c-jed-sam', name: '', group: false, participants: ['jed', 'sam'], unread: 2,
    // Jed's question is the latest message, so Sam's unread badge makes sense.
    messages: [
      { from: 'sam', text: 'Available Sat ✓', at: at('14:13') },
      { from: 'jed', text: "You're on for Thursday, right?", at: at('14:14') },
    ],
  },
  {
    id: 'c-jed-mike', name: '', group: false, participants: ['jed', 'mike'], unread: 1,
    messages: [{ from: 'mike', text: "Approved Tony's correction — flagging his Tue hours for you.", at: at('13:55') }],
  },
  {
    id: 'c-jed-tony', name: '', group: false, participants: ['jed', 'tony'], unread: 0,
    messages: [{ from: 'tony', text: 'Punch correction request sent — forgot to clock out Tue.', at: at('13:47') }],
  },
  {
    id: 'c-jed-sarah', name: '', group: false, participants: ['jed', 'sarah'], unread: 0,
    messages: [{ from: 'sarah', text: 'Can I swap Fri shift?', at: at('11:30') }],
  },
  {
    id: 'c-jed-alex', name: '', group: false, participants: ['jed', 'alex'], unread: 0,
    messages: [{ from: 'alex', text: 'Thanks!', at: at('17:40', -1) }],
  },
  {
    id: 'c-sam-sarah', name: '', group: false, participants: ['sam', 'sarah'], unread: 0,
    messages: [{ from: 'sarah', text: 'Can you cover Sun if my swap goes through?', at: at('11:45') }],
  },
];

// --- payroll (period Aug 1–15) ------------------------------------------------------------
// Sam's 24.4h is the number the My Pay and My Hours screens already agree on.
// Owner and admin are salaried in the mock and have no line here.

export const PAYROLL: PayrollLine[] = [
  { staffId: 'sam', hours: 24.4, overtimeHours: 0 },
  { staffId: 'sarah', hours: 31.5, overtimeHours: 0 },
  { staffId: 'chris', hours: 30, overtimeHours: 0 },
  { staffId: 'alex', hours: 22, overtimeHours: 0 },
  { staffId: 'tony', hours: 18.5, overtimeHours: 0 },
  { staffId: 'dana', hours: 27, overtimeHours: 0 },
  { staffId: 'priya', hours: 16, overtimeHours: 0 },
  { staffId: 'luis', hours: 20, overtimeHours: 0 },
  { staffId: 'emma', hours: 19.5, overtimeHours: 0 },
  { staffId: 'noah', hours: 14, overtimeHours: 0 },
  { staffId: 'grace', hours: 12.5, overtimeHours: 0 },
  { staffId: 'omar', hours: 21, overtimeHours: 0 },
];
