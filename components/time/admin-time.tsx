import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { Segmented } from '@/components/ui/segmented';
import { StatusDot } from '@/components/ui/status-dot';
import { useAppData } from '@/contexts/app-data';
import { formatWallClock, toISODate } from '@/data/format';
import type { Punch, StaffMember } from '@/data/mock-seed';

type View_ = 'live' | 'all';

/** Jed's time clock: who is on the clock right now, and every punch today. */
export function AdminTime() {
  const { today, staff, staffById, punches, clockedInNow, punchesFor } = useAppData();
  const [view, setView] = useState<View_>('live');
  const [lookupOpen, setLookupOpen] = useState(false);
  const [query, setQuery] = useState('');

  const open = clockedInNow();
  const location = mostCommon(open.map((p) => p.location));
  const todays = punches
    .filter((p) => toISODate(new Date(p.at)) === today)
    .sort((a, b) => b.at.localeCompare(a.at));
  const workers = staff.filter((s) => s.role === 'worker');
  const matches = query.trim()
    ? workers.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    : workers;

  const nameOf = (staffId: string) => staffById(staffId)?.short ?? staffId;

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Time Clock" subtitle="Live view across every location" />}>
      <Segmented
        options={[
          { value: 'live', label: 'Live' },
          { value: 'all', label: 'All Punches' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'live' ? (
        <>
          <Card>
            <View style={styles.liveHeader}>
              <StatusDot tone={open.length ? 'good' : 'muted'} size={10} />
              <ThemedText type="defaultSemiBold">
                {open.length} staff clocked in
              </ThemedText>
            </View>
            <ThemedText style={styles.muted}>{location ?? 'Nobody on the clock right now'}</ThemedText>
            {open.map((punch, i) => (
              <PunchLine
                key={punch.id}
                name={nameOf(punch.staffId)}
                person={staffById(punch.staffId)}
                punch={punch}
                last={i === open.length - 1}
              />
            ))}
          </Card>

          <Button
            label={lookupOpen ? 'Close Lookup' : 'Employee Lookup'}
            tone="success"
            onPress={() => setLookupOpen((v) => !v)}
          />

          {lookupOpen ? (
            <Card>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name"
                placeholderTextColor="#7B8B98"
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Search staff"
                style={styles.search}
              />
              {matches.map((person, i) => {
                const theirs = punchesFor(person.id);
                const last = theirs[theirs.length - 1];
                const onClock = last?.kind === 'in';
                return (
                  <View
                    key={person.id}
                    style={[styles.lookupRow, i < matches.length - 1 && styles.divider]}>
                    <StatusDot tone={onClock ? 'good' : 'muted'} />
                    <View style={styles.grow}>
                      <ThemedText>{person.name}</ThemedText>
                      <ThemedText style={styles.muted}>
                        {last
                          ? `${onClock ? 'In' : 'Out'} since ${formatWallClock(new Date(last.at))}`
                          : 'No punches today'}
                      </ThemedText>
                    </View>
                    <ContactButtons person={person} size="sm" />
                  </View>
                );
              })}
              {matches.length === 0 ? (
                <ThemedText style={styles.muted}>No one matches that.</ThemedText>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <ThemedText type="defaultSemiBold">{"Today's Recent Activity"}</ThemedText>
            {todays.slice(0, 5).map((punch, i, all) => (
              <PunchLine
                key={punch.id}
                name={`${nameOf(punch.staffId)} – ${punch.kind === 'in' ? 'Clock In' : 'Clock Out'}`}
                punch={punch}
                last={i === all.length - 1}
              />
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <ThemedText type="defaultSemiBold">All punches today</ThemedText>
          {todays.map((punch, i) => (
            <PunchLine
              key={punch.id}
              name={`${nameOf(punch.staffId)} – ${punch.kind === 'in' ? 'Clock In' : 'Clock Out'}`}
              detail={punch.location}
              punch={punch}
              last={i === todays.length - 1}
            />
          ))}
        </Card>
      )}
    </ParallaxScrollView>
  );
}

function PunchLine({
  name,
  detail,
  person,
  punch,
  last,
}: {
  name: string;
  detail?: string;
  /** When given, the row offers call / message. */
  person?: StaffMember;
  punch: Punch;
  last: boolean;
}) {
  return (
    <View style={[styles.punchRow, !last && styles.divider]}>
      <StatusDot tone={punch.kind === 'in' ? 'good' : 'bad'} />
      <View style={styles.grow}>
        <ThemedText>{name}</ThemedText>
        {detail ? <ThemedText style={styles.detail}>{detail}</ThemedText> : null}
      </View>
      {person ? <ContactButtons person={person} size="sm" /> : null}
      <ThemedText type="defaultSemiBold">{formatWallClock(new Date(punch.at))}</ThemedText>
    </View>
  );
}

function mostCommon<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const styles = StyleSheet.create({
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
  },
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  lookupRow: {
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
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 6,
  },
});
