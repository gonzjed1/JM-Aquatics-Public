import { AdminSchedule } from '@/components/schedule/admin-schedule';
import { EmployeeSchedule } from '@/components/schedule/employee-schedule';
import { can } from '@/constants/permissions';
import { useAuth } from '@/contexts/auth-context';

/** Schedulers see the whole roster; everyone else sees their own shifts. */
export default function ScheduleScreen() {
  const { role } = useAuth();
  return can(role, 'manageSchedule') ? <AdminSchedule /> : <EmployeeSchedule />;
}
