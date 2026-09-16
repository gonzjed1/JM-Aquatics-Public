import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** A label on the left, its value on the right — profile fields, report lines. */
export function KeyValue({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.line, !last && styles.divider]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  label: {
    opacity: 0.65,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
