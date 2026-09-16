import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type SegmentOption<T extends string> = { value: T; label: string };

/** The Current / History style toggle, generic over its option values. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const selectedBackground = isDark ? '#151718' : '#FFFFFF';

  return (
    <View style={[styles.track, { backgroundColor: isDark ? '#22272A' : '#F1F3F4' }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: selectedBackground, borderColor: '#888' },
              pressed && !selected && styles.pressed,
            ]}>
            <ThemedText type="defaultSemiBold" style={!selected && styles.inactive}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  inactive: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.6,
  },
});
