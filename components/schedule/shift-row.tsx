import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusDot, fillTone } from '@/components/ui/status-dot';
import { formatDayDate, formatTimeRange } from '@/data/format';
import type { Shift } from '@/data/mock-seed';

type Props = {
  shift: Shift;
  /** Show "3/5" and the fill dot — the admin view. Workers just see when and where. */
  showFill?: boolean;
  /** Optional extra line, e.g. the assigned names or a response summary. */
  detail?: string;
  last?: boolean;
  /** Makes the row tappable and draws an expand chevron. */
  onPress?: () => void;
  expanded?: boolean;
};

/** One shift as a list line: date, hours, location. */
export function ShiftRow({ shift, showFill = false, detail, last = false, onPress, expanded = false }: Props) {
  const body = (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.main}>
        <ThemedText type="defaultSemiBold">{formatDayDate(shift.date)}</ThemedText>
        <ThemedText>{formatTimeRange(shift.start, shift.end)}</ThemedText>
        <ThemedText style={styles.muted}>{shift.location}</ThemedText>
        {detail ? <ThemedText style={styles.muted}>{detail}</ThemedText> : null}
      </View>
      {showFill ? (
        <View style={styles.fill}>
          <ThemedText type="defaultSemiBold">
            {shift.assigned.length}/{shift.slots}
          </ThemedText>
          <StatusDot tone={fillTone(shift.assigned.length, shift.slots)} />
        </View>
      ) : null}
      {onPress ? (
        <IconSymbol name={expanded ? 'chevron.up' : 'chevron.down'} size={18} color="#9BA1A6" />
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  main: {
    flex: 1,
    gap: 2,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
