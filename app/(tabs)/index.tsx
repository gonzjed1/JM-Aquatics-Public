import { AdminHome } from '@/components/home/admin-home';
import { EmployeeHome } from '@/components/home/employee-home';
import { can } from '@/constants/permissions';
import { useAuth } from '@/contexts/auth-context';

/** Anyone who can see everyone's hours gets the management dashboard; workers get their own. */
export default function HomeScreen() {
  const { role } = useAuth();
  return can(role, 'viewAllHours') ? <AdminHome /> : <EmployeeHome />;
}
