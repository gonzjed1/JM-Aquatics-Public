import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { AssignedPeople } from '@/components/schedule/assigned-people';
import { ShiftResponses, responseSummary } from '@/components/schedule/shift-responses';
import { ShiftRow } from '@/components/schedule/shift-row';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { useAppData, type NewShift } from '@/contexts/app-data';
import {
  addDays,
  formatClock,
  formatDateRange,
  formatDayDate,
  formatDayDateYear,
} from '@/data/format';
import { LOCATIONS, type Location } from '@/data/mock-seed';

type View_ = 'week' | 'day' | 'staff';

/**
 * Jed's schedule: the week at a glance, one day in detail, or one person's load.
 * Upcoming rows expand to show who has said ✓ / ✗ and who is still pending,
 * with an Assign button on the ✓ names while the shift has room.
 */
export function AdminSchedule() {
  const { today, weekStart: initialWeekStart, shifts, staff, addShift, responsesFor } = useAppData();
  const [view, setView] = useState<View_>('week');
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [day, setDay] = useState(today);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const byStart = (a: { date: string; start: string }, b: { date: string; start: string }) =>
    `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`);
  const weekShifts = shifts.filter((s) => s.date >= weekStart && s.date <= weekEnd).sort(byStart);
  const dayShifts = shifts.filter((s) => s.date === day).sort(byStart);
  const workers = staff.filter((s) => s.role === 'worker');
  const isUpcoming = (date: string) => date >= today;

  const switchView = (next: View_) => {
    setView(next);
    setNotice(null);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Schedule" subtitle={`${shifts.length} shifts on the books`} />}
      headerRight={
        <Button
          label={adding ? 'Cancel' : '+ Add Shift'}
          tone={adding ? 'navy' : 'success'}
          size="sm"
          onPress={() => {
            setAdding((v) => !v);
            setNotice(null);
          }}
        />
      }>
      {adding ? (
        <AddShiftCard
          initialDate={today}
          onAdd={(shift) => {
            addShift(shift);
            setAdding(false);
            setView('week');
            setWeekStart(mondayOf(shift.date));
            setNotice('Posted — instructors have been notified.');
          }}
        />
      ) : null}

      {notice ? <ThemedText style={styles.notice}>{notice}</ThemedText> : null}

      <Segmented
        options={[
          { value: 'week', label: 'Week' },
          { value: 'day', label: 'Day' },
          { value: 'staff', label: 'Staff' },
        ]}
        value={view}
        onChange={switchView}
      />

      {view === 'week' ? (
        <>
          <Nav
            label={formatDateRange(weekStart, weekEnd)}
            onPrev={() => setWeekStart(addDays(weekStart, -7))}
            onNext={() => setWeekStart(addDays(weekStart, 7))}
          />
          <Card style={styles.list}>
            {weekShifts.length === 0 ? (
              <ThemedText style={styles.muted}>No shifts this week.</ThemedText>
            ) : (
              weekShifts.map((shift, i) => {
                const upcoming = isUpcoming(shift.date);
                const isLast = i === weekShifts.length - 1;
                const open = expanded === shift.id;
                return (
                  <View key={shift.id}>
                    <ShiftRow
                      shift={shift}
                      showFill
                      detail={upcoming ? responseSummary(responsesFor(shift.id)) : undefined}
                      last={isLast || open}
                      onPress={upcoming ? () => setExpanded(open ? null : shift.id) : undefined}
                      expanded={open}
                    />
                    {open ? (
                      <View style={[styles.panelWrap, !isLast && styles.divider]}>
                        <ShiftResponses shift={shift} canAssign />
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </Card>
        </>
      ) : null}

      {view === 'day' ? (
        <>
          <Nav
            label={formatDayDateYear(day)}
            onPrev={() => setDay(addDays(day, -1))}
            onNext={() => setDay(addDays(day, 1))}
          />
          <Card style={styles.list}>
            {dayShifts.length === 0 ? (
              <ThemedText style={styles.muted}>Nothing scheduled this day.</ThemedText>
            ) : (
              dayShifts.map((shift, i) => {
                const isLast = i === dayShifts.length - 1;
                const upcoming = isUpcoming(shift.date);
                return (
                  <View key={shift.id}>
                    <ShiftRow shift={shift} showFill last />
                    <View style={[styles.panelWrap, !isLast && styles.divider]}>
                      <ThemedText style={styles.rosterTitle}>On it</ThemedText>
                      <AssignedPeople shift={shift} />
                      {upcoming ? <ShiftResponses shift={shift} canAssign /> : null}
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </>
      ) : null}

      {view === 'staff' ? (
        <Card>
          {workers.map((person) => {
            const theirs = weekShifts.filter((s) => s.assigned.includes(person.id));
            const next = shifts
              .filter((s) => s.assigned.includes(person.id) && s.date >= today)
              .sort(byStart)[0];
            return (
              <ListRow
                key={person.id}
                icon="person.fill"
                title={person.name}
                subtitle={
                  theirs.length
                    ? `${theirs.length} shift${theirs.length === 1 ? '' : 's'} this week${next ? ` · next ${formatDayDate(next.date)}` : ''}`
                    : 'No shifts this week'
                }
                right={<ContactButtons person={person} size="sm" />}
              />
            );
          })}
        </Card>
      ) : null}
    </ParallaxScrollView>
  );
}

// --- add shift form -------------------------------------------------------------------

function AddShiftCard({ initialDate, onAdd }: { initialDate: string; onAdd: (shift: NewShift) => void }) {
  const [location, setLocation] = useState<Location>(LOCATIONS[0]);
  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [slots, setSlots] = useState(3);
  const valid = end > start;

  return (
    <Card style={styles.form}>
      <ThemedText type="subtitle">New shift</ThemedText>

      <ThemedText style={styles.label}>Location</ThemedText>
      <View style={styles.chips}>
        {LOCATIONS.map((loc) => (
          <Pressable
            key={loc}
            onPress={() => setLocation(loc)}
            accessibilityRole="button"
            accessibilityState={{ selected: loc === location }}
            style={[styles.chip, loc === location && styles.chipSelected]}>
            <ThemedText style={[styles.chipText, loc === location && styles.chipTextSelected]}>
              {loc}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Stepper label="Date" value={formatDayDate(date)} onPrev={() => setDate(addDays(date, -1))} onNext={() => setDate(addDays(date, 1))} />
      <Stepper label="Start" value={formatClock(start)} onPrev={() => setStart(shiftTime(start, -30))} onNext={() => setStart(shiftTime(start, 30))} />
      <Stepper label="End" value={formatClock(end)} onPrev={() => setEnd(shiftTime(end, -30))} onNext={() => setEnd(shiftTime(end, 30))} />
      <Stepper label="Slots" value={String(slots)} onPrev={() => setSlots(Math.max(1, slots - 1))} onNext={() => setSlots(Math.min(10, slots + 1))} />

      {!valid ? <ThemedText style={styles.error}>End time has to be after the start.</ThemedText> : null}
      <Button
        label="Add Shift"
        tone="success"
        disabled={!valid}
        onPress={() => onAdd({ date, start, end, location, slots })}
        style={styles.submit}
      />
      <ThemedText style={styles.hint}>{"Every instructor is notified the moment it's posted."}</ThemedText>
    </Card>
  );
}

function Stepper({ label, value, onPrev, onNext }: { label: string; value: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.stepper}>
      <ThemedText style={styles.stepperLabel}>{label}</ThemedText>
      <Pressable onPress={onPrev} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Previous ${label}`}>
        <IconSymbol name="chevron.left" size={22} color="#687076" />
      </Pressable>
      <ThemedText type="defaultSemiBold" style={styles.stepperValue}>{value}</ThemedText>
      <Pressable onPress={onNext} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Next ${label}`}>
        <IconSymbol name="chevron.right" size={22} color="#687076" />
      </Pressable>
    </View>
  );
}

function Nav({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.nav}>
      <Pressable onPress={onPrev} hitSlop={12} accessibilityRole="button" accessibilityLabel="Previous">
        <IconSymbol name="chevron.left" size={22} color="#687076" />
      </Pressable>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <Pressable onPress={onNext} hitSlop={12} accessibilityRole="button" accessibilityLabel="Next">
        <IconSymbol name="chevron.right" size={22} color="#687076" />
      </Pressable>
    </View>
  );
}

/** '09:00' ± minutes, clamped to the day. */
function shiftTime(hhmm: string, deltaMinutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(23 * 60 + 30, Math.max(0, h * 60 + m + deltaMinutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** The Monday on or before a date, so a new shift lands the week view on itself. */
function mondayOf(iso: string): string {
  const day = new Date(`${iso}T12:00:00`).getDay(); // noon dodges any DST edge
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

const styles = StyleSheet.create({
  muted: {
    opacity: 0.65,
  },
  notice: {
    color: '#27AE60',
    fontSize: 14,
    textAlign: 'center',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  panelWrap: {
    paddingBottom: 8,
  },
  rosterTitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    paddingLeft: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
  },
  chipSelected: {
    backgroundColor: '#1D3D47',
    borderColor: '#1D3D47',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  stepperLabel: {
    width: 56,
    opacity: 0.65,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  submit: {
    marginTop: 6,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
    textAlign: 'center',
  },
});
