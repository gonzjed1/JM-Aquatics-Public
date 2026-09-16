import { CommonActions, type NavigationState, type PartialState } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { can } from '@/constants/permissions';
import { Colors } from '@/constants/theme';
import { useAppData, useMe } from '@/contexts/app-data';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { role } = useAuth();
  const me = useMe();
  const { conversations, pendingRequests, pendingOffers, unreadNotificationsFor } = useAppData();

  const unread = me
    ? conversations
        .filter((c) => c.participants.includes(me.id))
        .reduce((total, c) => total + c.unread, 0)
    : 0;
  const awaitingApproval = can(role, 'approveRequests') ? pendingRequests.length + pendingOffers.length : 0;
  // Workers get a count of shift postings they haven't seen; Home clears it.
  const newPostings = me && role === 'worker' ? unreadNotificationsFor(me.id).length : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        // On web the header Back is browser history, so leaving a tab while its
        // nested stack is deep would otherwise leave that screen "stuck" on the
        // tab. Reset the stack whenever a tab loses focus.
        popToTopOnBlur: true,
      }}>
      <Tabs.Screen
        name="index"
        // Home pushes More screens directly (tiles, banner, View All Activity).
        // On web that lands the pushed screen at the *bottom* of More's stack
        // and, when Home is returned to through browser history or navigate,
        // the stack is left as is: the next push stacks on the stale screen
        // and a later menu tap into the same screen reuses its old params. So
        // whenever More is not the focused tab and its stack isn't a bare
        // menu, drop the nested state — it re-initialises at the menu.
        listeners={({ navigation }) => ({
          state: () => {
            const state = navigation.getState() as NavigationState;
            if (state.routes[state.index]?.name === 'more') return;
            const more = state.routes.find((r) => r.name === 'more');
            const nested = more?.state as NavigationState | PartialState<NavigationState> | undefined;
            const routes = nested?.routes ?? [];
            if (routes.length > 1 || (routes.length === 1 && routes[0].name !== 'index')) {
              navigation.dispatch(
                CommonActions.reset({
                  ...state,
                  routes: state.routes.map((r) => (r.name === 'more' ? { key: r.key, name: r.name } : r)),
                })
              );
            }
          },
        })}
        options={{
          title: 'Home',
          tabBarBadge: newPostings || undefined,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="time"
        options={{
          title: 'Time',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unread || undefined,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        // Pressing More always lands on the menu. On web a header Back is
        // browser history, which rebuilds state from the URL without blurring
        // this tab — so a pushed screen (Activity, Settings) would otherwise be
        // left sitting on it, with no way to reach the menu.
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('more', { screen: 'index' });
          },
        })}
        options={{
          title: 'More',
          tabBarBadge: awaitingApproval || undefined,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="line.3.horizontal" color={color} />
          ),
        }}
      />
      {/* Step-1 leftover: its content now lives in More → My Hours. Kept off the bar. */}
      <Tabs.Screen name="timesheet" options={{ href: null }} />
    </Tabs>
  );
}
