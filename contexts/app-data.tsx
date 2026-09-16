import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { toISODate } from '@/data/format';
import {
  ACTIVITY,
  CONVERSATIONS,
  MOCK_TODAY,
  MOCK_WEEK_START,
  NOTIFICATIONS,
  PAYROLL,
  PUNCHES,
  REQUESTS,
  SHIFTS,
  SHIFT_RESPONSES,
  STAFF,
  type ActivityItem,
  type AppNotification,
  type ApprovalRequest,
  type Conversation,
  type Location,
  type PayrollLine,
  type Punch,
  type RequestStatus,
  type Shift,
  type ShiftAnswer,
  type ShiftResponses,
  type StaffMember,
} from '@/data/mock-seed';
import { isOpen, shiftLabel, shiftsOverlap } from '@/data/shifts';

/**
 * The one place screens read company data from and write changes to.
 *
 * Today it wraps the mock seed in React state so buttons do real things — a
 * clock-in on the Time tab shows up on Home and in the activity feed, an
 * approved request drops off the queue and the badge count, a posted shift
 * notifies every worker. Replacing the seed with API calls means changing the
 * bodies of the actions below; the screens keep calling the same functions.
 */

export type NewShift = Omit<Shift, 'id' | 'assigned'> & { assigned?: string[] };
export type NewStaff = { name: string; phone: string };
/** The tiers an owner can move someone between. Nobody is made owner from the app. */
export type AssignableRole = 'worker' | 'admin';

/** Who said what about one shift: ✓ first, ✗ second, everyone else pending. */
export type ResponseGroups = { yes: StaffMember[]; no: StaffMember[]; pending: StaffMember[] };

type AppData = {
  today: string;
  weekStart: string;
  staff: StaffMember[];
  staffById: (id: string) => StaffMember | undefined;
  shifts: Shift[];
  punches: Punch[];
  requests: ApprovalRequest[];
  pendingRequests: ApprovalRequest[];
  activity: ActivityItem[];
  conversations: Conversation[];
  payroll: PayrollLine[];
  /** staffId → weekdays (0 = Sun … 6 = Sat) the person said they can usually work. */
  availability: Record<string, number[]>;
  shiftResponses: ShiftResponses;
  notifications: AppNotification[];

  isClockedIn: (staffId: string) => boolean;
  /** A person's punches on one day, oldest first. Defaults to the demo day. */
  punchesFor: (staffId: string, dateISO?: string) => Punch[];
  /** The open 'in' punch for everyone currently on the clock, earliest first. */
  clockedInNow: () => Punch[];
  shiftsFor: (staffId: string) => Shift[];
  /** Upcoming shifts with room that this person isn't on and that don't clash with their own. */
  openShiftsFor: (staffId: string) => Shift[];
  answerFor: (shiftId: string, staffId: string) => ShiftAnswer | undefined;
  responsesFor: (shiftId: string) => ResponseGroups;
  unreadNotificationsFor: (staffId: string) => AppNotification[];

  clockIn: (staffId: string, location: Location) => void;
  clockOut: (staffId: string) => void;
  /** Posts the shift and notifies every worker. */
  addShift: (shift: NewShift) => void;
  addStaff: (person: NewStaff) => void;
  setStaffRole: (staffId: string, role: AssignableRole) => void;
  setRequestStatus: (id: string, status: RequestStatus) => void;
  submitAvailability: (staffId: string, weekdays: number[]) => void;
  respondToShift: (shiftId: string, staffId: string, answer: ShiftAnswer) => void;
  assignToShift: (shiftId: string, staffId: string) => void;
  markNotificationsRead: (staffId: string) => void;
};

const AppDataContext = createContext<AppData | null>(null);

/**
 * New punches carry the real wall-clock time but land on the frozen demo day,
 * so they sit in the same "today" as the seeded ones instead of vanishing into
 * whatever the calendar says.
 */
function nowOnDemoDay(): string {
  const n = new Date();
  return new Date(2025, 7, 7, n.getHours(), n.getMinutes(), n.getSeconds()).toISOString();
}

