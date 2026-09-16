import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_HOURLY_RATE } from '@/constants/mock-payroll';

type WorkDay = {
  day: string;
  date: string;
  /** null when the worker was off that day. */
  in: string | null;
  /** null while the shift is still open. */
  out: string | null;
  hours: number;
};

// --- fake data: this week's shifts (backend replaces later) ---
// Mon Aug 4 – Fri Aug 8, 2025 (real weekdays for that year). Totals 21.5h,
// which fits inside the 24.4h the Pay screen reports for Aug 1–15.
const WEEK: WorkDay[] = [
  { day: 'Mon', date: 'Aug 4', in: '8:02 AM', out: '4:31 PM', hours: 8 },
  { day: 'Tue', date: 'Aug 5', in: '7:58 AM', out: '4:29 PM', hours: 8 },
  { day: 'Wed', date: 'Aug 6', in: '8:05 AM', out: '12:08 PM', hours: 4 },
  { day: 'Thu', date: 'Aug 7', in: null, out: null, hours: 0 },
  { day: 'Fri', date: 'Aug 8', in: '8:02 AM', out: null, hours: 1.5 },
];

function shiftLabel(day: WorkDay) {
  if (day.in === null) return 'Off';
  return `${day.in} – ${day.out ?? 'in progress'}`;
}

/** Estimate only — the real pay rules are unconfirmed, so keep the math here. */
function estimatedPayFor(hours: number) {
  return hours * MOCK_HOURLY_RATE;
}

export default function MyHoursScreen() {
  const router = useRouter();
  const totalHours = WEEK.reduce((sum, d) => sum + d.hours, 0);
  const estimatedPay = estimatedPayFor(totalHours);

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="My Hours" subtitle="This week" />}
      onBack={() => router.back()}>
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
            <ThemedText style={styles.timeText}>{shiftLabel(d)}</ThemedText>
            <ThemedText type="defaultSemiBold">{d.hours.toFixed(1)}h</ThemedText>
          </View>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
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
