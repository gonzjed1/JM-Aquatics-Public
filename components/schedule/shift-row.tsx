import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusDot, fillTone } from '@/components/ui/status-dot';
import { formatDayDate } from '@/data/format';
import type { Shift } from '@/data/mock-seed';
import { shiftTimePlace } from '@/data/shifts';

type Props = {
  shift: Shift;
  /** Show "3/5" and the fill dot — the admin view. Workers just see when and where. */
  showFill?: boolean;
  /** Optional extra line, e.g. the assigned names or a response summary. */
  detail?: string;
  /** Small pill beside the date, e.g. "Awaiting approval" on a shift the worker offered for. */
  tag?: string;
  last?: boolean;
  /** Makes the row tappable and draws an expand chevron. */
  onPress?: () => void;
  expanded?: boolean;
};

/** One shift as a list line: date, hours, location. */
export function ShiftRow({ shift, showFill = false, detail, tag, last = false, onPress, expanded = false }: Props) {
  const body = (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.main}>
        <View style={styles.dateLine}>
          <ThemedText type="defaultSemiBold">{formatDayDate(shift.date)}</ThemedText>
          {tag ? (
            <View style={styles.tag}>
              <ThemedText style={styles.tagText}>{tag}</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText>{shiftTimePlace(shift)}</ThemedText>
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
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E8930C1F',
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#B86E05',
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