/**
 * A punch time on the demo day that is guaranteed to sort after this person's
 * existing punches that day. Without this, using the app before the seed times
 * (Sam is clocked out at 12:01) would file a new clock-in *before* that punch,
 * leaving the last punch an 'out' and the button stuck. Keeps the real time
 * when it's already later, so afternoon demos read naturally.
 */
function nextPunchTime(existing: Punch[], staffId: string): string {
  const now = nowOnDemoDay();
  const latest = existing
    .filter((p) => p.staffId === staffId && toISODate(new Date(p.at)) === MOCK_TODAY)
    .reduce((max, p) => (p.at > max ? p.at : max), '');
  if (latest && latest >= now) {
    return new Date(new Date(latest).getTime() + 60_000).toISOString();
  }
  return now;
}

let nextId = 1000;
const newId = (prefix: string) => `${prefix}${nextId++}`;

const byStart = (a: Shift, b: Shift) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`);
const byName = (a: StaffMember, b: StaffMember) => a.name.localeCompare(b.name);

export function AppDataProvider({ children }: PropsWithChildren) {
  const { userId } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>(STAFF);
  const [shifts, setShifts] = useState<Shift[]>(SHIFTS);
  const [punches, setPunches] = useState<Punch[]>(PUNCHES);
  const [requests, setRequests] = useState<ApprovalRequest[]>(REQUESTS);
  const [activity, setActivity] = useState<ActivityItem[]>(ACTIVITY);
  const [availability, setAvailability] = useState<Record<string, number[]>>({});
  const [shiftResponses, setShiftResponses] = useState<ShiftResponses>(SHIFT_RESPONSES);
  const [notifications, setNotifications] = useState<AppNotification[]>(NOTIFICATIONS);

  const staffById = useCallback((id: string) => staff.find((s) => s.id === id), [staff]);
  const firstName = useCallback((id: string) => staffById(id)?.short.split(' ')[0] ?? id, [staffById]);

  // Owner and admin actions are credited to whoever is signed in.
  const actor = firstName(userId ?? 'jed');

  const logActivity = useCallback((item: Omit<ActivityItem, 'id' | 'at'>) => {
    setActivity((prev) => [{ ...item, id: newId('a'), at: nowOnDemoDay() }, ...prev]);
  }, []);

  // --- time clock ---------------------------------------------------------------

  const punchesFor = useCallback(
    (staffId: string, dateISO: string = MOCK_TODAY) =>
      punches
        .filter((p) => p.staffId === staffId && toISODate(new Date(p.at)) === dateISO)
        .sort((a, b) => a.at.localeCompare(b.at)),
    [punches]
  );

  const isClockedIn = useCallback(
    (staffId: string) => {
      const today = punchesFor(staffId);
      return today.length > 0 && today[today.length - 1].kind === 'in';
    },
    [punchesFor]
  );

  const clockedInNow = useCallback(() => {
    const open: Punch[] = [];
    for (const person of staff) {
      const today = punchesFor(person.id);
      const last = today[today.length - 1];
      if (last?.kind === 'in') open.push(last);
    }
    return open.sort((a, b) => a.at.localeCompare(b.at));
  }, [punchesFor, staff]);

  const clockIn = useCallback(
    (staffId: string, location: Location) => {
      setPunches((prev) => [...prev, { id: newId('p'), staffId, kind: 'in', at: nextPunchTime(prev, staffId), location }]);
      logActivity({ kind: 'punch', who: firstName(staffId), text: `Clocked in at ${location}` });
    },
    [firstName, logActivity]
  );

  const clockOut = useCallback(
    (staffId: string) => {
      const last = punchesFor(staffId).at(-1);
      const location = last?.location ?? 'LA Fitness Bowie';
      setPunches((prev) => [...prev, { id: newId('p'), staffId, kind: 'out', at: nextPunchTime(prev, staffId), location }]);
      logActivity({ kind: 'punch', who: firstName(staffId), text: `Clocked out at ${location}` });
    },
    [firstName, logActivity, punchesFor]
  );

  // --- schedule -----------------------------------------------------------------

  const shiftsFor = useCallback(
    (staffId: string) => shifts.filter((s) => s.assigned.includes(staffId)).sort(byStart),
    [shifts]
  );

  const openShiftsFor = useCallback(
    (staffId: string) => {
      const mine = shifts.filter((s) => s.assigned.includes(staffId));
      return shifts
        .filter(
          (s) =>
            s.date >= MOCK_TODAY &&
            isOpen(s) &&
            !s.assigned.includes(staffId) &&
            !mine.some((own) => shiftsOverlap(own, s))
        )
        .sort(byStart);
    },
    [shifts]
  );

  const answerFor = useCallback(
    (shiftId: string, staffId: string) => shiftResponses[shiftId]?.[staffId],
    [shiftResponses]
  );

  const responsesFor = useCallback(
    (shiftId: string): ResponseGroups => {
      const shift = shifts.find((s) => s.id === shiftId);
      const answers = shiftResponses[shiftId] ?? {};
      const candidates = staff.filter((p) => p.role === 'worker' && !shift?.assigned.includes(p.id));
      return {
        yes: candidates.filter((p) => answers[p.id] === 'yes').sort(byName),
        no: candidates.filter((p) => answers[p.id] === 'no').sort(byName),
        pending: candidates.filter((p) => !answers[p.id]).sort(byName),
      };
    },
    [shifts, shiftResponses, staff]
  );

  const addShift = useCallback(
    (shift: NewShift) => {
      const posted: Shift = { ...shift, id: newId('s'), assigned: shift.assigned ?? [] };
      setShifts((prev) => [...prev, posted].sort(byStart));
      // Every worker hears about it the moment it goes up.
      setNotifications((prev) => [
        { id: newId('n'), kind: 'shift-posted', audience: 'workers', shiftId: posted.id, at: nowOnDemoDay(), readBy: [] },
        ...prev,
      ]);
      logActivity({ kind: 'shift', who: actor, text: `Posted ${shiftLabel(posted)}` });
    },
    [actor, logActivity]
  );

  const respondToShift = useCallback(
    (shiftId: string, staffId: string, answer: ShiftAnswer) => {
      setShiftResponses((prev) => ({ ...prev, [shiftId]: { ...(prev[shiftId] ?? {}), [staffId]: answer } }));
      // Answering a posting counts as having seen it.
      setNotifications((prev) =>
        prev.map((n) =>
          n.shiftId === shiftId && !n.readBy.includes(staffId) ? { ...n, readBy: [...n.readBy, staffId] } : n
        )
      );
      const shift = shifts.find((s) => s.id === shiftId);
      if (shift) {
        logActivity({
          kind: 'response',
          who: firstName(staffId),
          text: `${answer === 'yes' ? '✓ Available' : '✗ Not available'} for ${shiftLabel(shift)}`,
        });
      }
    },
    [firstName, logActivity, shifts]
  );

  const assignToShift = useCallback(
    (shiftId: string, staffId: string) => {
      const shift = shifts.find((s) => s.id === shiftId);
      if (!shift || shift.assigned.includes(staffId) || !isOpen(shift)) return;
      setShifts((prev) => prev.map((s) => (s.id === shiftId ? { ...s, assigned: [...s.assigned, staffId] } : s)));
      logActivity({ kind: 'shift', who: actor, text: `Assigned ${firstName(staffId)} to ${shiftLabel(shift)}` });
    },
    [actor, firstName, logActivity, shifts]
  );

  // --- notifications ------------------------------------------------------------

  const unreadNotificationsFor = useCallback(
    (staffId: string) => {
      const audience = staffById(staffId)?.role === 'worker' ? 'workers' : 'admin';
      return notifications
        .filter((n) => n.audience === audience && !n.readBy.includes(staffId))
        .sort((a, b) => b.at.localeCompare(a.at));
    },
    [notifications, staffById]
  );

  const markNotificationsRead = useCallback((staffId: string) => {
    // Return the same array when nothing changes, so effects keyed on it settle.
    setNotifications((prev) =>
      prev.some((n) => !n.readBy.includes(staffId))
        ? prev.map((n) => (n.readBy.includes(staffId) ? n : { ...n, readBy: [...n.readBy, staffId] }))
        : prev
    );
  }, []);

  // --- people & approvals -------------------------------------------------------

  const addStaff = useCallback(
    (person: NewStaff) => {
      const name = person.name.trim();
      const [first, last = ''] = name.split(/\s+/);
      setStaff((prev) => [
        ...prev,
        {
          id: newId('u'),
          name,
          short: last ? `${first} ${last[0]}.` : first,
          role: 'worker',
          hourlyRate: 24.5,
          phone: person.phone.trim(),
          email: `${first.toLowerCase()}@jmaquatics.com`,
        },
      ]);
      logActivity({ kind: 'staff', who: actor, text: `Added ${name} to the team` });
    },
    [actor, logActivity]
  );

  const setStaffRole = useCallback(
    (staffId: string, nextRole: AssignableRole) => {
      const person = staffById(staffId);
      if (!person || person.role === 'owner' || person.role === nextRole) return;
      setStaff((prev) => prev.map((p) => (p.id === staffId ? { ...p, role: nextRole } : p)));
      logActivity({
        kind: 'staff',
        who: actor,
        text: `Made ${person.name} ${nextRole === 'admin' ? 'an admin' : 'a worker'}`,
      });
    },
    [actor, logActivity, staffById]
  );

  const setRequestStatus = useCallback(
    (id: string, status: RequestStatus) => {
      const target = requests.find((r) => r.id === id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (target) {
        logActivity({
          kind: target.kind === 'punch-correction' ? 'correction' : 'swap',
          who: actor,
          text: `${status === 'approved' ? 'Approved' : 'Denied'} ${firstName(target.staffId)}'s ${target.summary.toLowerCase()}`,
        });
      }
    },
    [actor, firstName, logActivity, requests]
  );

  const submitAvailability = useCallback(
    (staffId: string, weekdays: number[]) => {
      setAvailability((prev) => ({ ...prev, [staffId]: weekdays }));
      logActivity({ kind: 'availability', who: firstName(staffId), text: 'Availability submitted' });
    },
    [firstName, logActivity]
  );

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);

  const value = useMemo<AppData>(
    () => ({
      today: MOCK_TODAY,
      weekStart: MOCK_WEEK_START,
      staff,
      staffById,
      shifts,
      punches,
      requests,
      pendingRequests,
      activity,
      conversations: CONVERSATIONS,
      payroll: PAYROLL,
      availability,
      shiftResponses,
      notifications,
      isClockedIn,
      punchesFor,
      clockedInNow,
      shiftsFor,
      openShiftsFor,
      answerFor,
      responsesFor,
      unreadNotificationsFor,
      clockIn,
      clockOut,
      addShift,
      addStaff,
      setStaffRole,
      setRequestStatus,
      submitAvailability,
      respondToShift,
      assignToShift,
      markNotificationsRead,
    }),
    [
      staff, staffById, shifts, punches, requests, pendingRequests, activity, availability,
      shiftResponses, notifications,
      isClockedIn, punchesFor, clockedInNow, shiftsFor, openShiftsFor, answerFor, responsesFor,
      unreadNotificationsFor,
      clockIn, clockOut, addShift, addStaff, setStaffRole, setRequestStatus, submitAvailability,
      respondToShift, assignToShift, markNotificationsRead,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used inside <AppDataProvider>');
  }
  return context;
}

/** The signed-in person as a staff record. Null only while signed out. */
export function useMe(): StaffMember | null {
  const { userId } = useAuth();
  const { staffById } = useAppData();
  return userId ? (staffById(userId) ?? null) : null;
}
