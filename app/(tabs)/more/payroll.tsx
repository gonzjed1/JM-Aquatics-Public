import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { KeyValue } from '@/components/ui/key-value';
import { ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { StatTile } from '@/components/ui/stat-tile';
import { useAppData } from '@/contexts/app-data';
import { saveTextFile } from '@/data/download';
import { formatCurrency, formatDateRange, formatHours } from '@/data/format';
import { MOCK_PAY_PERIOD } from '@/data/mock-seed';
import {
  payrollCsv,
  payrollForRange,
  payrollRows,
  payrollTotal,
  rangeFor,
  stepAnchor,
  type RangeScale,
} from '@/data/payroll';

// ---------------------------------------------------------------------------
// MOCK DATA — closed periods for the History tab. The current period comes
// from the store; these are placeholders until payroll history is served.
// ---------------------------------------------------------------------------
const CLOSED_PERIODS = [
  { id: '2025-07-16', label: 'Jul 16 – Jul 31, 2025', employees: 12, total: 5412.75 },
  { id: '2025-07-01', label: 'Jul 1 – Jul 15, 2025', employees: 11, total: 5088.5 },
];

type Tab = 'current' | 'totals' | 'history';

const SCALES: { value: RangeScale; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

/** Jed-only: everyone's pay for the period, one person at a time or all at once. */
export default function PayrollScreen() {
  const router = useRouter();
  const { today, payroll, staffById } = useAppData();

  const [tab, setTab] = useState<Tab>('current');
  const [selectedId, setSelectedId] = useState('sam');
  const [exportNote, setExportNote] = useState<string | null>(null);
  // Totals tab: which scale, and which week / month / year of it.
  const [scale, setScale] = useState<RangeScale>('weekly');
  const [anchor, setAnchor] = useState(today);

  const rows = useMemo(() => payrollRows(payroll, staffById), [payroll, staffById]);
  const selected = rows.find((r) => r.staff.id === selectedId) ?? rows[0];
  const total = payrollTotal(rows);
  const periodLabel = formatDateRange(MOCK_PAY_PERIOD.start, MOCK_PAY_PERIOD.end);

  const range = rangeFor(scale, anchor);
  const rangeRows = payrollForRange(rows, range);
  const rangeTotal = payrollTotal(rangeRows);
  const rangeHours = rangeRows.reduce((sum, r) => sum + r.line.hours, 0);

  const exportCsv = async () => {
    const filename = `payroll-${MOCK_PAY_PERIOD.start}_${MOCK_PAY_PERIOD.end}.csv`;
    const result = await saveTextFile(filename, payrollCsv(rows, MOCK_PAY_PERIOD));
    setExportNote(
      result === 'downloaded'
        ? `Downloaded ${filename}`
        : result === 'shared'
          ? 'Opened the share sheet with the CSV.'
          : 'Export is not available in this environment.'
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Payroll" subtitle="Estimates until pay rules are confirmed" />}
      onBack={() => router.back()}>
      <Segmented
        options={[
          { value: 'current', label: 'Current' },
          { value: 'totals', label: 'Totals' },
          { value: 'history', label: 'History' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'current' ? (
        <>
          {/* Only one open period exists yet, so the arrows are parked. */}
          <View style={styles.periodRow}>
            <IconSymbol name="chevron.left" size={22} color="#C8CDD0" />
            <ThemedText type="defaultSemiBold">{periodLabel}</ThemedText>
            <IconSymbol name="chevron.right" size={22} color="#C8CDD0" />
          </View>

          <View style={styles.chips}>
            {rows.map((r) => {
              const on = r.staff.id === selected?.staff.id;
              return (
                <Pressable
                  key={r.staff.id}
                  onPress={() => setSelectedId(r.staff.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.chip, on && styles.chipOn]}>
                  <ThemedText style={[styles.chipText, on && styles.chipTextOn]}>{r.staff.short}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          {selected ? (
            <Card>
              <ThemedText type="defaultSemiBold">Estimated Gross Pay</ThemedText>
              <View style={styles.personLine}>
                <ThemedText style={[styles.muted, styles.grow]}>{selected.staff.name}</ThemedText>
                <ContactButtons person={selected.staff} size="sm" />
              </View>
              <ThemedText type="title" style={styles.amount}>
                {formatCurrency(selected.gross)}
              </ThemedText>
              <View style={styles.lines}>
                <KeyValue label="Hours" value={formatHours(selected.line.hours)} />
                <KeyValue label="Rate" value={formatCurrency(selected.staff.hourlyRate)} />
                <KeyValue label="OT Hours" value={formatHours(selected.line.overtimeHours)} last />
              </View>
              <Button
                label="View Full Breakdown →"
                variant="soft"
                onPress={() => router.push('/more/breakdown')}
                style={styles.breakdown}
              />
            </Card>
          ) : null}

          <Button label="Export Payroll (CSV)" tone="navy" onPress={exportCsv} />
          {exportNote ? <ThemedText style={styles.exportNote}>{exportNote}</ThemedText> : null}

          <View style={styles.tiles}>
            <StatTile value={rows.length} label="Employees" />
            <StatTile value={formatCurrency(total)} label="Total Payroll" color="#27AE60" />
          </View>
        </>
      ) : tab === 'totals' ? (
        <>
          <Segmented options={SCALES} value={scale} onChange={setScale} />

          <View style={styles.periodRow}>
            <Pressable
              onPress={() => setAnchor(stepAnchor(scale, anchor, -1))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous range">
              <IconSymbol name="chevron.left" size={22} color="#687076" />
            </Pressable>
            <ThemedText type="defaultSemiBold">{formatDateRange(range.start, range.end)}</ThemedText>
            <Pressable
              onPress={() => setAnchor(stepAnchor(scale, anchor, 1))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Next range">
              <IconSymbol name="chevron.right" size={22} color="#687076" />
            </Pressable>
          </View>

          <View style={styles.tiles}>
            <StatTile value={formatHours(rangeHours)} label="Hours" />
            <StatTile value={formatCurrency(rangeTotal)} label="Gross Pay" color="#27AE60" />
          </View>

          <Card style={styles.history}>
            {rangeRows.map((r, i) => (
              <ListRow
                key={r.staff.id}
                icon="person.fill"
                title={r.staff.name}
                subtitle={formatHours(r.line.hours)}
                right={
                  <View style={styles.personLine}>
                    <ContactButtons person={r.staff} size="sm" />
                    <ThemedText type="defaultSemiBold">{formatCurrency(r.gross)}</ThemedText>
                  </View>
                }
              />
            ))}
            {rangeRows.length === 0 ? <ThemedText style={styles.muted}>Nobody on payroll yet.</ThemedText> : null}
          </Card>

          <ThemedText style={styles.note}>
            {scale === 'weekly'
              ? 'A week of the current pay period, per person.'
              : 'Projected from the current pay period — payroll history is connected in Phase 4.'}
          </ThemedText>
        </>
      ) : (
        <Card style={styles.history}>
          <ThemedText type="defaultSemiBold">Closed periods</ThemedText>
          {CLOSED_PERIODS.map((p, i) => (
            <KeyValue
              key={p.id}
              label={`${p.label} · ${p.employees} employees`}
              value={formatCurrency(p.total)}
              last={i === CLOSED_PERIODS.length - 1}
            />
          ))}
          <ThemedText style={styles.note}>Placeholder totals until payroll history is connected.</ThemedText>
        </Card>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
  },
  chipOn: {
    backgroundColor: '#1D3D47',
    borderColor: '#1D3D47',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
  personLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
  muted: {
    opacity: 0.65,
  },
  amount: {
    fontSize: 44,
    lineHeight: 52,
  },
  lines: {
    marginTop: 8,
  },
  breakdown: {
    marginTop: 10,
  },
  exportNote: {
    fontSize: 13,
    lineHeight: 18,
    color: '#27AE60',
    textAlign: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  history: {
    gap: 0,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
    marginTop: 10,
  },
});
