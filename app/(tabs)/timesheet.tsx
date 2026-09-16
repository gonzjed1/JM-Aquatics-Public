import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// --- fake data: this week's shifts (backend replaces later) ---
const WEEK = [
  { day: 'Mon', date: 'Aug 3', in: '8:02 AM', out: '4:31 PM', hours: 8.0 },
  { day: 'Tue', date: 'Aug 4', in: '7:58 AM', out: '4:29 PM', hours: 8.0 },
  { day: 'Wed', date: 'Aug 5', in: '8:05 AM', out: '4:35 PM', hours: 8.0 },
  { day: 'Thu', date: 'Aug 6', in: '8:00 AM', out: '12:04 PM', hours: 4.0 },
  { day: 'Fri', date: 'Aug 7', in: '8:02 AM', out: '—', hours: 3.5 },
];

const HOURLY_RATE = 18; // fake rate for the demo

export default function TimesheetScreen() {
  const totalHours = WEEK.reduce((sum, d) => sum + d.hours, 0);
  const estimatedPay = totalHours * HOURLY_RATE;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1D3D47', dark: '#1D3D47' }}
      headerImage={
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerText}>
            Timesheet
          </ThemedText>
        </ThemedView>
      }>
      {/* week summary */}
      <ThemedView style={styles.summaryRow}>
        <ThemedView style={styles.summaryBox}>
          <ThemedText type="title">{totalHours.toFixed(1)}</ThemedText>
          <ThemedText style={styles.summaryLabel}>hours this week</ThemedText>
        </ThemedView>
        <ThemedView style={styles.summaryBox}>
          <ThemedText type="title">${estimatedPay.toFixed(0)}</ThemedText>
          <ThemedText style={styles.summaryLabel}>estimated pay</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* daily rows */}
      <ThemedView style={styles.list}>
        {WEEK.map((d) => (
          <View key={d.day} style={styles.row}>
            <View style={styles.dayCol}>
              <ThemedText type="defaultSemiBold">{d.day}</ThemedText>
              <ThemedText style={styles.dateText}>{d.date}</ThemedText>
            </View>
            <ThemedText style={styles.timeText}>
              {d.in} – {d.out}
            </ThemedText>
            <ThemedText type="defaultSemiBold">{d.hours.toFixed(1)}h</ThemedText>
          </View>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
  },
  summaryLabel: {
    opacity: 0.7,
    marginTop: 2,
  },
  list: {
    marginTop: 8,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  dayCol: {
    width: 70,
  },
  dateText: {
    opacity: 0.6,
    fontSize: 13,
  },
  timeText: {
    opacity: 0.85,
  },
});