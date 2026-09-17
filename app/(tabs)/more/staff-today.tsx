import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { StatusDot, TONE_COLORS, type Tone } from '@/components/ui/status-dot';
import { byStart, useAppData } from '@/contexts/app-data';
import type { StaffMember } from '@/data/mock-seed';
import { isOpen, shiftTimePlace } from '@/data/shifts';
import { useBack } from '@/hooks/use-back';

type Status = 'yes' | 'no' | 'pending';

const GROUPS: { status: Status; title: string; tone: Tone }[] = [
  { status: 'yes', title: 'Available', tone: 'good' },
  { status: 'no', title: 'Not available', tone: 'bad' },
  { status: 'pending', title: 'Pending', tone: 'muted' },
];

/**
 * Behind Home's "Staff Today" tile: the whole roster, grouped by how they've
 * answered the open shifts — anyone with a ✓ still standing is Available, a ✗
 * with no ✓ is Not available, no answer at all is Pending — with the phone
 * number and call / message on every row.
 */
export default function StaffTodayScreen() {
  const back = useBack();
  const { today, staff, shifts, shiftResponses } = useAppData();

  const workers = staff.filter((s) => s.role === 'worker').sort((a, b) => a.name.localeCompare(b.name));
  const todays = shifts.filter((s) => s.date === today).sort(byStart);
  const open = shifts.filter((s) => s.date >= today && isOpen(s));

  const statusOf = (person: StaffMember): Status => {
    const answers = open
      .filter((s) => !s.assigned.includes(person.id))
      .map((s) => shiftResponses[s.id]?.[person.id])
      .filter((a) => a !== undefined);
    if (answers.includes('yes')) return 'yes';
    if (answers.includes('no')) return 'no';
    return 'pending';
  };
  const workingToday = (person: StaffMember) => todays.find((s) => s.assigned.includes(person.id));
  const onToday = workers.filter(workingToday).length;

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title="Staff Today"
          subtitle={`${onToday} on today · ${workers.length} on the roster`}
        />
      }
      onBack={back}>
      {GROUPS.map(({ status, title, tone }) => {
        const people = workers.filter((p) => statusOf(p) === status);
        return (
          <Card key={status} style={styles.list}>
            <View style={styles.groupHead}>
              <StatusDot tone={tone} />
              <ThemedText type="defaultSemiBold" style={{ color: TONE_COLORS[tone] }}>
                {title}
              </ThemedText>
              <ThemedText style={styles.count}>{people.length}</ThemedText>
            </View>
            {people.length === 0 ? (
              <ThemedText style={styles.muted}>No one</ThemedText>
            ) : (
              people.map((person, i) => {
                const shift = workingToday(person);
                return (
                  <View key={person.id} style={[styles.row, i < people.length - 1 && styles.divider]}>
                    <View style={styles.grow}>
                      <ThemedText type="defaultSemiBold">{person.name}</ThemedText>
                      <ThemedText style={styles.sub}>
                        {shift ? `On today · ${shiftTimePlace(shift)}` : 'Not on today'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.phone}>{person.phone}</ThemedText>
                    <ContactButtons person={person} size="sm" />
                  </View>
                );
              })
            )}
          </Card>
        );
      })}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
    paddingVertical: 8,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  count: {
    fontSize: 13,
    opacity: 0.6,
  },
  muted: {
    opacity: 0.65,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  grow: {
    flex: 1,
    gap: 1,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  phone: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
});
