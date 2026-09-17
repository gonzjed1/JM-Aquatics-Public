import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MOCK_HOURLY_RATE,
  MOCK_MY_WEEK as WEEK,
  MOCK_MY_WEEK_LABEL,
  mockWeekHours,
  type MockWorkDay as WorkDay,
} from '@/constants/mock-payroll';

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
  const totalHours = mockWeekHours();
  const estimatedPay = estimatedPayFor(totalHours);

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="My Hours" subtitle={MOCK_MY_WEEK_LABEL} />}
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
