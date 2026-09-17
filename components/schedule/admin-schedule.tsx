import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { AssignedPeople } from '@/components/schedule/assigned-people';
import { ShiftForm } from '@/components/schedule/shift-form';
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
import { useAppData, type ShiftEdit } from '@/contexts/app-data';
import { addDays, formatDateRange, formatDayDate, formatDayDateYear } from '@/data/format';
import { LOCATIONS, type Shift } from '@/data/mock-seed';

type View_ = 'week' | 'day' | 'staff';

/**
 * Jed's schedule: the week at a glance, one day in detail, or one person's load.
 * Upcoming rows expand to show who has said ✓ / ✗ and who is still pending,
 * with an Assign button on the ✓ names while the shift has room.
 */
export function AdminSchedule() {
  const { today, weekStart: initialWeekStart, shifts, staff, addShift, updateShift, responsesFor } = useAppData();
  const [view, setView] = useState<View_>('week');
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [day, setDay] = useState(today);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
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
        <ShiftForm
          title="New shift"
          initial={{ date: today, start: '09:00', end: '13:00', location: LOCATIONS[0], slots: 3 }}
          submitLabel="Add Shift"
          hint={"Every instructor is notified the moment it's posted."}
          onSubmit={(shift) => {
            addShift(shift);
            setAdding(false);
            setView('week');
            setWeekStart(mondayOf(shift.date));
            setNotice('Posted — instructors have been notified.');
          }}
          onCancel={() => setAdding(false)}
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
                        <ShiftPanel
                          shift={shift}
                          upcoming={upcoming}
                          editing={editing === shift.id}
                          onEdit={() => setEditing(editing === shift.id ? null : shift.id)}
                          onSave={(edit) => {
                            updateShift(shift.id, edit);
                            setEditing(null);
                            setNotice('Shift updated.');
                          }}
                        />
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
                      <ShiftPanel
                        shift={shift}
                        upcoming={upcoming}
                        showRoster
                        editing={editing === shift.id}
                        onEdit={() => setEditing(editing === shift.id ? null : shift.id)}
                        onSave={(edit) => {
                          updateShift(shift.id, edit);
                          setEditing(null);
                          setNotice('Shift updated.');
                        }}
                      />
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

// --- one shift, expanded --------------------------------------------------------------

/** Who's on a shift and who has answered it, with Jed's Edit shift form behind a button. */
function ShiftPanel({
  shift,
  upcoming,
  showRoster = false,
  editing,
  onEdit,
  onSave,
}: {
  shift: Shift;
  upcoming: boolean;
  showRoster?: boolean;
  editing: boolean;
  onEdit: () => void;
  onSave: (edit: ShiftEdit) => void;
}) {
  return (
    <>
      {showRoster ? (
        <>
          <ThemedText style={styles.rosterTitle}>On it</ThemedText>
          <AssignedPeople shift={shift} />
        </>
      ) : null}
      {upcoming ? <ShiftResponses shift={shift} canAssign /> : null}
      {upcoming ? (
        <Button
          label={editing ? 'Cancel edit' : 'Edit shift'}
          tone="navy"
          variant="soft"
          size="sm"
          onPress={onEdit}
          style={styles.editButton}
        />
      ) : null}
      {editing ? (
        <ShiftForm
          title="Edit shift"
          initial={{ date: shift.date, start: shift.start, end: shift.end, location: shift.location, slots: shift.slots }}
          submitLabel="Save changes"
          minSlots={Math.max(1, shift.assigned.length)}
          hint="The new time and location show everywhere this shift appears."
          onSubmit={onSave}
        />
      ) : null}
    </>
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
  editButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
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
});
