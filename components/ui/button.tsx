import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type Tone = 'primary' | 'success' | 'danger' | 'navy';

const TONE: Record<Tone, string> = {
  primary: '#2F6FB2',
  success: '#27AE60',
  danger: '#C0392B',
  navy: '#1D3D47',
};

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  /** solid = filled, outline = bordered, soft = tinted background with coloured text. */
  variant?: 'solid' | 'outline' | 'soft';
  size?: 'md' | 'sm';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Screen-reader name when the visible label repeats on a screen (several "Assign" buttons). */
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  tone = 'primary',
  variant = 'solid',
  size = 'md',
  disabled = false,
  style,
  accessibilityLabel,
}: Props) {
  const color = TONE[tone];
  const fill =
    variant === 'solid'
      ? { backgroundColor: color }
      : variant === 'outline'
        ? { borderWidth: 1, borderColor: color }
        : { backgroundColor: `${color}1F` };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.small : styles.medium,
        fill,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <ThemedText
        type="defaultSemiBold"
        style={[{ color: variant === 'solid' ? '#FFFFFF' : color }, size === 'sm' && styles.smallLabel]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medium: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  small: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
