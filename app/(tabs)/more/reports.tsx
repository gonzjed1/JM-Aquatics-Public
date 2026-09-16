import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { KeyValue } from '@/components/ui/key-value';
import { StatTile } from '@/components/ui/stat-tile';
import { useAppData } from '@/contexts/app-data';
import {
  addDays,
  formatCurrency,
  formatDateRange,
  formatHours,
  hoursBetween,
  parseISODate,
  toISODate,
} from '@/data/format';
import { MOCK_PAY_PERIOD, type Location } from '@/data/mock-seed';
import { payrollRows, payrollTotal } from '@/data/payroll';

/** Grace period before a clock-in counts as late. Another rule for J&M to confirm. */
const LATE_AFTER_MINUTES = 5;

/** Three read-outs computed live from the same data the other screens use. */
export default function ReportsScreen() {
  const router = useRouter();
  const { today, weekStart, shifts, punches, payroll, staffById } = useAppData();

  // --- scheduled hours this week --------------------------------------------
  const weekEnd = addDays(weekStart, 6);
  const weekShifts = shifts.filter((s) => s.date >= weekStart && s.date <= weekEnd);
  const staffHours = (s: (typeof shifts)[number]) => hoursBetween(s.start, s.end) * s.assigned.length;
  const scheduledHours = weekShifts.reduce((sum, s) => sum + staffHours(s), 0);
  const openSlots = weekShifts.reduce((sum, s) => sum + Math.max(0, s.slots - s.assigned.length), 0);
  const byLocation = new Map<Location, number>();
  for (const s of weekShifts) byLocation.set(s.location, (byLocation.get(s.location) ?? 0) + staffHours(s));

  // --- attendance today --------------------------------------------------------
  const todayShifts = shifts.filter((s) => s.date === today);
  const scheduledToday = new Set(todayShifts.flatMap((s) => s.assigned));
  const todayPunches = punches.filter((p) => toISODate(new Date(p.at)) === today);
  const clockedToday = new Set(todayPunches.filter((p) => p.kind === 'in').map((p) => p.staffId));
  let late = 0;
  for (const s of todayShifts) {
    const [h, m] = s.start.split(':').map(Number);
    const deadline = parseISODate(s.date);
    deadline.setHours(h, m + LATE_AFTER_MINUTES, 0, 0);
    for (const staffId of s.assigned) {
      const firstIn = todayPunches
        .filter((p) => p.staffId === staffId && p.kind === 'in')
        .sort((a, b) => a.at.localeCompare(b.at))[0];
      if (firstIn && new Date(firstIn.at) > deadline) late++;
    }
  }

  // --- labor cost this pay period ----------------------------------------------
  const rows = payrollRows(payroll, staffById);
  const periodHours = rows.reduce((sum, r) => sum + r.line.hours + r.line.overtimeHours, 0);
  const laborCost = payrollTotal(rows);

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Reports" subtitle="Hours, attendance, labor" />}
      onBack={() => router.back()}>
      <Card>
        <ThemedText type="defaultSemiBold">Scheduled hours</ThemedText>
        <ThemedText style={styles.muted}>{formatDateRange(weekStart, weekEnd)}</ThemedText>
        <View style={styles.tiles}>
          <StatTile value={formatHours(scheduledHours)} label="Staff hours" color="#2F6FB2" />
          <StatTile value={weekShifts.length} label="Shifts" />
          <StatTile value={openSlots} label="Open slots" color={openSlots ? '#E8930C' : '#27AE60'} />
        </View>
        <View style={styles.lines}>
          {[...byLocation.entries()].map(([location, hours], i, all) => (
            <KeyValue key={location} label={location} value={formatHours(hours)} last={i === all.length - 1} />
          ))}
        </View>
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Attendance today</ThemedText>
        <View style={styles.tiles}>
          <StatTile value={scheduledToday.size} label="Scheduled" />
          <StatTile value={clockedToday.size} label="Clocked in" color="#27AE60" />
          <StatTile value={late} label="Late" color={late ? '#E5484D' : '#27AE60'} />
        </View>
        <ThemedText style={styles.note}>
          Late means a first clock-in more than {LATE_AFTER_MINUTES} minutes after the shift start.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Labor cost</ThemedText>
        <ThemedText style={styles.muted}>{formatDateRange(MOCK_PAY_PERIOD.start, MOCK_PAY_PERIOD.end)}</ThemedText>
        <View style={styles.tiles}>
          <StatTile value={rows.length} label="Employees" />
          <StatTile value={formatHours(periodHours)} label="Hours" />
          <StatTile value={formatCurrency(laborCost)} label="Estimated cost" color="#27AE60" />
        </View>
        <ThemedText style={styles.note}>Estimates until pay rules are confirmed with J&M.</ThemedText>
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  muted: {
    opacity: 0.65,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  lines: {
    marginTop: 8,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
    marginTop: 8,
  },
});
