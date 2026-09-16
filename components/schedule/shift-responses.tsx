import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { StatusDot, TONE_COLORS, type Tone } from '@/components/ui/status-dot';
import { useAppData, type ResponseGroups } from '@/contexts/app-data';
import type { Shift, StaffMember } from '@/data/mock-seed';
import { openSlots } from '@/data/shifts';

/** '✓ 2 · ✗ 1 · 9 pending' — the one-line version for a collapsed row. */
export function responseSummary(groups: ResponseGroups): string {
  return `✓ ${groups.yes.length} · ✗ ${groups.no.length} · ${groups.pending.length} pending`;
}

/**
 * Who has answered a shift, in the order Jed wants to read it: available
 * first, then not available, then everyone still pending. With `canAssign`,
 * each available person gets an Assign button while the shift has room.
 */
export function ShiftResponses({ shift, canAssign = false }: { shift: Shift; canAssign?: boolean }) {
  const { responsesFor, assignToShift } = useAppData();
  const groups = responsesFor(shift.id);
  const room = openSlots(shift) > 0;

  return (
    <View style={styles.panel}>
      <Group
        title="Available ✓"
        tone="good"
        people={groups.yes}
        empty="No one yet"
        onAssign={canAssign && room ? (id) => assignToShift(shift.id, id) : undefined}
      />
      <Group title="Not available ✗" tone="bad" people={groups.no} empty="No one" />
      <Group title="Pending" tone="muted" people={groups.pending} empty="Everyone has answered" />
    </View>
  );
}

function Group({
  title,
  tone,
  people,
  empty,
  onAssign,
}: {
  title: string;
  tone: Tone;
  people: StaffMember[];
  empty: string;
  onAssign?: (staffId: string) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <StatusDot tone={tone} />
        <ThemedText type="defaultSemiBold" style={{ color: TONE_COLORS[tone] }}>
          {title}
        </ThemedText>
        <ThemedText style={styles.count}>{people.length}</ThemedText>
      </View>

      {people.length === 0 ? (
        <ThemedText style={styles.muted}>{empty}</ThemedText>
      ) : onAssign ? (
        people.map((person) => (
          <View key={person.id} style={styles.personRow}>
            <ThemedText style={styles.grow}>{person.short}</ThemedText>
            <Button label="Assign" tone="success" variant="soft" size="sm" onPress={() => onAssign(person.id)} />
          </View>
        ))
      ) : (
        <ThemedText style={styles.names}>{people.map((p) => p.short).join(', ')}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  group: {
    gap: 4,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  count: {
    fontSize: 13,
    opacity: 0.6,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.55,
    paddingLeft: 16,
  },
  names: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 16,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingVertical: 2,
  },
  grow: {
    flex: 1,
  },
});
