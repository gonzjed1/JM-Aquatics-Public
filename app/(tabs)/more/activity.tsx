import { StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/activity-row';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useAppData } from '@/contexts/app-data';
import { useBack } from '@/hooks/use-back';

/** Everything in Jed's feed, newest first — the full list behind "View All Activity". */
export default function ActivityScreen() {
  const back = useBack();
  const { activity } = useAppData();

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Activity" subtitle={`${activity.length} recent events`} />}
      onBack={back}>
      <Card style={styles.list}>
        {activity.length === 0 ? (
          <ThemedText style={styles.muted}>Nothing has happened yet today.</ThemedText>
        ) : (
          activity.map((item, i) => (
            <View key={item.id} style={i < activity.length - 1 && styles.divider}>
              <ActivityRow item={item} />
            </View>
          ))
        )}
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  muted: {
    opacity: 0.65,
  },
});
