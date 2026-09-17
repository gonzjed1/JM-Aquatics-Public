import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useAppData } from '@/contexts/app-data';
import { formatCurrency, formatDateRange, formatHours } from '@/data/format';
import { MOCK_PAY_PERIOD } from '@/data/mock-seed';
import { OVERTIME_MULTIPLIER, payrollRows, payrollTotal } from '@/data/payroll';

/** Jed-only: every employee's hours and gross for the period, as a table. */
export default function BreakdownScreen() {
  const router = useRouter();
  const { payroll, staffById } = useAppData();

  const rows = payrollRows(payroll, staffById);
  const totalHours = rows.reduce((sum, r) => sum + r.line.hours, 0);
  const totalOvertime = rows.reduce((sum, r) => sum + r.line.overtimeHours, 0);
  const total = payrollTotal(rows);

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title="Full Breakdown"
          subtitle={formatDateRange(MOCK_PAY_PERIOD.start, MOCK_PAY_PERIOD.end)}
        />
      }
      onBack={() => router.back()}>
      <Card style={styles.table}>
        <TableRow cells={['Employee', 'Hours', 'OT', 'Gross']} kind="header" />
        {rows.map((r) => (
          <TableRow
            key={r.staff.id}
            cells={[
              r.staff.name,
              formatHours(r.line.hours),
              formatHours(r.line.overtimeHours),
              formatCurrency(r.gross),
            ]}
          />
        ))}
        <TableRow
          cells={['Total', formatHours(totalHours), formatHours(totalOvertime), formatCurrency(total)]}
          kind="footer"
        />
      </Card>

      <ThemedText style={styles.note}>
        Straight time at each rate, overtime at {OVERTIME_MULTIPLIER}× — estimates until pay rules are
        confirmed with J&M.
      </ThemedText>
    </ParallaxScrollView>
  );
}

function TableRow({ cells, kind = 'body' }: { cells: string[]; kind?: 'header' | 'body' | 'footer' }) {
  const [first, ...rest] = cells;
  return (
    <View style={[styles.row, kind === 'footer' && styles.footerRow]}>
      <ThemedText
        type={kind === 'body' ? 'default' : 'defaultSemiBold'}
        style={[styles.nameCell, kind === 'header' && styles.headerText]}
        numberOfLines={1}>
        {first}
      </ThemedText>
      {rest.map((cell, i) => (
        <ThemedText
          key={i}
          type={kind === 'body' ? 'default' : 'defaultSemiBold'}
          style={[styles.numCell, kind === 'header' && styles.headerText]}>
          {cell}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    gap: 0,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  footerRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#888',
  },
  nameCell: {
    flex: 2.2,
  },
  numCell: {
    flex: 1,
    textAlign: 'right',
  },
  headerText: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },
});
