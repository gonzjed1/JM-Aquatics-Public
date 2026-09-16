import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { AssignedPeople } from '@/components/schedule/assigned-people';
import { ShiftResponses } from '@/components/schedule/shift-responses';
import { ShiftRow } from '@/components/schedule/shift-row';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { byStart, useAppData } from '@/contexts/app-data';
import { isOpen } from '@/data/shifts';

/**
 * The availability board: every upcoming shift that still has room, with who
 * has said ✓ / ✗ / nothing and an Assign button. Home's "Open Shifts" tile and
 * the unfilled-shift banner land here; `?shift=` puts that one at the top.
 */
export default function OpenShiftsScreen() {
  const router = useRouter();
  const { shift: focusId } = useLocalSearchParams<{ shift?: string }>();
  const { today, shifts } = useAppData();

  const open = shifts.filter((s) => s.date >= today && isOpen(s)).sort(byStart);
  const focus = focusId ? shifts.find((s) => s.id === focusId) : undefined;
  // A focused shift that has since filled still shows, so the tap that brought
  // someone here doesn't land on nothing.
  const list = focus ? [focus, ...open.filter((s) => s.id !== focus.id)] : open;

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title="Availability"
          subtitle={open.length === 1 ? '1 open shift' : `${open.length} open shifts`}
        />
      }
      onBack={() => router.back()}>
      {list.length === 0 ? (
        <Card>
          <ThemedText style={styles.muted}>Every upcoming shift is filled.</ThemedText>
        </Card>
      ) : (
        list.map((shift) => {
          const focused = shift.id === focus?.id;
          return (
            <Card key={shift.id} style={[styles.card, focused && styles.focused]}>
              <ShiftRow shift={shift} showFill last />
              <ThemedText style={styles.rosterTitle}>On it</ThemedText>
              <AssignedPeople shift={shift} />
              {isOpen(shift) ? (
                <ShiftResponses shift={shift} canAssign />
              ) : (
                <ThemedText style={[styles.muted, styles.filled]}>This shift is now filled.</ThemedText>
              )}
            </Card>
          );
        })
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    paddingVertical: 8,
  },
  focused: {
    borderColor: '#E5484D',
    borderWidth: 1.5,
  },
  rosterTitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    paddingLeft: 4,
  },
  muted: {
    opacity: 0.65,
  },
  filled: {
    paddingVertical: 8,
  },
});
