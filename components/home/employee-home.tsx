import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { greeting } from '@/components/home/greeting';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { OpenShiftItem } from '@/components/schedule/open-shift-item';
import { ShiftRow } from '@/components/schedule/shift-row';
import { HEADER_BG, HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { byStart, useAppData, useMe } from '@/contexts/app-data';
import { formatDayDate, formatTimeRange, formatWallClock } from '@/data/format';
import type { AppNotification } from '@/data/mock-seed';
import { shiftLabel } from '@/data/shifts';
import { useArmedAction } from '@/hooks/use-armed-action';

const OPEN_SHIFT_PREVIEW = 4;
const UPCOMING_PREVIEW = 5;
const ACTIVITY_PREVIEW = 4;

/**
 * A worker's dashboard: today's shift with a punch button, what's coming up
 * (confirmed shifts and the ones they've offered for, together by date), open
 * shifts to answer, then a short activity trail.
 */
export function EmployeeHome() {
  const router = useRouter();
  const me = useMe();
  const {
    today,
    shifts,
    shiftsFor,
    awaitingFor,
    isClockedIn,
    clockIn,
    clockOut,
    openShiftsFor,
    answerFor,
    respondToShift,
    notificationsFor,
    unreadNotificationsFor,
    markNotificationsRead,
  } = useAppData();
  const meId = me?.id ?? '';

  // Captured once on arrival, so the "New" pills stay while the person reads
  // the card even though the badge clears straight away.
  const [newShiftIds] = useState(
    () => new Set(unreadNotificationsFor(meId).filter((n) => n.kind === 'shift-posted').map((n) => n.shiftId))
  );
  useEffect(() => {
    if (meId) markNotificationsRead(meId);
  }, [meId, markNotificationsRead]);

  const mine = meId ? shiftsFor(meId) : [];
  const todays = mine.find((s) => s.date === today);
  const clockedIn = meId ? isClockedIn(meId) : false;

  // Same store action the Time tab uses, so the two buttons never disagree.
  const punch = useCallback(() => {
    if (!meId) return;
    if (clockedIn) clockOut(meId);
    else clockIn(meId, todays?.location ?? 'LA Fitness Bowie');
  }, [meId, clockedIn, clockIn, clockOut, todays?.location]);
  // A punch is two taps: the first arms the button, the second confirms.
  const { armed: punchArmed, tap: tapPunch } = useArmedAction(punch);

  if (!me) return null;

  // Confirmed shifts and offers awaiting approval share one date-ordered list;
  // the offers carry a tag. Both come straight off the store's shift data.
  const upcoming = [
    ...mine.filter((s) => s.date > today).map((shift) => ({ shift, awaiting: false })),
    ...awaitingFor(me.id).map((shift) => ({ shift, awaiting: true })),
  ]
    .sort((a, b) => byStart(a.shift, b.shift))
    .slice(0, UPCOMING_PREVIEW);
  const awaitingCount = upcoming.filter((u) => u.awaiting).length;

  const open = openShiftsFor(me.id);
  const preview = open.slice(0, OPEN_SHIFT_PREVIEW);
  const newCount = open.filter((s) => newShiftIds.has(s.id)).length;

  const recent = notificationsFor(me.id).slice(0, ACTIVITY_PREVIEW);
  const lineFor = (n: AppNotification) => {
    const shift = shifts.find((s) => s.id === n.shiftId);
    const label = shift ? shiftLabel(shift) : 'a shift';
    return n.kind === 'shift-filled'
      ? `${label} was filled — thanks for offering.`
      : `New shift posted: ${label}`;
  };

  const punchLabel = punchArmed
    ? clockedIn
      ? 'Tap again to clock out'
      : 'Tap again to clock in'
    : clockedIn
      ? 'Clock Out'
      : 'Clock In';

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title={`${greeting()}!`} subtitle={me.name} />}
      headerRight={
        <HeaderIconButton
          name="gearshape.fill"
          label="Settings"
          onPress={() => router.push({ pathname: '/more/settings', params: { from: 'home' } })}
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
          label={punchLabel}
          tone={clockedIn ? 'danger' : 'primary'}
          variant={punchArmed ? 'outline' : 'solid'}
          onPress={tapPunch}
          style={styles.punch}
        />
        {punchArmed ? (
          <ThemedText style={styles.onClock}>Cancels by itself in a few seconds.</ThemedText>
        ) : clockedIn ? (
          <ThemedText style={styles.onClock}>{"You're on the clock."}</ThemedText>
        ) : null}
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Upcoming Shifts</ThemedText>
        {awaitingCount > 0 ? (
          <ThemedText style={styles.muted}>
            {awaitingCount === 1
              ? "1 you've offered for is awaiting approval."
              : `${awaitingCount} you've offered for are awaiting approval.`}
          </ThemedText>
        ) : null}
        {upcoming.length === 0 ? (
          <ThemedText style={styles.muted}>Nothing scheduled yet.</ThemedText>
        ) : (
          upcoming.map(({ shift, awaiting }, i) => (
            <ShiftRow
              key={shift.id}
              shift={shift}
              tag={awaiting ? 'Awaiting approval' : undefined}
              last={i === upcoming.length - 1}
            />
          ))
        )}
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
            onPress={() => router.push({ pathname: '/more/availability', params: { from: 'home' } })}
            style={styles.seeAll}
          />
        ) : null}
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Activity</ThemedText>
        {recent.length === 0 ? (
          <ThemedText style={styles.muted}>Nothing yet.</ThemedText>
        ) : (
          recent.map((n) => (
            <ThemedText key={n.id} style={styles.activityLine}>
              <ThemedText style={styles.activityTime}>{formatWallClock(new Date(n.at))} · </ThemedText>
              {lineFor(n)}
            </ThemedText>
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
  activityLine: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  activityTime: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
  },
});
