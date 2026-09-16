import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Segmented } from '@/components/ui/segmented';
import { useAppData, useMe } from '@/contexts/app-data';
import { formatMonthDay, formatWallClock, toISODate } from '@/data/format';
import type { Conversation } from '@/data/mock-seed';

type View_ = 'direct' | 'groups';

/**
 * Messages is a read-only preview of the layout. Real messaging is a later
 * phase (a managed service, likely Stream) — per AGENTS.md this is shell only.
 */
export default function MessagesScreen() {
  const me = useMe();
  const { conversations, staffById, today, openDm } = useAppData();
  const [view, setView] = useState<View_>('direct');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const meId = me?.id ?? '';

  // A "message" button elsewhere lands here with ?dm=<staffId>; open that thread straight away.
  const { dm, t } = useLocalSearchParams<{ dm?: string; t?: string }>();
  useEffect(() => {
    if (!dm || !meId) return;
    setView('direct');
    setOpenId(openDm(meId, dm));
    // `t` changes on every press so the same person can be opened twice in a row.
  }, [dm, t, meId, openDm]);

  if (!me) return null;

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
      headerImage={<ScreenHeader title="Messages" subtitle="Preview — messaging arrives in a later phase" />}
      headerRight={
        <HeaderIconButton name="square.and.pencil" label="New message" onPress={() => setNotice(true)} />
      }>
      {notice ? (
        <Card style={styles.notice}>
          <ThemedText type="defaultSemiBold">Coming in a later phase</ThemedText>
          <ThemedText style={styles.muted}>
            This tab shows the layout only. Sending and receiving arrives with the messaging service.
          </ThemedText>
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
                    <ThemedText style={styles.threadNote}>Replies arrive with the messaging service.</ThemedText>
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
  notice: {
    borderColor: '#2F6FB2',
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
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
