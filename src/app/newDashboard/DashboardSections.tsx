/* components/DashboardSections.tsx */
import { StudentSections } from './sections/StudentSections';
import { StaffSections } from './sections/StaffSections';
import { useUserInfo } from '@/hooks/useGetUserInfo';
import { Role } from '@/types/User';
import { DashboardCard } from '@/newcomponents/DashboardCard/DashboardCard';
import { NavbarItem } from '@/types/navigation';
export default function DashboardSections({
  role,
  navItems,
}: {
  role: Role;
  navItems: NavbarItem[];
}) {
  const [user] = useUserInfo();
  console.log(role);
  switch (role) {
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return (
        <div className="flex flex-wrap gap-6">
          {navItems.map(({ label, to, icon: Icon }: NavbarItem) => (
            <DashboardCard key={to} icon={Icon} label={label} to={to} />
          ))}
        </div>
      );

    case 'faculty':
    case 'admin':
      return (
        <div className="flex flex-wrap gap-6">
          {navItems.map(({ label, to, icon: Icon }: NavbarItem) => (
            <DashboardCard key={to} icon={Icon} label={label} to={to} />
          ))}
        </div>
      );

    default:
      return null; // or 404/unauthorised component
  }
}
