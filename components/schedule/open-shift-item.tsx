import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDayDate, formatTimeRange } from '@/data/format';
import type { Shift, ShiftAnswer } from '@/data/mock-seed';
import { openSlots, shiftLabel } from '@/data/shifts';

type Props = {
  shift: Shift;
  answer?: ShiftAnswer;
  /** Posted since the worker last looked. */
  isNew?: boolean;
  onAnswer: (answer: ShiftAnswer) => void;
  last?: boolean;
};

/** One open shift with the ✓ / ✗ buttons a worker answers it with. */
export function OpenShiftItem({ shift, answer, isNew = false, onAnswer, last = false }: Props) {
  const label = shiftLabel(shift);
  const open = openSlots(shift);

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <ThemedText type="defaultSemiBold">{formatDayDate(shift.date)}</ThemedText>
          {isNew ? (
            <View style={styles.newPill}>
              <ThemedText style={styles.newText}>New</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText>{formatTimeRange(shift.start, shift.end)}</ThemedText>
        <ThemedText style={styles.muted}>
          {shift.location} · {open} open
        </ThemedText>
        {answer ? (
          <ThemedText style={[styles.answer, answer === 'yes' ? styles.yesText : styles.noText]}>
            {answer === 'yes' ? 'You said ✓ Available' : 'You said ✗ Not available'}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.buttons}>
        <Pressable
          onPress={() => onAnswer('yes')}
          accessibilityRole="button"
          accessibilityLabel={`Available for ${label}`}
          accessibilityState={{ selected: answer === 'yes' }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.circle,
            styles.yesCircle,
            answer === 'yes' && styles.yesOn,
            pressed && styles.pressed,
          ]}>
          <IconSymbol name="checkmark" size={20} color={answer === 'yes' ? '#FFFFFF' : '#27AE60'} />
        </Pressable>
        <Pressable
          onPress={() => onAnswer('no')}
          accessibilityRole="button"
          accessibilityLabel={`Not available for ${label}`}
          accessibilityState={{ selected: answer === 'no' }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.circle,
            styles.noCircle,
            answer === 'no' && styles.noOn,
            pressed && styles.pressed,
          ]}>
          <IconSymbol name="xmark" size={20} color={answer === 'no' ? '#FFFFFF' : '#E5484D'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  main: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#2F6FB2',
  },
  newText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  answer: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  yesText: {
    color: '#27AE60',
  },
  noText: {
    color: '#E5484D',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  yesCircle: {
    borderColor: '#27AE60',
  },
  yesOn: {
    backgroundColor: '#27AE60',
  },
  noCircle: {
    borderColor: '#E5484D',
  },
  noOn: {
    backgroundColor: '#E5484D',
  },
  pressed: {
    opacity: 0.7,
  },
});
