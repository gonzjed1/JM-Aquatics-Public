import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { useAppData } from '@/contexts/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Jed's roster. Adding someone is real (they appear in Schedule → Staff and the lookup). */
export default function StaffScreen() {
  const router = useRouter();
  const { staff, addStaff } = useAppData();
  const textColor = useThemeColor({}, 'text');

  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const workers = staff.filter((s) => s.role === 'worker').sort((a, b) => a.name.localeCompare(b.name));
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? workers.filter((w) => w.name.toLowerCase().includes(needle) || w.phone.includes(needle))
    : workers;

  const canAdd = name.trim().length > 1;
  const submit = () => {
    const cleanName = name.trim();
    addStaff({ name: cleanName, phone: phone.trim() || '(301) 555-0000' });
    setNote(`Added ${cleanName} as an instructor.`);
    setName('');
    setPhone('');
    setAdding(false);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={<ScreenHeader title="Staff Management" subtitle={`${workers.length} instructors`} />}
      onBack={() => router.back()}
      headerRight={
        <Button
          label={adding ? 'Cancel' : '+ Add'}
          tone={adding ? 'navy' : 'success'}
          size="sm"
          onPress={() => setAdding((v) => !v)}
        />
      }>
      {adding ? (
        <Card style={styles.form}>
          <ThemedText type="subtitle">New team member</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#7B8B98"
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Full name"
            style={[styles.input, { color: textColor }]}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            placeholderTextColor="#7B8B98"
            keyboardType="phone-pad"
            accessibilityLabel="Phone"
            style={[styles.input, { color: textColor }]}
          />
          <Button label="Add to team" tone="success" disabled={!canAdd} onPress={submit} />
          <ThemedText style={styles.hint}>New members start as instructors at the standard rate.</ThemedText>
        </Card>
      ) : null}

      {note ? <ThemedText style={styles.note}>{note}</ThemedText> : null}

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search staff"
        placeholderTextColor="#7B8B98"
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Search staff"
        style={[styles.input, { color: textColor }]}
      />

      <Card style={styles.list}>
        {shown.length === 0 ? (
          <ThemedText style={styles.muted}>No one matches that.</ThemedText>
        ) : (
          shown.map((person, i) => (
            <View key={person.id} style={i < shown.length - 1 && styles.divider}>
              <ListRow
                icon="person.fill"
                title={person.name}
                subtitle={`${person.phone} · ${person.email}`}
                right={
                  <View style={styles.pill}>
                    <ThemedText style={styles.pillText}>Instructor</ThemedText>
                  </View>
                }
              />
            </View>
          ))
        )}
      </Card>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 10,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },
  note: {
    color: '#27AE60',
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    gap: 0,
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
  muted: {
    opacity: 0.65,
    paddingVertical: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(47, 111, 178, 0.14)',
  },
  pillText: {
    color: '#2F6FB2',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
