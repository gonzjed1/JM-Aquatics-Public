import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/activity-row';
import { greeting } from '@/components/home/greeting';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { useAppData, useMe } from '@/contexts/app-data';
import { addDays, formatDayDateYear } from '@/data/format';

/** Jed's dashboard: today's numbers and the latest things that need his eyes. */
export function AdminHome() {
  const router = useRouter();
  const me = useMe();
  const { today, weekStart, shifts, pendingRequests, pendingOffers, activity } = useAppData();

  const weekEnd = addDays(weekStart, 6);
  const weekShifts = shifts.filter((s) => s.date >= weekStart && s.date <= weekEnd);
  const staffToday = new Set(shifts.filter((s) => s.date === today).flatMap((s) => s.assigned)).size;
  const openShifts = weekShifts.filter((s) => s.assigned.length < s.slots).length;

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title={`${greeting()}, ${me?.short.split(' ')[0] ?? ''}`}
          subtitle="Here's how today looks."
        />
      }
      headerRight={
        <HeaderIconButton
          name="gearshape.fill"
          label="Settings"
          onPress={() => router.push('/more/settings')}
        />
      }>
      <Card>
        <ThemedText type="defaultSemiBold">{"Today's Overview"}</ThemedText>
        <ThemedText style={styles.muted}>{formatDayDateYear(today)}</ThemedText>
        <View style={styles.tiles}>
          <StatTile value={staffToday} label="Staff Today" color="#2F6FB2" />
          <StatTile value={openShifts} label="Open Shifts" color="#27AE60" />
          <StatTile value={pendingRequests.length + pendingOffers.length} label="Pending Requests" color="#E5484D" />
        </View>
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Recent Activity</ThemedText>
        {activity.slice(0, 3).map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
        <Button
          label="View All Activity"
          variant="soft"
          onPress={() => router.push('/more/activity')}
          style={styles.viewAll}
        />
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  muted: {
    opacity: 0.65,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  viewAll: {
    marginTop: 8,
  },
});
