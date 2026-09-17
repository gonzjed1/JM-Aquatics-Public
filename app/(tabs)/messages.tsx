import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { ContactButtons } from '@/components/ui/contact-buttons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Segmented } from '@/components/ui/segmented';
import { ROLE_LABEL } from '@/constants/permissions';
import { useAppData, useMe } from '@/contexts/app-data';
import { formatMonthDay, formatWallClock, toISODate } from '@/data/format';
import type { Conversation } from '@/data/mock-seed';
import { useThemeColor } from '@/hooks/use-theme-color';

type View_ = 'direct' | 'groups';

/** Nudges the count along: nobody picked, one short, or ready to go. */
function memberNote(count: number): string {
  if (count === 0) return 'Tap everyone who should be in it.';
  if (count === 1) return '1 person selected — pick at least one more.';
  return `${count} people selected.`;
}

/**
 * Messages: find a person (search at the top, or New Message in the header),
 * or pick up a thread. Sending is still the layout only — real messaging is a
 * later phase (a managed service, likely Stream) — but threads open for real.
 */
export default function MessagesScreen() {
  const me = useMe();
  const { conversations, staff, staffById, today, openDm, createGroup, renameConversation, deleteConversation } =
    useAppData();
  const textColor = useThemeColor({}, 'text');
  const [view, setView] = useState<View_>('direct');
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // The roster sits under the search box while picking: 'dm' opens a thread
  // with whoever is tapped, 'group' collects them instead.
  const [picking, setPicking] = useState<'dm' | 'group' | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const searchRef = useRef<TextInput>(null);
  const meId = me?.id ?? '';

  const stopPicking = () => {
    setPicking(null);
    setSelected([]);
    setGroupName('');
    setQuery('');
  };

  const openThreadWith = (staffId: string) => {
    setView('direct');
    setOpenId(openDm(meId, staffId));
    stopPicking();
  };

  const toggleMember = (staffId: string) =>
    setSelected((prev) => (prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]));

  const startGroup = () => {
    const id = createGroup(meId, selected, groupName);
    stopPicking();
    setView('groups');
    setOpenId(id);
  };

  if (!me) return null;

  const needle = query.trim().toLowerCase();
  const people = staff
    .filter((p) => p.id !== me.id)
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.phone.includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name));
  const showPeople = picking !== null || needle.length > 0;
  const canStartGroup = groupName.trim().length > 0 && selected.length >= 2;

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
        <View style={styles.introButtons}>
          <Button
            label="New Message"
            tone="success"
            onPress={() => {
              setSelected([]);
              setPicking('dm');
              searchRef.current?.focus();
            }}
            style={styles.grow}
          />
          <Button
            label="New Group"
            tone="navy"
            onPress={() => {
              setSelected([]);
              setPicking('group');
              searchRef.current?.focus();
            }}
            style={styles.grow}
          />
        </View>
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
            onPress={stopPicking}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close search">
            <IconSymbol name="xmark" size={20} color="#7B8B98" />
          </Pressable>
        ) : null}
      </View>

      {picking === 'group' ? (
        <Card>
          <ThemedText type="defaultSemiBold">New group</ThemedText>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Group name"
            placeholderTextColor="#7B8B98"
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Group name"
            style={[styles.groupInput, { color: textColor }]}
          />
          <ThemedText style={styles.introNote}>{memberNote(selected.length)}</ThemedText>
          <Button
            label="Create group"
            tone="success"
            disabled={!canStartGroup}
            onPress={startGroup}
            style={styles.groupSubmit}
          />
        </Card>
      ) : null}

      {showPeople ? (
        <Card style={styles.list}>
          {people.length === 0 ? (
            <ThemedText style={styles.muted}>No one matches that.</ThemedText>
          ) : (
            people.map((person, i) => {
              const inGroup = picking === 'group';
              const on = selected.includes(person.id);
              return (
                <View key={person.id} style={[styles.personRow, i < people.length - 1 && styles.divider]}>
                <Pressable
                  onPress={() => (inGroup ? toggleMember(person.id) : openThreadWith(person.id))}
                  accessibilityRole={inGroup ? 'checkbox' : 'button'}
                  accessibilityState={inGroup ? { checked: on } : undefined}
                  accessibilityLabel={
                    inGroup ? `Add ${person.short} to the group` : `Open thread with ${person.short}`
                  }
                  style={({ pressed }) => [styles.personMain, pressed && styles.pressed]}>
                  {inGroup ? (
                    <View style={[styles.check, on && styles.checkOn]}>
                      {on ? <IconSymbol name="checkmark" size={14} color="#FFFFFF" /> : null}
                    </View>
                  ) : null}
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
              );
            })
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
                    {c.group ? (
                      renamingId === c.id ? (
                        <View style={styles.renameRow}>
                          <TextInput
                            value={renameText}
                            onChangeText={setRenameText}
                            placeholder="Group name"
                            placeholderTextColor="#7B8B98"
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoFocus
                            accessibilityLabel="New group name"
                            style={[styles.groupInput, styles.grow, { color: textColor }]}
                          />
                          <Button
                            label="Save"
                            tone="success"
                            size="sm"
                            onPress={() => {
                              renameConversation(c.id, renameText);
                              setRenamingId(null);
                            }}
                          />
                        </View>
                      ) : (
                        <Button
                          label="Rename group"
                          tone="navy"
                          variant="soft"
                          size="sm"
                          accessibilityLabel={`Rename ${titleOf(c)}`}
                          onPress={() => {
                            setRenameText(c.name);
                            setRenamingId(c.id);
                          }}
                        />
                      )
                    ) : null}
                    <ConfirmButton
                      label="Delete conversation"
                      armedLabel="Tap again to delete"
                      tone="danger"
                      variant="outline"
                      size="sm"
                      accessibilityLabel={`Delete conversation ${titleOf(c)}`}
                      onConfirm={() => {
                        setOpenId(null);
                        deleteConversation(c.id);
                      }}
                    />
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
  introButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
  groupInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 8,
  },
  groupSubmit: {
    marginTop: 10,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
