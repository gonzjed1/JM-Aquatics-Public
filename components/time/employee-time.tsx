import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusDot } from '@/components/ui/status-dot';
import { useAppData, useMe } from '@/contexts/app-data';
import { formatWallClock } from '@/data/format';
import type { Punch } from '@/data/mock-seed';
import { useArmedAction } from '@/hooks/use-armed-action';

/** The worker's time clock: one big button (two taps to punch) and today's punches. */
export function EmployeeTime() {
  const me = useMe();
  const { today, shiftsFor, punchesFor, isClockedIn, clockIn, clockOut } = useAppData();
  const meId = me?.id ?? '';

  const punches = meId ? punchesFor(meId) : [];
  const clockedIn = meId ? isClockedIn(meId) : false;
  const since = clockedIn ? punches[punches.length - 1] : undefined;
  const todays = meId ? shiftsFor(meId).find((s) => s.date === today) : undefined;

  const punch = useCallback(() => {
    if (!meId) return;
    if (clockedIn) clockOut(meId);
    else clockIn(meId, todays?.location ?? 'LA Fitness Bowie');
  }, [meId, clockedIn, clockIn, clockOut, todays?.location]);
  // First tap arms, second confirms; it disarms itself after a few seconds.
  const { armed, tap } = useArmedAction(punch);

  if (!me) return null;

  const tone = clockedIn ? '#C0392B' : '#27AE60';
  const label = armed
    ? clockedIn
      ? 'Tap again\nto clock out'
      : 'Tap again\nto clock in'
    : clockedIn
      ? 'CLOCK OUT'
      : 'CLOCK IN';

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Time Clock" subtitle={me.name} />}>
      <ThemedView style={styles.status}>
        <ThemedText type="subtitle">
          {since ? `Clocked in since ${formatWallClock(new Date(since.at))}` : 'Not clocked in'}
        </ThemedText>
        {todays ? <ThemedText style={styles.muted}>{todays.location}</ThemedText> : null}
      </ThemedView>

      <View style={styles.buttonWrapper}>
        <Pressable
          onPress={tap}
          accessibilityRole="button"
          accessibilityLabel={clockedIn ? 'Clock out' : 'Clock in'}
          accessibilityState={{ expanded: armed }}
          style={({ pressed }) => [
            styles.punchButton,
            armed ? [styles.punchArmed, { borderColor: tone }] : { backgroundColor: tone },
            pressed && styles.punchButtonPressed,
          ]}>
          <IconSymbol name="clock.fill" size={40} color={armed ? tone : '#FFFFFF'} />
          <ThemedText type="title" style={[styles.punchText, armed && [styles.punchTextArmed, { color: tone }]]}>
            {label}
          </ThemedText>
        </Pressable>
        {armed ? <ThemedText style={styles.hint}>Cancels by itself in a few seconds.</ThemedText> : null}
      </View>

      <Card>
        <ThemedText type="subtitle">Today</ThemedText>
        {punches.length === 0 ? (
          <ThemedText style={styles.muted}>No punches yet today.</ThemedText>
        ) : (
          [...punches].reverse().map((p, i, all) => (
            <PunchRow key={p.id} punch={p} last={i === all.length - 1} />
          ))
        )}
      </Card>
    </ParallaxScrollView>
  );
}

function PunchRow({ punch, last }: { punch: Punch; last: boolean }) {
  return (
    <View style={[styles.punchRow, !last && styles.divider]}>
      <StatusDot tone={punch.kind === 'in' ? 'good' : 'bad'} />
      <ThemedText style={styles.punchLabel}>{punch.kind === 'in' ? 'Clock In' : 'Clock Out'}</ThemedText>
      <ThemedText type="defaultSemiBold">{formatWallClock(new Date(punch.at))}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  muted: {
    opacity: 0.65,
  },
  buttonWrapper: {
    alignItems: 'center',
    marginVertical: 24,
    gap: 10,
  },
  punchButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 4,
  },
  punchArmed: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
  },
  punchButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  punchText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 30,
    textAlign: 'center',
  },
  punchTextArmed: {
    fontSize: 20,
    lineHeight: 24,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  punchLabel: {
    flex: 1,
  },
});
