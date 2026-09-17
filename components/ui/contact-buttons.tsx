import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { StaffMember } from '@/data/mock-seed';

const CALL = '#27AE60';
const MESSAGE = '#2F6FB2';

/**
 * Call + message for one person — the pair that sits beside a name anywhere an
 * employee shows up on an owner/admin screen.
 *
 * Both buttons hand the conversation to the phone for now: `tel:` opens the
 * dialler, `sms:` opens the phone's messaging app with the number filled in.
 *
 * PHASE 3 — in-app messaging: the message button switches to opening that
 * person's DM thread inside the app and stops leaving it; the call button
 * stays as it is. Nothing sent through the phone's own messaging app can ever
 * be read back into this one (iOS gives no app access to SMS), which is why
 * in-app DMs are the real fix rather than a nicety.
 */
export function ContactButtons({ person, size = 'md' }: { person: StaffMember; size?: 'md' | 'sm' }) {
  const dim = size === 'sm' ? 30 : 34;
  const icon = size === 'sm' ? 16 : 18;

  const digits = person.phone.replace(/[^\d+]/g, '');
  const open = (url: string) => {
    if (digits) Linking.openURL(url);
  };

  return (
    <View style={styles.pair}>
      <Pressable
        onPress={() => open(`tel:${digits}`)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Call ${person.short}`}
        style={({ pressed }) => [styles.button, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: `${CALL}1F` }, pressed && styles.pressed]}>
        <IconSymbol name="phone.fill" size={icon} color={CALL} />
      </Pressable>
      <Pressable
        onPress={() => open(`sms:${digits}`)}
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
