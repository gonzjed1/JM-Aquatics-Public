import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/contexts/app-data';
import type { Location } from '@/data/mock-seed';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Where a shift happens: a chip per location already in use, plus **New
 * location** for a pool that isn't on the list yet. Whatever is chosen is
 * stored on the shift itself, so a new one is offered as a chip from then on
 * and travels with the shift everywhere it's shown — the schedule, the
 * calendar, the availability board, and the notification workers get.
 */
export function LocationField({
  value,
  onChange,
}: {
  value: Location;
  onChange: (next: Location) => void;
}) {
  const { locations } = useAppData();
  const textColor = useThemeColor({}, 'text');
  // Typing keeps the field open even when what's typed happens to match a chip.
  const [typing, setTyping] = useState(() => value !== '' && !locations.includes(value));

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.label}>Location</ThemedText>
      <View style={styles.chips}>
        {locations.map((loc) => {
          const on = !typing && loc === value;
          return (
            <Pressable
              key={loc}
              onPress={() => {
                setTyping(false);
                onChange(loc);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipSelected]}>
              <ThemedText style={[styles.chipText, on && styles.chipTextSelected]}>{loc}</ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            setTyping(true);
            onChange('');
          }}
          accessibilityRole="button"
          accessibilityLabel="New location"
          accessibilityState={{ selected: typing }}
          style={[styles.chip, styles.chipNew, typing && styles.chipSelected]}>
          <ThemedText style={[styles.chipText, typing && styles.chipTextSelected]}>
            + New location
          </ThemedText>
        </Pressable>
      </View>

      {typing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Pool or facility name"
          placeholderTextColor="#7B8B98"
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          accessibilityLabel="New location name"
          style={[styles.input, { color: textColor }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
  },
  chipNew: {
    borderStyle: 'dashed',
  },
  chipSelected: {
    backgroundColor: '#1D3D47',
    borderColor: '#1D3D47',
    borderStyle: 'solid',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
