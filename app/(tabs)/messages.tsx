import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Segmented } from '@/components/ui/segmented';
import { ROLE_LABEL } from '@/constants/permissions';
import { useAppData, useMe } from '@/contexts/app-data';
import { formatMonthDay, formatWallClock, toISODate } from '@/data/format';
import type { Conversation } from '@/data/mock-seed';
import { useThemeColor } from '@/hooks/use-theme-color';

type View_ = 'direct' | 'groups';

/**
 * Messages: find a person (search at the top, or New Message in the header),
 * or pick up a thread. Sending is still the layout only — real messaging is a
 * later phase (a managed service, likely Stream) — but threads open for real.
 */
export default function MessagesScreen() {
  const me = useMe();
  const { conversations, staff, staffById, today, openDm } = useAppData();
  const textColor = useThemeColor({}, 'text');
  const [view, setView] = useState<View_>('direct');
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // New Message shows the whole roster under the search box until a thread is picked.
  const [picking, setPicking] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const meId = me?.id ?? '';

  const openThreadWith = (staffId: string) => {
    setView('direct');
    setOpenId(openDm(meId, staffId));
    setQuery('');
    setPicking(false);
  };

  if (!me) return null;

  const needle = query.trim().toLowerCase();
  const people = staff
    .filter((p) => p.id !== me.id)
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.phone.includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name));
  const showPeople = picking || needle.length > 0;

  // Empty threads (just opened from a contact button) sort first, like a fresh draft.
  const lastOf = (c: Conversation) => c.messages[c.messages.length - 1] as Conversation['messages'][number] | undefined;
  const lastAt = (c: Conversation) => lastOf(c)?.at ?? '9999';
  const mine = conversations
    .filter((c) => c.participants.includes(me.id) && c.group === (view === 'groups'))
    .sort((a, b) => lastAt(b).localeCompare(lastAt(a)));

  const firstName = (id: string) => staffById(id)?.short.split(' ')[0] ?? id;
  const titleOf = (c: Conversation) =>
    c.group ? c.name : (staffById(c.participants.find((p) => p !== me.id) ?? '')?.short ?? 'Unknown');
  const previewOf = (c: Conversation) => {
    const last = lastOf(c);
    if (!last) return 'No messages yet';
    return c.group ? `${firstName(last.from)}: ${last.text}` : last.text;
  };
  const when = (iso: string) => {
    const d = new Date(iso);
    return toISODate(d) === today ? formatWallClock(d) : formatMonthDay(toISODate(d));
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Messages" subtitle="Sending arrives in a later phase" />}>
      <View style={styles.intro}>
        <Button
          label="New Message"
          tone="success"
          onPress={() => {
            setPicking(true);
            searchRef.current?.focus();
          }}
        />
        <ThemedText style={styles.introNote}>Send a message or call any employee here.</ThemedText>
      </View>

      <View style={styles.searchWrap}>
        <IconSymbol name="magnifyingglass" size={20} color="#7B8B98" />
        <TextInput
          ref={searchRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          placeholderTextColor="#7B8B98"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Search people"
          style={[styles.search, { color: textColor }]}
        />
        {showPeople ? (
          <Pressable
            onPress={() => {
              setQuery('');
              setPicking(false);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close search">
            <IconSymbol name="xmark" size={20} color="#7B8B98" />
          </Pressable>
        ) : null}
      </View>

      {showPeople ? (
        <Card style={styles.list}>
          {people.length === 0 ? (
            <ThemedText style={styles.muted}>No one matches that.</ThemedText>
          ) : (
            people.map((person, i) => (
              <View key={person.id} style={[styles.personRow, i < people.length - 1 && styles.divider]}>
                <Pressable
                  onPress={() => openThreadWith(person.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open thread with ${person.short}`}
                  style={({ pressed }) => [styles.personMain, pressed && styles.pressed]}>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>{person.name[0]}</ThemedText>
                  </View>
                  <View style={styles.text}>
                    <ThemedText type="defaultSemiBold">{person.name}</ThemedText>
                    <ThemedText style={styles.preview}>
                      {person.role === 'worker' ? 'Instructor' : ROLE_LABEL[person.role]} · {person.phone}
                    </ThemedText>
                  </View>
                </Pressable>
                <ContactButtons person={person} size="sm" />
              </View>
            ))
          )}
        </Card>
      ) : null}

      <Segmented
        options={[
          { value: 'direct', label: 'Direct' },
          { value: 'groups', label: 'Groups' },
        ]}
        value={view}
        onChange={(v) => {
          setView(v);
          setOpenId(null);
        }}
      />

      <Card style={styles.list}>
        {mine.length === 0 ? (
          <ThemedText style={styles.muted}>No conversations here yet.</ThemedText>
        ) : (
          mine.map((c, i) => {
            const open = openId === c.id;
            return (
              <View key={c.id} style={i < mine.length - 1 && styles.divider}>
                <Pressable
                  onPress={() => setOpenId(open ? null : c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <View style={[styles.avatar, c.group && styles.avatarGroup]}>
                    {c.group ? (
                      <IconSymbol name="person.2.fill" size={18} color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.avatarText}>{titleOf(c)[0]}</ThemedText>
                    )}
                  </View>
                  <View style={styles.text}>
                    <ThemedText type="defaultSemiBold">{titleOf(c)}</ThemedText>
                    <ThemedText style={styles.preview} numberOfLines={1}>
                      {previewOf(c)}
                    </ThemedText>
                  </View>
                  <View style={styles.meta}>
                    <ThemedText style={styles.time}>{lastOf(c) ? when(lastOf(c)!.at) : ''}</ThemedText>
                    {c.unread ? (
                      <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>{c.unread}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                {open ? (
                  <View style={styles.thread}>
                    {c.messages.length === 0 ? (
                      <ThemedText style={styles.threadNote}>Start of your conversation.</ThemedText>
                    ) : null}
                    {c.messages.map((m, j) => {
                      const fromMe = m.from === me.id;
                      return (
                        <View key={j} style={[styles.bubbleRow, fromMe && styles.bubbleRowMe]}>
                          <View style={[styles.bubble, fromMe && styles.bubbleMe]}>
                            {c.group && !fromMe ? (
                              <ThemedText style={styles.bubbleFrom}>{firstName(m.from)}</ThemedText>
                            ) : null}
                            <ThemedText style={fromMe && styles.bubbleTextMe}>{m.text}</ThemedText>
                            <ThemedText style={[styles.bubbleTime, fromMe && styles.bubbleTextMe]}>
                              {formatWallClock(new Date(m.at))}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                    <ThemedText style={styles.threadNote}>Sending and replies arrive with the messaging service.</ThemedText>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },
  intro: {
    gap: 8,
    marginTop: 4,
  },
  introNote: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  search: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  personMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2F6FB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGroup: {
    backgroundColor: '#E8930C',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#27AE60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  thread: {
    paddingBottom: 12,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(136, 136, 136, 0.15)',
    gap: 2,
  },
  bubbleMe: {
    backgroundColor: '#2F6FB2',
  },
  bubbleFrom: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
  threadNote: {
    fontSize: 12,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 4,
  },
});
