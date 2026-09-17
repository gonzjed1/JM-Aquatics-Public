import { StyleSheet, View } from 'react-native';

import { AnswerButtons, confirmHint, useAnswerConfirm } from '@/components/schedule/answer-buttons';
import { ThemedText } from '@/components/themed-text';
import { formatDayDate } from '@/data/format';
import type { Shift, ShiftAnswer } from '@/data/mock-seed';
import { openSlots, shiftLabel, shiftTimePlace } from '@/data/shifts';

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
  // Two taps: an answer goes straight to Jed, so a stray thumb shouldn't send it.
  const { armed, tap } = useAnswerConfirm(onAnswer);
  const hint = confirmHint(armed);

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
        <ThemedText>{shiftTimePlace(shift)}</ThemedText>
        <ThemedText style={styles.muted}>{open === 1 ? '1 open slot' : `${open} open slots`}</ThemedText>
        {hint ? (
          <ThemedText style={[styles.answer, armed === 'yes' ? styles.yesText : styles.noText]}>{hint}</ThemedText>
        ) : answer ? (
          <ThemedText style={[styles.answer, answer === 'yes' ? styles.yesText : styles.noText]}>
            {answer === 'yes' ? 'You said ✓ Available' : 'You said ✗ Not available'}
          </ThemedText>
        ) : null}
      </View>

      <AnswerButtons
        answer={answer}
        armed={armed}
        onTap={tap}
        yesLabel={`Available for ${label}`}
        noLabel={`Not available for ${label}`}
      />
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
});
