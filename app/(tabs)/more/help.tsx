import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { useAppData } from '@/contexts/app-data';

const FAQ = [
  {
    q: 'I forgot to clock out.',
    a: 'Ask Jed for a punch correction — it shows up in his approval queue and your hours update once approved.',
  },
  {
    q: 'Can I swap a shift?',
    a: 'Yes. Swaps need approval so the location stays covered. Send the request and check back on Home.',
  },
  {
    q: 'Why does my pay say "estimate"?',
    a: 'The app totals your punches at your hourly rate. Final pay comes from payroll and can differ slightly.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { staffById } = useAppData();
  const jed = staffById('jed');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Help & Support" />}
      onBack={() => router.back()}>
      <Card>
        <ThemedText type="defaultSemiBold">Contact</ThemedText>
        <ListRow icon="person.fill" title={jed?.name ?? 'Jed'} subtitle="Owner · J&M Aquatics" />
        <ListRow icon="message.fill" title={jed?.phone ?? ''} subtitle="Call or text" />
        <ListRow icon="doc.text.fill" title={jed?.email ?? ''} subtitle="Email" />
      </Card>

      <Card>
        <ThemedText type="defaultSemiBold">Common questions</ThemedText>
        {FAQ.map((item, i) => (
          <ThemedText key={i} style={[styles.faq, i < FAQ.length - 1 && styles.divider]}>
            <ThemedText type="defaultSemiBold">{item.q}</ThemedText>
            {'\n'}
            {item.a}
          </ThemedText>
        ))}
      </Card>

      <ThemedText style={styles.about}>J&M Scheduling · version {version}</ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  faq: {
    paddingVertical: 10,
    lineHeight: 22,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  about: {
    fontSize: 13,
    opacity: 0.55,
    textAlign: 'center',
  },
});
