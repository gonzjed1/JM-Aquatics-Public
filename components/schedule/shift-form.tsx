import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LocationField } from '@/components/schedule/location-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ShiftEdit } from '@/contexts/app-data';
import { addDays, formatClock, formatDayDate } from '@/data/format';

/**
 * The one shift form, used both to post a new shift and to edit an existing
 * one. Date, start, end and slots step up and down; location is a picker of
 * what's already in use plus free text for somewhere new.
 */
export function ShiftForm({
  title,
  initial,
  submitLabel,
  hint,
  minSlots = 1,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: ShiftEdit;
  submitLabel: string;
  hint?: string;
  /** Editing can't drop below the number of people already assigned. */
  minSlots?: number;
  onSubmit: (shift: ShiftEdit) => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [location, setLocation] = useState(initial.location);
  const [slots, setSlots] = useState(initial.slots);

  const timesValid = end > start;
  const locationValid = location.trim().length > 0;
  const valid = timesValid && locationValid;

  return (
    <Card style={styles.form}>
      <ThemedText type="subtitle">{title}</ThemedText>

      <LocationField value={location} onChange={setLocation} />

      <Stepper label="Date" value={formatDayDate(date)} onPrev={() => setDate(addDays(date, -1))} onNext={() => setDate(addDays(date, 1))} />
      <Stepper label="Start" value={formatClock(start)} onPrev={() => setStart(shiftTime(start, -30))} onNext={() => setStart(shiftTime(start, 30))} />
      <Stepper label="End" value={formatClock(end)} onPrev={() => setEnd(shiftTime(end, -30))} onNext={() => setEnd(shiftTime(end, 30))} />
      <Stepper
        label="Slots"
        value={String(slots)}
        onPrev={() => setSlots(Math.max(minSlots, slots - 1))}
        onNext={() => setSlots(Math.min(10, slots + 1))}
      />

      {!timesValid ? <ThemedText style={styles.error}>End time has to be after the start.</ThemedText> : null}
      {!locationValid ? <ThemedText style={styles.error}>Give the location a name.</ThemedText> : null}

      <Button
        label={submitLabel}
        tone="success"
        disabled={!valid}
        onPress={() => onSubmit({ date, start, end, location: location.trim(), slots })}
        style={styles.submit}
      />
      {onCancel ? <Button label="Cancel" tone="navy" variant="soft" size="sm" onPress={onCancel} /> : null}
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
    </Card>
  );
}

function Stepper({ label, value, onPrev, onNext }: { label: string; value: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.stepper}>
      <ThemedText style={styles.stepperLabel}>{label}</ThemedText>
      <Pressable onPress={onPrev} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Previous ${label}`}>
        <IconSymbol name="chevron.left" size={22} color="#687076" />
      </Pressable>
      <ThemedText type="defaultSemiBold" style={styles.stepperValue}>
        {value}
      </ThemedText>
      <Pressable onPress={onNext} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Next ${label}`}>
        <IconSymbol name="chevron.right" size={22} color="#687076" />
      </Pressable>
    </View>
  );
}

/** '09:00' ± minutes, clamped to the day. */
function shiftTime(hhmm: string, deltaMinutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(23 * 60 + 30, Math.max(0, h * 60 + m + deltaMinutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  form: {
    gap: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  stepperLabel: {
    width: 56,
    opacity: 0.65,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  submit: {
    marginTop: 6,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
    textAlign: 'center',
  },
});
