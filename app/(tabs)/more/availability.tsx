import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { OpenShiftItem } from '@/components/schedule/open-shift-item';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppData, useMe } from '@/contexts/app-data';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = [1, 2, 3, 4, 5];

/**
 * Two things a worker tells Jed here: a ✓ / ✗ on each open shift, and the
 * days they can usually work. Both land in his activity feed.
 */
export default function AvailabilityScreen() {
  const router = useRouter();
  const me = useMe();
  const { availability, submitAvailability, openShiftsFor, answerFor, respondToShift } = useAppData();

  const onFile = me ? availability[me.id] : undefined;
  const [days, setDays] = useState<number[]>(onFile ?? WEEKDAYS);
  const [justSubmitted, setJustSubmitted] = useState(false);

  if (!me) return null;

  const open = openShiftsFor(me.id);
  const answered = open.filter((s) => answerFor(s.id, me.id)).length;

  const toggle = (day: number) => {
    setJustSubmitted(false);
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const submit = () => {
    submitAvailability(me.id, days);
    setJustSubmitted(true);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title="Availability"
          subtitle={open.length ? `${answered} of ${open.length} open shifts answered` : 'No open shifts right now'}
        />
      }
      onBack={() => router.back()}>
      <Card style={styles.openCard}>
        <ThemedText type="defaultSemiBold">Open shifts</ThemedText>
        <ThemedText style={styles.muted}>{"Hit ✓ or ✗ if you're available for these shifts."}</ThemedText>
        {open.length === 0 ? (
          <ThemedText style={[styles.muted, styles.spaced]}>
            {"Nothing open right now — you'll be notified when Jed posts a shift."}
          </ThemedText>
        ) : (
          open.map((shift, i) => (
            <OpenShiftItem
              key={shift.id}
              shift={shift}
              answer={answerFor(shift.id, me.id)}
              onAnswer={(answer) => respondToShift(shift.id, me.id, answer)}
              last={i === open.length - 1}
            />
          ))
        )}
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Days you can usually work</ThemedText>
        <View style={styles.chips}>
          {DAY_LABELS.map((label, day) => {
            const on = days.includes(day);
            return (
              <Pressable
                key={label}
                onPress={() => toggle(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && styles.chipOn]}>
                <ThemedText style={[styles.chipText, on && styles.chipTextOn]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
        <Button
          label="Submit Availability"
          tone="success"
          disabled={days.length === 0}
          onPress={submit}
          style={styles.submit}
        />
        {justSubmitted ? (
          <ThemedText style={styles.confirm}>Submitted — Jed will see it in his activity feed.</ThemedText>
        ) : null}
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">On file</ThemedText>
        <ThemedText style={styles.muted}>
          {onFile ? onFile.map((d) => DAY_LABELS[d]).join(', ') : 'Nothing submitted yet.'}
        </ThemedText>
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  openCard: {
    gap: 2,
  },
  muted: {
    opacity: 0.65,
  },
  spaced: {
    marginTop: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
  },
  chipOn: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipTextOn: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submit: {
    marginTop: 12,
  },
  confirm: {
    fontSize: 13,
    lineHeight: 18,
    color: '#27AE60',
    textAlign: 'center',
    marginTop: 6,
  },
});
