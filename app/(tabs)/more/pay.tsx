import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Segmented } from '@/components/ui/segmented';
import { MOCK_HOURLY_RATE, MOCK_MY_WEEK_LABEL, mockWeekHours } from '@/constants/mock-payroll';
import { formatCurrency, formatHours } from '@/data/format';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ---------------------------------------------------------------------------
// MOCK DATA — one worker's own pay, read only.
//
// Shaped like the payroll API response we expect, so this whole block can be
// swapped for a fetch without touching the screen below. Nothing here is a
// company total and no other employee is represented.
// ---------------------------------------------------------------------------

type PayPeriod = {
  id: string;
  /** Human label for the period, e.g. 'Aug 1 – Aug 15, 2025'. */
  label: string;
  /** Straight-time hours worked in the period. */
  hours: number;
  /** Hours paid at the overtime multiplier. */
  overtimeHours: number;
  /** Straight-time hourly rate, in dollars. */
  hourlyRate: number;
};

/** Oldest first — the last entry is the period currently in progress. */
const PAY_PERIODS: PayPeriod[] = [
  {
    id: '2025-07-01',
    label: 'Jul 1 – Jul 15, 2025',
    hours: 78.5,
    overtimeHours: 0,
    hourlyRate: MOCK_HOURLY_RATE,
  },
  {
    id: '2025-07-16',
    label: 'Jul 16 – Jul 31, 2025',
    hours: 80,
    overtimeHours: 2.5,
    hourlyRate: MOCK_HOURLY_RATE,
  },
  {
    id: '2025-08-01',
    label: 'Aug 1 – Aug 15, 2025',
    hours: 24.4,
    overtimeHours: 0,
    hourlyRate: MOCK_HOURLY_RATE,
  },
];

/**
 * Pay rules live in one place so the real ones (state overtime thresholds,
 * shift differentials, PTO) can replace them without touching the layout.
 */
const OVERTIME_MULTIPLIER = 1.5;

function grossPayFor(period: PayPeriod) {
  const straightTime = period.hours * period.hourlyRate;
  const overtime = period.overtimeHours * period.hourlyRate * OVERTIME_MULTIPLIER;
  return straightTime + overtime;
}

/** Same rule for a part-week: straight time only until the 40h line is crossed. */
function weekPayFor(hours: number) {
  const straight = Math.min(hours, 40);
  return straight * MOCK_HOURLY_RATE + Math.max(0, hours - 40) * MOCK_HOURLY_RATE * OVERTIME_MULTIPLIER;
}

// ---------------------------------------------------------------------------

type PayTab = 'current' | 'history';

export default function PayScreen() {
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';

  const [tab, setTab] = useState<PayTab>('current');
  // Start on the period in progress; the arrows walk back through history.
  const [periodIndex, setPeriodIndex] = useState(PAY_PERIODS.length - 1);

  const period = PAY_PERIODS[periodIndex];
  const hasOlder = periodIndex > 0;
  const hasNewer = periodIndex < PAY_PERIODS.length - 1;

  // This week stands on its own: the period picker below walks through pay
  // periods, but the question most often asked is "what have I made so far?".
  const weekHours = mockWeekHours();
  const current = PAY_PERIODS[PAY_PERIODS.length - 1];

  const arrowColor = isDark ? '#9BA1A6' : '#687076';
  const arrowDisabledColor = isDark ? '#3A4145' : '#C8CDD0';

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="My Pay" subtitle="Estimates only" />}
      onBack={() => router.back()}>
      <Segmented
        options={[
          { value: 'current', label: 'Current' },
          { value: 'history', label: 'History' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'current' ? (
        <>
          {/* this week, and the period running total it feeds */}
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">This week</ThemedText>
            <ThemedText style={styles.weekLabel}>{MOCK_MY_WEEK_LABEL}</ThemedText>
            <View style={styles.weekRow}>
              <View style={styles.weekBox}>
                <ThemedText type="title" style={styles.weekValue}>
                  {formatHours(weekHours)}
                </ThemedText>
                <ThemedText style={styles.weekCaption}>hours worked</ThemedText>
              </View>
              <View style={styles.weekBox}>
                <ThemedText type="title" style={[styles.weekValue, styles.weekPay]}>
                  {formatCurrency(weekPayFor(weekHours))}
                </ThemedText>
                <ThemedText style={styles.weekCaption}>estimated pay</ThemedText>
              </View>
            </View>
            <View style={styles.detailList}>
              <DetailRow
                label={`Running total · ${current.label}`}
                value={`${formatHours(current.hours)} · ${formatCurrency(grossPayFor(current))}`}
              />
            </View>
          </ThemedView>

          {/* pay period picker */}
          <View style={styles.periodRow}>
            <Pressable
              onPress={() => setPeriodIndex((i) => i - 1)}
              disabled={!hasOlder}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous pay period"
              style={({ pressed }) => [pressed && styles.pressed]}>
              <IconSymbol
                name="chevron.left"
                size={22}
                color={hasOlder ? arrowColor : arrowDisabledColor}
              />
            </Pressable>

            <ThemedText type="defaultSemiBold">{period.label}</ThemedText>

            <Pressable
              onPress={() => setPeriodIndex((i) => i + 1)}
              disabled={!hasNewer}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Next pay period"
              style={({ pressed }) => [pressed && styles.pressed]}>
              <IconSymbol
                name="chevron.right"
                size={22}
                color={hasNewer ? arrowColor : arrowDisabledColor}
              />
            </Pressable>
          </View>

          {/* estimated gross pay for this period */}
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">Estimated Gross Pay</ThemedText>
            <ThemedText type="title" style={styles.amount}>
              {formatCurrency(grossPayFor(period))}
            </ThemedText>

            <View style={styles.detailList}>
              <DetailRow label="Hours" value={formatHours(period.hours)} />
              <DetailRow label="Rate" value={formatCurrency(period.hourlyRate)} />
              <DetailRow label="OT Hours" value={formatHours(period.overtimeHours)} />
            </View>
          </ThemedView>

          <ThemedText style={styles.footnote}>
            Estimates only — see payroll for final amounts.
          </ThemedText>
        </>
      ) : (
        /* stub — past pay statements land here once payroll is wired up */
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Pay History</ThemedText>
          <ThemedText style={styles.stubText}>
            Your past pay statements will appear here once payroll is connected.
          </ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
  weekLabel: {
    opacity: 0.65,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  weekBox: {
    flex: 1,
  },
  weekValue: {
    fontSize: 30,
    lineHeight: 36,
  },
  weekPay: {
    color: '#27AE60',
  },
  weekCaption: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    padding: 16,
    gap: 4,
  },
  amount: {
    fontSize: 44,
    lineHeight: 52,
  },
  detailList: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#888',
  },
  detailLabel: {
    opacity: 0.7,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },
  stubText: {
    opacity: 0.7,
  },
});
