import { StyleSheet, View } from 'react-native';

export type Tone = 'good' | 'warn' | 'bad' | 'muted' | 'info';

/** One palette for every status colour in the app, so green always means the same thing. */
export const TONE_COLORS: Record<Tone, string> = {
  good: '#27AE60',
  warn: '#E8930C',
  bad: '#E5484D',
  muted: '#9BA1A6',
  info: '#2F6FB2',
};

/** Fill state for a shift: full is good, one short is a warning, more is bad. */
export function fillTone(assigned: number, slots: number): Tone {
  if (assigned >= slots) return 'good';
  return slots - assigned === 1 ? 'warn' : 'bad';
}

export function StatusDot({ tone, size = 8 }: { tone: Tone; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: TONE_COLORS[tone] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    flexShrink: 0,
  },
});
