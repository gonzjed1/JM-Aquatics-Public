import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/** The teal band every tab and detail screen sits under. */
export const HEADER_BG = { light: '#1D3D47', dark: '#1D3D47' };

/** Title (and optional line beneath it) for ParallaxScrollView's headerImage slot. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <ThemedView style={styles.header}>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
    </ThemedView>
  );
}

/** White icon button for the header's action slot — the gear, the compose pencil. */
export function HeaderIconButton({
  name,
  label,
  onPress,
}: {
  name: ComponentProps<typeof IconSymbol>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <IconSymbol name={name} size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
  },
  iconButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.6,
  },
});
