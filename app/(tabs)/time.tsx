import { AdminTime } from '@/components/time/admin-time';
import { EmployeeTime } from '@/components/time/employee-time';
import { can } from '@/constants/permissions';
import { useAuth } from '@/contexts/auth-context';

/** Anyone who can see everyone's hours gets the live board; everyone else gets their own clock. */
export default function TimeScreen() {
  const { role } = useAuth();
  return can(role, 'viewAllHours') ? <AdminTime /> : <EmployeeTime />;
}
