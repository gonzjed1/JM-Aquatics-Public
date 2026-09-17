import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnswerButtons, confirmHint, useAnswerConfirm } from '@/components/schedule/answer-buttons';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useAppData, useMe } from '@/contexts/app-data';
import type { Shift } from '@/data/mock-seed';
import { shiftLabel } from '@/data/shifts';

/**
 * Sits under a shift the worker is already on. Things change after a schedule
 * goes up, so **Change availability** opens the same ✓ / ✗ pair used for open
 * shifts: ✓ says they can still work it, ✗ asks Jed to take them off, which
 * files a drop request rather than emptying the slot on the spot. Two taps
 * either way.
 */
export function ChangeAvailability({ shift }: { shift: Shift }) {
  const me = useMe();
  const { changeAvailability, dropRequestFor, answerFor } = useAppData();
  const [open, setOpen] = useState(false);
  const meId = me?.id ?? '';

  const { armed, tap } = useAnswerConfirm((answer) => {
    if (!meId) return;
    changeAvailability(shift.id, meId, answer);
    setOpen(false);
  });

  if (!me) return null;

  const label = shiftLabel(shift);
  const pendingDrop = dropRequestFor(shift.id, meId);
  const hint = confirmHint(armed);

  if (pendingDrop) {
    return (
      <ThemedText style={styles.pending}>{"Asked to come off this one — waiting on Jed."}</ThemedText>
    );
  }

  return (
    <View style={styles.wrap}>
      <Button
        label={open ? 'Never mind' : 'Change availability'}
        tone="navy"
        variant="soft"
        size="sm"
        accessibilityLabel={open ? `Close availability for ${label}` : `Change availability for ${label}`}
        onPress={() => setOpen((v) => !v)}
        style={styles.button}
      />

      {open ? (
        <View style={styles.panel}>
          <View style={styles.text}>
            <ThemedText style={styles.question}>Can you still work this one?</ThemedText>
            <ThemedText style={styles.muted}>{"✓ keeps it · ✗ asks Jed to take you off"}</ThemedText>
            {hint ? (
              <ThemedText style={[styles.hint, armed === 'yes' ? styles.yes : styles.no]}>{hint}</ThemedText>
            ) : null}
          </View>
          <AnswerButtons
            answer={answerFor(shift.id, meId)}
            armed={armed}
            onTap={tap}
            size="sm"
            yesLabel={`Still available for ${label}`}
            noLabel={`Ask to come off ${label}`}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingBottom: 10,
  },
  button: {
    alignSelf: 'flex-start',
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  question: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  yes: {
    color: '#27AE60',
  },
  no: {
    color: '#E5484D',
  },
  pending: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#B86E05',
    paddingBottom: 10,
  },
});
