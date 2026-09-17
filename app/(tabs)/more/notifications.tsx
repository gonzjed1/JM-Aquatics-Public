import { StyleSheet, Switch, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { can } from '@/constants/permissions';
import { useAppData, useMe, type NotificationTopic } from '@/contexts/app-data';
import { useAuth } from '@/contexts/auth-context';
import { useBack } from '@/hooks/use-back';

type Topic = {
  key: NotificationTopic;
  title: string;
  /** What this covers, in the words of whoever is reading it. */
  detail: (isAdmin: boolean) => string;
};

const TOPICS: Topic[] = [
  {
    key: 'shifts',
    title: 'Shifts',
    detail: (isAdmin) =>
      isAdmin
        ? 'Availability answers, shifts filling up, and cover still needed'
        : 'New open shifts, shifts you are given, and changes to yours',
  },
  {
    key: 'messages',
    title: 'Messages',
    detail: () => 'Direct messages and anything posted to All Staff',
  },
  {
    key: 'updates',
    title: 'Updates',
    detail: (isAdmin) =>
      isAdmin ? 'Requests waiting on you, and app announcements' : 'Approvals, reminders, and app announcements',
  },
];

/**
 * One switch per topic, per account — every role gets the same screen and
 * everything starts on. Turning a topic off hides those notifications in the
 * app now; in Phase 4 the same switch decides what is pushed to the phone.
 */
export default function NotificationsScreen() {
  const back = useBack();
  const me = useMe();
  const { role } = useAuth();
  const { prefsFor, setNotificationPref } = useAppData();

  if (!me) return null;

  const prefs = prefsFor(me.id);
  const isAdmin = can(role, 'manageSchedule');
  const onCount = TOPICS.filter((t) => prefs[t.key]).length;

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title="Notifications"
          subtitle={onCount === TOPICS.length ? 'All on' : `${onCount} of ${TOPICS.length} on`}
        />
      }
      onBack={back}>
      <Card style={styles.list}>
        {TOPICS.map((topic, i) => (
          <View key={topic.key} style={[styles.row, i < TOPICS.length - 1 && styles.divider]}>
            <View style={styles.text}>
              <ThemedText type="defaultSemiBold">{topic.title}</ThemedText>
              <ThemedText style={styles.detail}>{topic.detail(isAdmin)}</ThemedText>
            </View>
            <Switch
              value={prefs[topic.key]}
              onValueChange={(on) => setNotificationPref(me.id, topic.key, on)}
              accessibilityLabel={topic.title}
            />
          </View>
        ))}
      </Card>

      <ThemedText style={styles.note}>
        These are your switches — they only change what you are told about, not anyone else. Phone
        notifications arrive with the backend in Phase 4 and follow the same settings.
      </ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },
});
