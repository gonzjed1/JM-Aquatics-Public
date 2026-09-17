import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { can } from '@/constants/permissions';
import { useAppData } from '@/contexts/app-data';
import { useAuth } from '@/contexts/auth-context';
import { useBack } from '@/hooks/use-back';

/**
 * Preferences are local state for now — they reset on reload. Persisting them
 * (per user, server-side) comes with the backend.
 */
export default function SettingsScreen() {
  const back = useBack();
  const router = useRouter();
  const { role } = useAuth();
  const { locations } = useAppData();

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Settings" />}
      onBack={back}>
      <Card style={styles.linkCard}>
        <ListRow
          icon="bell.fill"
          title="Notifications"
          subtitle="Shifts, messages, updates"
          chevron
          onPress={() => router.push({ pathname: '/more/notifications', params: { from: 'settings' } })}
        />
      </Card>

      {can(role, 'manageSchedule') ? (
        <Card>
          <ThemedText type="defaultSemiBold">Locations</ThemedText>
          <ThemedText style={styles.note}>{"Every location in use — new ones are added from the shift form."}</ThemedText>
          {locations.map((loc) => (
            <ListRow key={loc} icon="mappin.and.ellipse" title={loc} />
          ))}
        </Card>
      ) : null}

      {can(role, 'editPayRules') ? (
        <Card>
          <ThemedText type="defaultSemiBold">Pay rules</ThemedText>
          <Line label="Pay period" value="Semi-monthly (1st–15th, 16th–end)" />
          <Line label="Overtime" value="1.5× after 40h / week" />
          <Line label="Rounding" value="To the minute" last />
          <ThemedText style={styles.note}>
            Not yet confirmed with J&M — every pay figure in the app is an estimate until these are.
          </ThemedText>
        </Card>
      ) : null}

      <ThemedText style={styles.note}>{"Preferences aren't saved yet; they reset when the app reloads."}</ThemedText>
    </ParallaxScrollView>
  );
}

function Line({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.line, !last && styles.divider]}>
      <ThemedText style={styles.muted}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  linkCard: {
    paddingVertical: 2,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  muted: {
    opacity: 0.65,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },
});
