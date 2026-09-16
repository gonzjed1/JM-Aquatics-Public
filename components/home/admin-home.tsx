import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/activity-row';
import { greeting } from '@/components/home/greeting';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { AssignedPeople } from '@/components/schedule/assigned-people';
import { ShiftResponses } from '@/components/schedule/shift-responses';
import { HEADER_BG, HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusDot, fillTone } from '@/components/ui/status-dot';
import { byStart, useAppData, useMe } from '@/contexts/app-data';
import { addDays, formatDayDate, formatDayDateYear } from '@/data/format';
import { isOpen, openSlots, shiftTimePlace } from '@/data/shifts';

/**
 * Jed's dashboard, top to bottom: today's numbers (each tile opens its
 * detail), today's shifts with who's on them, every open shift with who has
 * answered, then the latest activity.
 */
export function AdminHome() {
  const router = useRouter();
  const me = useMe();
  const { today, weekStart, shifts, pendingRequests, pendingOffers, activity } = useAppData();

  const weekEnd = addDays(weekStart, 6);
  const weekShifts = shifts.filter((s) => s.date >= weekStart && s.date <= weekEnd);
  const todays = shifts.filter((s) => s.date === today).sort(byStart);
  const staffToday = new Set(todays.flatMap((s) => s.assigned)).size;
  const openShifts = weekShifts.filter(isOpen).length;
  const openUpcoming = shifts.filter((s) => s.date >= today && isOpen(s)).sort(byStart);

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
          <StatTile value={staffToday} label="Staff Today" color="#2F6FB2" onPress={() => router.push('/more/staff-today')} />
          <StatTile value={openShifts} label="Open Shifts" color="#27AE60" onPress={() => router.push('/more/open-shifts')} />
          <StatTile
            value={pendingRequests.length + pendingOffers.length}
            label="Pending Requests"
            color="#E5484D"
            onPress={() => router.push('/more/approvals')}
          />
        </View>
      </Card>

      <Card style={styles.list}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          {"Today's shifts"}
        </ThemedText>
        {todays.length === 0 ? (
          <ThemedText style={styles.muted}>No shifts today.</ThemedText>
        ) : (
          todays.map((shift, i) => (
            <View key={shift.id} style={[styles.shift, i < todays.length - 1 && styles.divider]}>
              <View style={styles.shiftHead}>
                <ThemedText type="defaultSemiBold" style={styles.grow}>
                  {shiftTimePlace(shift)}
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={openSlots(shift) > 0 && styles.short}>
                  {shift.assigned.length}/{shift.slots}
                </ThemedText>
                <StatusDot tone={fillTone(shift.assigned.length, shift.slots)} />
              </View>
              <AssignedPeople shift={shift} />
            </View>
          ))
        )}
      </Card>

      <Card style={styles.list}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          Availability
        </ThemedText>
        <ThemedText style={styles.muted}>{"Who has answered each open shift. Assign straight from here."}</ThemedText>
        {openUpcoming.length === 0 ? (
          <ThemedText style={[styles.muted, styles.spaced]}>Every upcoming shift is filled.</ThemedText>
        ) : (
          openUpcoming.map((shift, i) => (
            <View key={shift.id} style={[styles.shift, i < openUpcoming.length - 1 && styles.divider]}>
              <View style={styles.shiftHead}>
                <View style={styles.grow}>
                  <ThemedText type="defaultSemiBold">{formatDayDate(shift.date)}</ThemedText>
                  <ThemedText>{shiftTimePlace(shift)}</ThemedText>
                </View>
                <ThemedText style={styles.short}>
                  {openSlots(shift) === 1 ? '1 open' : `${openSlots(shift)} open`}
                </ThemedText>
              </View>
              <ShiftResponses shift={shift} canAssign />
            </View>
          ))
        )}
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
  spaced: {
    paddingVertical: 8,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  list: {
    gap: 0,
    paddingVertical: 12,
  },
  cardTitle: {
    marginBottom: 2,
  },
  shift: {
    paddingVertical: 10,
    gap: 6,
  },
  shiftHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  short: {
    color: '#C0392B',
    fontWeight: '700',
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  viewAll: {
    marginTop: 8,
  },
});
