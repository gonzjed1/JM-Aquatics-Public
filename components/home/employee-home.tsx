import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { greeting } from '@/components/home/greeting';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { OpenShiftItem } from '@/components/schedule/open-shift-item';
import { ShiftRow } from '@/components/schedule/shift-row';
import { HEADER_BG, HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppData, useMe } from '@/contexts/app-data';
import { formatDayDate, formatTimeRange } from '@/data/format';

const OPEN_SHIFT_PREVIEW = 4;

/** A worker's dashboard: today's shift with a punch button, open shifts to answer, then what's coming up. */
export function EmployeeHome() {
  const router = useRouter();
  const me = useMe();
  const {
    today,
    shiftsFor,
    isClockedIn,
    clockIn,
    clockOut,
    openShiftsFor,
    answerFor,
    respondToShift,
    unreadNotificationsFor,
    markNotificationsRead,
  } = useAppData();
  const meId = me?.id ?? '';

  // Captured once on arrival, so the "New" pills stay while the person reads
  // the card even though the badge clears straight away.
  const [newShiftIds] = useState(() => new Set(unreadNotificationsFor(meId).map((n) => n.shiftId)));
  useEffect(() => {
    if (meId) markNotificationsRead(meId);
  }, [meId, markNotificationsRead]);

  if (!me) return null;

  const mine = shiftsFor(me.id);
  const todays = mine.find((s) => s.date === today);
  const upcoming = mine.filter((s) => s.date > today).slice(0, 3);
  const clockedIn = isClockedIn(me.id);
  const open = openShiftsFor(me.id);
  const preview = open.slice(0, OPEN_SHIFT_PREVIEW);
  const newCount = open.filter((s) => newShiftIds.has(s.id)).length;

  // Same store action the Time tab uses, so the two buttons never disagree.
  const punch = () =>
    clockedIn ? clockOut(me.id) : clockIn(me.id, todays?.location ?? 'LA Fitness Bowie');

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title={`${greeting()}!`} subtitle={me.name} />}
      headerRight={
        <HeaderIconButton
          name="gearshape.fill"
          label="Settings"
          onPress={() => router.push('/more/settings')}
        />
      }>
      <Card>
        <ThemedText type="defaultSemiBold">{"Today's Shift"}</ThemedText>
        <ThemedText style={styles.muted}>{formatDayDate(today)}</ThemedText>
        {todays ? (
          <>
            <ThemedText type="subtitle" style={styles.time}>
              {formatTimeRange(todays.start, todays.end)}
            </ThemedText>
            <ThemedText style={styles.muted}>{todays.location}</ThemedText>
          </>
        ) : (
          <ThemedText style={[styles.muted, styles.time]}>No shift scheduled today.</ThemedText>
        )}
        <Button
          label={clockedIn ? 'Clock Out' : 'Clock In'}
          tone={clockedIn ? 'danger' : 'primary'}
          onPress={punch}
          style={styles.punch}
        />
        {clockedIn ? <ThemedText style={styles.onClock}>{"You're on the clock."}</ThemedText> : null}
      </Card>

      <Card style={styles.openCard}>
        <ThemedText type="defaultSemiBold">Open shifts</ThemedText>
        <ThemedText style={styles.muted}>{"Hit ✓ or ✗ if you're available for these shifts."}</ThemedText>
        {newCount > 0 ? (
          <ThemedText style={styles.newLine}>
            {newCount === 1 ? '1 new shift posted since you last looked.' : `${newCount} new shifts posted since you last looked.`}
          </ThemedText>
        ) : null}
        {open.length === 0 ? (
          <ThemedText style={[styles.muted, styles.time]}>
            {"No open shifts right now — you'll be notified when Jed posts one."}
          </ThemedText>
        ) : (
          preview.map((shift, i) => (
            <OpenShiftItem
              key={shift.id}
              shift={shift}
              answer={answerFor(shift.id, me.id)}
              isNew={newShiftIds.has(shift.id)}
              onAnswer={(answer) => respondToShift(shift.id, me.id, answer)}
              last={i === preview.length - 1}
            />
          ))
        )}
        {open.length > preview.length ? (
          <Button
            label={`See all ${open.length}`}
            variant="soft"
            onPress={() => router.push('/more/availability')}
            style={styles.seeAll}
          />
        ) : null}
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Upcoming Shifts</ThemedText>
        {upcoming.length === 0 ? (
          <ThemedText style={styles.muted}>Nothing scheduled yet.</ThemedText>
        ) : (
          upcoming.map((shift, i) => (
            <ShiftRow key={shift.id} shift={shift} last={i === upcoming.length - 1} />
          ))
        )}
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  muted: {
    opacity: 0.65,
  },
  time: {
    marginTop: 6,
  },
  punch: {
    marginTop: 12,
  },
  onClock: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    textAlign: 'center',
    marginTop: 4,
  },
  openCard: {
    gap: 2,
  },
  newLine: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2F6FB2',
    fontWeight: '600',
    marginTop: 2,
  },
  seeAll: {
    marginTop: 10,
  },
});
