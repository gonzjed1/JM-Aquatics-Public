import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { StaffMember } from '@/data/mock-seed';

const CALL = '#27AE60';
const MESSAGE = '#2F6FB2';

/**
 * Call + message for one person — the pair that sits beside a name anywhere an
 * employee shows up on an owner/admin screen. Call hands off to the phone app;
 * message jumps to the Messages tab with that person's thread open.
 */
export function ContactButtons({ person, size = 'md' }: { person: StaffMember; size?: 'md' | 'sm' }) {
  const router = useRouter();
  const dim = size === 'sm' ? 30 : 34;
  const icon = size === 'sm' ? 16 : 18;

  const call = () => {
    const digits = person.phone.replace(/[^\d+]/g, '');
    if (digits) Linking.openURL(`tel:${digits}`);
  };
  const message = () => {
    // A fresh stamp each time so landing on the same person twice still reopens the thread.
    router.push({ pathname: '/messages', params: { dm: person.id, t: String(Date.now()) } });
  };

  return (
    <View style={styles.pair}>
      <Pressable
        onPress={call}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Call ${person.short}`}
        style={({ pressed }) => [styles.button, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: `${CALL}1F` }, pressed && styles.pressed]}>
        <IconSymbol name="phone.fill" size={icon} color={CALL} />
      </Pressable>
      <Pressable
        onPress={message}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Message ${person.short}`}
        style={({ pressed }) => [styles.button, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: `${MESSAGE}1F` }, pressed && styles.pressed]}>
        <IconSymbol name="message.fill" size={icon} color={MESSAGE} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
