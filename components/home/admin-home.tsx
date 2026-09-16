import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/activity-row';
import { greeting } from '@/components/home/greeting';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { AssignedPeople } from '@/components/schedule/assigned-people';
import { ShiftResponses } from '@/components/schedule/shift-responses';
import { HEADER_BG, HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusDot, fillTone } from '@/components/ui/status-dot';
import { byStart, useAppData, useMe } from '@/contexts/app-data';
import { addDays, formatDayDate, formatDayDateYear } from '@/data/format';
import { isOpen, openSlots, shiftLabel, shiftTimePlace } from '@/data/shifts';

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
  // Open slots inside the next 48 hours — today and tomorrow on the frozen demo day.
  const urgent = openUpcoming.filter((s) => s.date <= addDays(today, 1));

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
          onPress={() => router.push({ pathname: '/more/settings', params: { from: 'home' } })}
        />
      }>
      {urgent.length > 0 ? (
        <Pressable
          onPress={() => router.push({ pathname: '/more/open-shifts', params: { shift: urgent[0].id, from: 'home' } })}
          accessibilityRole="button"
          accessibilityLabel="Unfilled shift — open availability"
          style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}>
          <IconSymbol name="bell.fill" size={22} color="#FFFFFF" />
          <View style={styles.grow}>
            <ThemedText style={styles.bannerTitle}>
              {urgent.length === 1 ? 'Unfilled shift in the next 48 hours' : `${urgent.length} unfilled shifts in the next 48 hours`}
            </ThemedText>
            <ThemedText style={styles.bannerText}>
              {shiftLabel(urgent[0])} · {openSlots(urgent[0]) === 1 ? '1 slot open' : `${openSlots(urgent[0])} slots open`}
              {urgent.length > 1 ? ` · and ${urgent.length - 1} more` : ''}
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Card>
        <ThemedText type="defaultSemiBold">{"Today's Overview"}</ThemedText>
        <ThemedText style={styles.muted}>{formatDayDateYear(today)}</ThemedText>
        <View style={styles.tiles}>
          <StatTile value={staffToday} label="Staff Today" color="#2F6FB2" onPress={() => router.push({ pathname: '/more/staff-today', params: { from: 'home' } })} />
          <StatTile value={openShifts} label="Open Shifts" color="#27AE60" onPress={() => router.push({ pathname: '/more/open-shifts', params: { from: 'home' } })} />
          <StatTile
            value={pendingRequests.length + pendingOffers.length}
            label="Pending Requests"
            color="#E5484D"
            onPress={() => router.push({ pathname: '/more/approvals', params: { from: 'home' } })}
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
          onPress={() => router.push({ pathname: '/more/activity', params: { from: 'home' } })}
          style={styles.viewAll}
        />
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#C0392B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bannerPressed: {
    opacity: 0.85,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.92,
  },
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
