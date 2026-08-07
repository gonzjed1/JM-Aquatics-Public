import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  // --- state: is the worker clocked in, and since when? ---
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // --- fake data for today's punches (backend replaces this later) ---
  const [punches, setPunches] = useState<string[]>([
    'Clocked out — 12:01 PM',
    'Clocked in — 8:02 AM',
  ]);

  const handlePunch = () => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (clockedIn) {
      setPunches([`Clocked out — ${timeLabel}`, ...punches]);
      setClockedIn(false);
      setClockInTime(null);
    } else {
      setPunches([`Clocked in — ${timeLabel}`, ...punches]);
      setClockedIn(true);
      setClockInTime(now);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1D3D47', dark: '#1D3D47' }}
      headerImage={
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerText}>
            J&M Scheduling
          </ThemedText>
        </ThemedView>
      }>
      {/* status line */}
      <ThemedView style={styles.statusContainer}>
        <ThemedText type="subtitle">
          {clockedIn && clockInTime
            ? `Clocked in since ${clockInTime.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}`
            : 'Not clocked in'}
        </ThemedText>
      </ThemedView>

      {/* the big punch button */}
      <View style={styles.buttonWrapper}>
        <Pressable
          onPress={handlePunch}
          style={({ pressed }) => [
            styles.punchButton,
            { backgroundColor: clockedIn ? '#C0392B' : '#27AE60' },
            pressed && styles.punchButtonPressed,
          ]}>
          <ThemedText type="title" style={styles.punchText}>
            {clockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
          </ThemedText>
        </Pressable>
      </View>

      {/* today's activity */}
      <ThemedView style={styles.logContainer}>
        <ThemedText type="subtitle">Today</ThemedText>
        {punches.map((entry, i) => (
          <ThemedText key={i} style={styles.logEntry}>
            {entry}
          </ThemedText>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'transparent',
  },
  headerText: {
    color: '#FFFFFF',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
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
    elevation: 4,
  },
  punchButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  punchText: {
    color: '#FFFFFF',
  },
  logContainer: {
    gap: 6,
    marginTop: 8,
  },
  logEntry: {
    opacity: 0.8,
  },
});