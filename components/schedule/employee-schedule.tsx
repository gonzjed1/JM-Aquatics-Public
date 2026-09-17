import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ChangeAvailability } from '@/components/schedule/change-availability';
import { ShiftRow } from '@/components/schedule/shift-row';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import { byStart, useAppData, useMe } from '@/contexts/app-data';
import { formatDayDate, parseISODate, toISODate } from '@/data/format';

type View_ = 'upcoming' | 'calendar';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A worker's own shifts: as a list, or on a month grid. */
export function EmployeeSchedule() {
  const me = useMe();
  const { today, shiftsFor, awaitingFor } = useAppData();
  const [view, setView] = useState<View_>('upcoming');
  const [selected, setSelected] = useState(today);

  if (!me) return null;

  const mine = shiftsFor(me.id);
  const confirmed = mine.filter((s) => s.date >= today);
  const awaiting = awaitingFor(me.id);
  // Same list Home shows: confirmed shifts and offers awaiting approval, by date.
  const upcoming = [
    ...confirmed.map((shift) => ({ shift, awaiting: false })),
    ...awaiting.map((shift) => ({ shift, awaiting: true })),
  ].sort((a, b) => byStart(a.shift, b.shift));
  const shiftDays = new Set(mine.map((s) => s.date));
  const onSelected = mine.filter((s) => s.date === selected);

  // Month grid for whichever month "today" falls in.
  const base = parseISODate(today);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isoFor = (dayOfMonth: number) => toISODate(new Date(year, month, dayOfMonth));
  const monthLabel = base.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const subtitle =
    `${confirmed.length} upcoming shift${confirmed.length === 1 ? '' : 's'}` +
    (awaiting.length ? ` · ${awaiting.length} awaiting approval` : '');

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="My Schedule" subtitle={subtitle} />}>
      <Segmented
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'calendar', label: 'Calendar' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'upcoming' ? (
        <Card>
          {upcoming.length === 0 ? (
            <ThemedText style={styles.muted}>Nothing scheduled yet.</ThemedText>
          ) : (
            upcoming.map(({ shift, awaiting: pending }, i) => (
              <View key={shift.id} style={i < upcoming.length - 1 && styles.divider}>
                <ShiftRow shift={shift} tag={pending ? 'Awaiting approval' : undefined} last />
                {pending ? null : <ChangeAvailability shift={shift} />}
              </View>
            ))
          )}
        </Card>
      ) : (
        <>
          <Card>
            <ThemedText type="defaultSemiBold" style={styles.monthLabel}>
              {monthLabel}
            </ThemedText>
            <View style={styles.grid}>
              {WEEKDAYS.map((d, i) => (
                <View key={`h${i}`} style={styles.cell}>
                  <ThemedText style={styles.weekday}>{d}</ThemedText>
                </View>
              ))}
              {cells.map((dayOfMonth, i) => {
                if (dayOfMonth === null) return <View key={`b${i}`} style={styles.cell} />;
                const iso = isoFor(dayOfMonth);
                const isSelected = iso === selected;
                const isToday = iso === today;
                return (
                  <Pressable
                    key={iso}
                    onPress={() => setSelected(iso)}
                    accessibilityRole="button"
                    accessibilityLabel={formatDayDate(iso)}
                    style={styles.cell}>
                    <View style={[styles.dayBubble, isSelected && styles.dayBubbleSelected, isToday && !isSelected && styles.dayBubbleToday]}>
                      <ThemedText style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                        {dayOfMonth}
                      </ThemedText>
                    </View>
                    <View style={[styles.dot, shiftDays.has(iso) && styles.dotOn]} />
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <ThemedText type="defaultSemiBold">{formatDayDate(selected)}</ThemedText>
            {onSelected.length === 0 ? (
              <ThemedText style={styles.muted}>No shift this day.</ThemedText>
            ) : (
              onSelected.map((shift, i) => (
                <ShiftRow key={shift.id} shift={shift} last={i === onSelected.length - 1} />
              ))
            )}
          </Card>
        </>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  muted: {
    opacity: 0.65,
  },
  monthLabel: {
    textAlign: 'center',
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: {
    fontSize: 12,
    opacity: 0.55,
  },
  dayBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleSelected: {
    backgroundColor: '#2F6FB2',
  },
  dayBubbleToday: {
    borderWidth: 1,
    borderColor: '#2F6FB2',
  },
  dayText: {
    fontSize: 14,
    lineHeight: 18,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  dotOn: {
    backgroundColor: '#27AE60',
  },
});
