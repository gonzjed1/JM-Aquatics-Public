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

/** The worker's time clock: one big button and today's punches. */
export function EmployeeTime() {
  const me = useMe();
  const { today, shiftsFor, punchesFor, isClockedIn, clockIn, clockOut } = useAppData();

  if (!me) return null;

  const punches = punchesFor(me.id);
  const clockedIn = isClockedIn(me.id);
  const since = clockedIn ? punches[punches.length - 1] : undefined;
  const todays = shiftsFor(me.id).find((s) => s.date === today);

  const handlePunch = () =>
    clockedIn ? clockOut(me.id) : clockIn(me.id, todays?.location ?? 'LA Fitness Bowie');

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
          onPress={handlePunch}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.punchButton,
            { backgroundColor: clockedIn ? '#C0392B' : '#27AE60' },
            pressed && styles.punchButtonPressed,
          ]}>
          <IconSymbol name="clock.fill" size={40} color="#FFFFFF" />
          <ThemedText type="title" style={styles.punchText}>
            {clockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
          </ThemedText>
        </Pressable>
      </View>

      <Card>
        <ThemedText type="subtitle">Today</ThemedText>
        {punches.length === 0 ? (
          <ThemedText style={styles.muted}>No punches yet today.</ThemedText>
        ) : (
          [...punches].reverse().map((punch, i, all) => (
            <PunchRow key={punch.id} punch={punch} last={i === all.length - 1} />
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
  punchButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  punchText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 30,
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
