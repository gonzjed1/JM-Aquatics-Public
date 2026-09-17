import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/** Big number over a small label — the "12 Staff Working" tiles and payroll totals. */
export function StatTile({
  value,
  label,
  color,
  onPress,
  singleLineLabel = false,
}: {
  value: string | number;
  label: string;
  /** Colours the number only; the label stays neutral. */
  color?: string;
  /** Makes the tile a button that opens the detail behind the number. */
  onPress?: () => void;
  /** Keeps a two-part label like 'Open Shifts / Staff Needed' on one line. */
  singleLineLabel?: boolean;
}) {
  const body = (
    <ThemedView style={styles.tile}>
      <ThemedText type="title" style={[styles.value, color ? { color } : undefined]}>
        {value}
      </ThemedText>
      <ThemedText
        style={[styles.label, singleLineLabel && styles.labelTight]}
        numberOfLines={singleLineLabel ? 1 : undefined}>
        {label}
      </ThemedText>
    </ThemedView>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    gap: 2,
  },
  value: {
    fontSize: 28,
    lineHeight: 32,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  labelTight: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: -0.1,
  },
  pressed: {
    opacity: 0.6,
  },
});
