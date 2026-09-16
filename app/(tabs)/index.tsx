import { AdminHome } from '@/components/home/admin-home';
import { EmployeeHome } from '@/components/home/employee-home';
import { useAuth } from '@/contexts/auth-context';

/** Home shows a different dashboard per role; both live in components/home. */
export default function HomeScreen() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminHome /> : <EmployeeHome />;
}
