import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { useAppData } from '@/contexts/app-data';
import type { Shift } from '@/data/mock-seed';
import { openSlots } from '@/data/shifts';

/**
 * Who is on a shift, one per line with call / message, and a red line for any
 * slot still unfilled. The admin's view of a shift's roster (Home, Day view).
 */
export function AssignedPeople({ shift }: { shift: Shift }) {
  const { staffById } = useAppData();
  const open = openSlots(shift);
  const people = shift.assigned.map((id) => staffById(id)).filter((p) => p !== undefined);

  return (
    <View style={styles.list}>
      {people.length === 0 ? <ThemedText style={styles.muted}>Nobody assigned yet</ThemedText> : null}
      {people.map((person) => (
        <View key={person.id} style={styles.row}>
          <ThemedText style={styles.grow}>{person.short}</ThemedText>
          <ContactButtons person={person} size="sm" />
        </View>
      ))}
      {open > 0 ? (
        <View style={styles.openPill}>
          <ThemedText style={styles.openText}>
            {open === 1 ? '1 slot unfilled' : `${open} slots unfilled`}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  grow: {
    flex: 1,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.55,
  },
  openPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#E5484D1F',
  },
  openText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#C0392B',
  },
});
