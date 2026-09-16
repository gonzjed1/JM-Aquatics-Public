import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { useAppData } from '@/contexts/app-data';
import { formatWallClock } from '@/data/format';
import type { RequestKind, RequestStatus } from '@/data/mock-seed';

const KIND_LABEL: Record<RequestKind, string> = {
  'punch-correction': 'Punch correction',
  swap: 'Shift swap',
  'time-off': 'Time off',
  availability: 'Availability',
};

/** Jed's inbox of things that need a yes or no. Decisions land in the activity feed. */
export default function ApprovalsScreen() {
  const router = useRouter();
  const { requests, staffById, setRequestStatus } = useAppData();

  const newestFirst = (a: { at: string }, b: { at: string }) => b.at.localeCompare(a.at);
  const pending = requests.filter((r) => r.status === 'pending').sort(newestFirst);
  const resolved = requests.filter((r) => r.status !== 'pending').sort(newestFirst);
  const nameOf = (id: string) => staffById(id)?.name ?? id;

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Approval Queue" subtitle={`${pending.length} waiting`} />}
      onBack={() => router.back()}>
      <Card style={styles.list}>
        {pending.length === 0 ? (
          <ThemedText style={styles.muted}>Queue is clear.</ThemedText>
        ) : (
          pending.map((r, i) => (
            <View key={r.id} style={[styles.item, i < pending.length - 1 && styles.divider]}>
              <View style={styles.itemHead}>
                <ThemedText type="defaultSemiBold">{nameOf(r.staffId)}</ThemedText>
                <ThemedText style={styles.time}>{formatWallClock(new Date(r.at))}</ThemedText>
              </View>
              <ThemedText style={styles.kind}>{KIND_LABEL[r.kind]}</ThemedText>
              <ThemedText>{r.detail}</ThemedText>
              <View style={styles.actions}>
                <Button
                  label="Approve"
                  tone="success"
                  size="sm"
                  onPress={() => setRequestStatus(r.id, 'approved')}
                  style={styles.grow}
                />
                <Button
                  label="Deny"
                  tone="danger"
                  variant="outline"
                  size="sm"
                  onPress={() => setRequestStatus(r.id, 'denied')}
                  style={styles.grow}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      {resolved.length > 0 ? (
        <Card style={styles.list}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Resolved
          </ThemedText>
          {resolved.map((r, i) => (
            <View key={r.id} style={i < resolved.length - 1 && styles.divider}>
              <ListRow
                title={`${nameOf(r.staffId)} · ${KIND_LABEL[r.kind]}`}
                subtitle={r.detail}
                right={<StatusPill status={r.status} />}
              />
            </View>
          ))}
        </Card>
      ) : null}
    </ParallaxScrollView>
  );
}

function StatusPill({ status }: { status: RequestStatus }) {
  const approved = status === 'approved';
  return (
    <View style={[styles.pill, { backgroundColor: approved ? '#27AE60' : '#E5484D' }]}>
      <ThemedText style={styles.pillText}>{approved ? 'Approved' : 'Denied'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  muted: {
    opacity: 0.65,
    paddingVertical: 8,
  },
  item: {
    paddingVertical: 12,
    gap: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
  },
  kind: {
    fontSize: 13,
    lineHeight: 18,
    color: '#E8930C',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  grow: {
    flex: 1,
  },
  sectionTitle: {
    paddingVertical: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
