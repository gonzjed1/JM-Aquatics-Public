import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { StatusDot, TONE_COLORS, type Tone } from '@/components/ui/status-dot';
import { useAppData, type ResponseGroups } from '@/contexts/app-data';
import type { Shift, StaffMember } from '@/data/mock-seed';
import { openSlots, shiftLabel } from '@/data/shifts';

/** '✓ 2 · ✗ 1 · 9 no response' — the one-line version for a collapsed row. */
export function responseSummary(groups: ResponseGroups): string {
  return `✓ ${groups.yes.length} · ✗ ${groups.no.length} · ${groups.pending.length} no response`;
}

/**
 * Who has answered a shift, in the order Jed wants to read it: available
 * first, then not available, then everyone who hasn't said. Every name has
 * call / message beside it; with `canAssign`, each available person also gets
 * an Assign button while the shift has room.
 */
export function ShiftResponses({ shift, canAssign = false }: { shift: Shift; canAssign?: boolean }) {
  const { responsesFor, assignToShift } = useAppData();
  const groups = responsesFor(shift.id);
  const room = openSlots(shift) > 0;
  const label = shiftLabel(shift);

  return (
    <View style={styles.panel}>
      <Group
        title="Available"
        tone="good"
        people={groups.yes}
        empty="No one yet"
        onAssign={canAssign && room ? (id) => assignToShift(shift.id, id) : undefined}
        assignLabel={(p) => `Assign ${p.short} to ${label}`}
      />
      <Group title="Not available" tone="bad" people={groups.no} empty="No one" />
      <Group title="No response" tone="muted" people={groups.pending} empty="Everyone has answered" />
    </View>
  );
}

function Group({
  title,
  tone,
  people,
  empty,
  onAssign,
  assignLabel,
}: {
  title: string;
  tone: Tone;
  people: StaffMember[];
  empty: string;
  onAssign?: (staffId: string) => void;
  assignLabel?: (person: StaffMember) => string;
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
      ) : (
        people.map((person) => (
          <View key={person.id} style={styles.personRow}>
            <ThemedText style={styles.grow}>{person.short}</ThemedText>
            <ContactButtons person={person} size="sm" />
            {onAssign ? (
              <Button
                label="Assign"
                tone="success"
                variant="soft"
                size="sm"
                accessibilityLabel={assignLabel?.(person)}
                onPress={() => onAssign(person.id)}
              />
            ) : null}
          </View>
        ))
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
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingVertical: 3,
  },
  grow: {
    flex: 1,
  },
});
