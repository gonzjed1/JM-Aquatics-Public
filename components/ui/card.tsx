import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';

/** The bordered content block every screen is built from — the same hairline card as Pay and Timesheet. */
export function Card({ style, ...rest }: ViewProps) {
  return <ThemedView style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    padding: 16,
    gap: 4,
  },
});
