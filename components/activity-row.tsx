import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListRow } from '@/components/ui/list-row';
import { useAppData } from '@/contexts/app-data';
import { formatWallClock } from '@/data/format';
import type { ActivityItem, ActivityKind } from '@/data/mock-seed';

type IconName = ComponentProps<typeof IconSymbol>['name'];

const LOOK: Record<ActivityKind, { icon: IconName; tint: string }> = {
  availability: { icon: 'calendar.badge.checkmark', tint: '#27AE60' },
  correction: { icon: 'bell.fill', tint: '#E5484D' },
  message: { icon: 'message.fill', tint: '#2F6FB2' },
  punch: { icon: 'clock.fill', tint: '#27AE60' },
  swap: { icon: 'arrow.right', tint: '#E8930C' },
  shift: { icon: 'calendar', tint: '#2F6FB2' },
  staff: { icon: 'person.2.fill', tint: '#2F6FB2' },
  response: { icon: 'checkmark.circle.fill', tint: '#27AE60' },
};

/** One line of Jed's activity feed: who, what, when — with call / message when it's about someone. */
export function ActivityRow({ item }: { item: ActivityItem }) {
  const { staffById } = useAppData();
  const look = LOOK[item.kind];
  const person = item.staffId ? staffById(item.staffId) : undefined;
  return (
    <ListRow
      icon={look.icon}
      tint={look.tint}
      title={item.who}
      subtitle={item.text}
      right={
        <View style={styles.right}>
          {person ? <ContactButtons person={person} size="sm" /> : null}
          <ThemedText style={styles.time}>{formatWallClock(new Date(item.at))}</ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
  },
});
