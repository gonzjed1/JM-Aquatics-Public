import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

type IconName = ComponentProps<typeof IconSymbol>['name'];

type Props = {
  icon?: IconName;
  /** Six-digit hex. Tints the icon and, at low alpha, the circle behind it. */
  tint?: string;
  title: string;
  subtitle?: string;
  /** Free-form right side — a time, a value, a status pill. */
  right?: ReactNode;
  /** Red count bubble, hidden when 0. */
  badge?: number;
  chevron?: boolean;
  onPress?: () => void;
  /** Red title — Sign Out. */
  destructive?: boolean;
};

/** Icon + title/subtitle + trailing slot. The row shape used by More, activity feeds, and staff lists. */
export function ListRow({
  icon,
  tint = '#2F6FB2',
  title,
  subtitle,
  right,
  badge,
  chevron,
  onPress,
  destructive,
}: Props) {
  const body = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${tint}1F` }]}>
          <IconSymbol name={icon} size={20} color={tint} />
        </View>
      ) : null}
      <View style={styles.text}>
        <ThemedText type="defaultSemiBold" style={destructive && styles.destructive}>
          {title}
        </ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      ) : null}
      {right}
      {chevron ? <IconSymbol name="chevron.right" size={18} color="#9BA1A6" /> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  destructive: {
    color: '#C0392B',
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});
