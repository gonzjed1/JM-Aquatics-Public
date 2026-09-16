import { Stack } from 'expo-router';

import { can } from '@/constants/permissions';
import { useAuth } from '@/contexts/auth-context';

/** Landing on a deep link like /more/pay still gets a back stack to the menu. */
export const unstable_settings = {
  initialRouteName: 'index',
};

/**
 * A stack nested inside the More tab, so detail screens push over the menu
 * while the tab bar stays put. Admin-only screens sit behind capability guards
 * here as well as being hidden from the menu — hiding a row is not a gate.
 */
export default function MoreLayout() {
  const { role } = useAuth();

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="profile" />

      {/* Own-data screens: only the worker demo user has a pay record to show. */}
      <Stack.Protected guard={role === 'worker'}>
        <Stack.Screen name="pay" />
        <Stack.Screen name="hours" />
        <Stack.Screen name="availability" />
      </Stack.Protected>

      <Stack.Protected guard={can(role, 'viewAllHours')}>
        <Stack.Screen name="activity" />
        <Stack.Screen name="reports" />
      </Stack.Protected>

      {/* Other people's pay and company totals — Jed only. */}
      <Stack.Protected guard={can(role, 'viewPayroll')}>
        <Stack.Screen name="payroll" />
        <Stack.Screen name="breakdown" />
      </Stack.Protected>

      <Stack.Protected guard={can(role, 'manageStaff')}>
        <Stack.Screen name="staff" />
      </Stack.Protected>

      <Stack.Protected guard={can(role, 'approveRequests')}>
        <Stack.Screen name="approvals" />
      </Stack.Protected>
    </Stack>
  );
}
