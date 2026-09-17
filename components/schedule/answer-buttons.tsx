import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ShiftAnswer } from '@/data/mock-seed';
import { useArmedAction } from '@/hooks/use-armed-action';

const YES = '#27AE60';
const NO = '#E5484D';

/**
 * The ✓ / ✗ pair takes two taps, like every other answer in the app that is
 * hard to take back: the first arms that side, the second sends it, and it
 * disarms itself after a few seconds. Tapping the other side moves the arming
 * across rather than sending anything.
 */
export function useAnswerConfirm(onAnswer: (answer: ShiftAnswer) => void) {
  const yes = useArmedAction(() => onAnswer('yes'));
  const no = useArmedAction(() => onAnswer('no'));

  const tap = (answer: ShiftAnswer) => {
    if (answer === 'yes') {
      no.disarm();
      yes.tap();
    } else {
      yes.disarm();
      no.tap();
    }
  };

  const armed: ShiftAnswer | null = yes.armed ? 'yes' : no.armed ? 'no' : null;
  return { armed, tap };
}

/** 'Tap ✓ again to confirm' — the line that explains the armed state. */
export function confirmHint(armed: ShiftAnswer | null): string | null {
  if (!armed) return null;
  return armed === 'yes' ? 'Tap ✓ again to confirm' : 'Tap ✗ again to confirm';
}

export function AnswerButtons({
  answer,
  armed,
  onTap,
  yesLabel,
  noLabel,
  size = 'md',
}: {
  /** What this person has already said, if anything. */
  answer?: ShiftAnswer;
  armed: ShiftAnswer | null;
  onTap: (answer: ShiftAnswer) => void;
  /** Screen-reader names — several of these sit on one screen. */
  yesLabel: string;
  noLabel: string;
  size?: 'md' | 'sm';
}) {
  const dim = size === 'sm' ? 36 : 42;
  const icon = size === 'sm' ? 18 : 20;

  return (
    <View style={styles.buttons}>
      <Circle
        tone={YES}
        icon="checkmark"
        dim={dim}
        iconSize={icon}
        on={answer === 'yes'}
        armed={armed === 'yes'}
        label={yesLabel}
        onPress={() => onTap('yes')}
      />
      <Circle
        tone={NO}
        icon="xmark"
        dim={dim}
        iconSize={icon}
        on={answer === 'no'}
        armed={armed === 'no'}
        label={noLabel}
        onPress={() => onTap('no')}
      />
    </View>
  );
}

function Circle({
  tone,
  icon,
  dim,
  iconSize,
  on,
  armed,
  label,
  onPress,
}: {
  tone: string;
  icon: 'checkmark' | 'xmark';
  dim: number;
  iconSize: number;
  /** Already the standing answer. */
  on: boolean;
  /** One tap in — waiting for the second. */
  armed: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, expanded: armed }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.circle,
        { width: dim, height: dim, borderRadius: dim / 2, borderColor: tone },
        on && { backgroundColor: tone },
        // Armed reads as "nearly there": tinted through, with a heavier ring.
        armed && { backgroundColor: `${tone}33`, borderWidth: 3 },
        pressed && styles.pressed,
      ]}>
      <IconSymbol name={icon} size={iconSize} color={on ? '#FFFFFF' : tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
