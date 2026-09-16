import { useRouter, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HEADER_BG, ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListRow } from '@/components/ui/list-row';
import { ROLE_LABEL, can } from '@/constants/permissions';
import { useAppData, useMe } from '@/contexts/app-data';
import { useAuth } from '@/contexts/auth-context';

type IconName = ComponentProps<typeof IconSymbol>['name'];

type MenuRow = {
  key: string;
  icon: IconName;
  tint?: string;
  title: string;
  subtitle?: string;
  href: Href;
  badge?: number;
};

export default function MoreScreen() {
  const router = useRouter();
  const { role, signOut } = useAuth();
  const me = useMe();
  const { pendingRequests, pendingOffers } = useAppData();

  // Rows are gated by capability, and the routes behind them are gated again
  // in more/_layout.tsx — a hidden row is never the only thing in the way.
  const rows: MenuRow[] = [];

  if (can(role, 'manageStaff')) {
    rows.push({ key: 'staff', icon: 'person.2.fill', title: 'Staff Management', subtitle: can(role, 'assignRoles') ? 'Add, edit, assign roles' : 'Add and edit instructors', href: '/more/staff' });
  }
  if (can(role, 'viewPayroll')) {
    rows.push({ key: 'payroll', icon: 'dollarsign.circle.fill', tint: '#27AE60', title: 'Payroll', subtitle: 'View pay, totals & export', href: '/more/payroll' });
  }
  if (can(role, 'viewAllHours')) {
    rows.push({ key: 'reports', icon: 'chart.bar.fill', title: 'Reports', subtitle: can(role, 'viewPayroll') ? 'Hours, attendance, labor' : 'Hours, attendance', href: '/more/reports' });
  }
  if (can(role, 'approveRequests')) {
    rows.push({ key: 'approvals', icon: 'bell.fill', tint: '#E8930C', title: 'Approval Queue', subtitle: 'Requests and shift offers', href: '/more/approvals', badge: pendingRequests.length + pendingOffers.length });
  }

  if (role === 'worker') {
    rows.push(
      { key: 'profile', icon: 'person.crop.circle.fill', title: 'My Profile', subtitle: 'View your info', href: '/more/profile' },
      { key: 'availability', icon: 'calendar.badge.checkmark', tint: '#E5484D', title: 'Availability', subtitle: 'Respond to open shifts', href: '/more/availability' },
      { key: 'hours', icon: 'clock.arrow.circlepath', title: 'My Hours', subtitle: 'View your hours worked', href: '/more/hours' },
      { key: 'pay', icon: 'dollarsign.circle.fill', tint: '#27AE60', title: 'My Pay', subtitle: 'View your pay (estimates)', href: '/more/pay' }
    );
  }

  const settingsSubtitle = can(role, 'editPayRules')
    ? 'Locations, pay rules, notifications'
    : can(role, 'manageSchedule')
      ? 'Locations, notifications'
      : 'Notifications, preferences';

  rows.push(
    { key: 'settings', icon: 'gearshape.fill', tint: '#687076', title: 'Settings', subtitle: settingsSubtitle, href: '/more/settings' },
    { key: 'help', icon: 'questionmark.circle.fill', title: 'Help & Support', href: '/more/help' }
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BG}
      headerImage={
        <ScreenHeader
          title="More"
          subtitle={me && role ? `${me.name} · ${ROLE_LABEL[role]}` : undefined}
        />
      }>
      <Card style={styles.menu}>
        {rows.map((row, i) => (
          <View key={row.key} style={i < rows.length - 1 && styles.divider}>
            <ListRow
              icon={row.icon}
              tint={row.tint}
              title={row.title}
              subtitle={row.subtitle}
              badge={row.badge}
              chevron
              onPress={() => router.push(row.href)}
            />
          </View>
        ))}
      </Card>

      <Button label="Sign Out" tone="danger" variant="outline" onPress={signOut} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  menu: {
    gap: 0,
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#888',
  },
});
