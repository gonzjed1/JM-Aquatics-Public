import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { KeyValue } from '@/components/ui/key-value';
import { ROLE_LABEL, can } from '@/constants/permissions';
import { useAppData, useMe } from '@/contexts/app-data';
import { useAuth } from '@/contexts/auth-context';
import { addDays, formatCurrency } from '@/data/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const me = useMe();
  const { weekStart, shiftsFor } = useAppData();

  if (!me || !role) return null;

  const weekEnd = addDays(weekStart, 6);
  const thisWeek = shiftsFor(me.id).filter((s) => s.date >= weekStart && s.date <= weekEnd);
  const locations = [...new Set(thisWeek.map((s) => s.location))];
  const title = role === 'worker' ? 'Swim Instructor' : ROLE_LABEL[role];
  // Own rate only — and owner/admin are salaried in the mock, so they see a dash.
  const rate =
    can(role, 'viewOwnPay') && me.hourlyRate > 0 ? `${formatCurrency(me.hourlyRate)} / hr` : '—';

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title={me.name} subtitle={title} />}
      onBack={() => router.back()}>
      <Card>
        <ThemedText type="defaultSemiBold">Contact</ThemedText>
        <KeyValue label="Phone" value={me.phone} />
        <KeyValue label="Email" value={me.email} last />
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Work</ThemedText>
        <KeyValue label="Role" value={title} />
        <KeyValue label="Hourly rate" value={rate} />
        <KeyValue label="Shifts this week" value={String(thisWeek.length)} />
        <KeyValue label="Locations" value={locations.length ? locations.join(', ') : '—'} last />
      </Card>

      <ThemedText style={styles.note}>
        Changes to your details go through Jed until accounts are connected.
      </ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },
});
