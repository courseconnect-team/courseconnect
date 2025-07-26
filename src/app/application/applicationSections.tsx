/* components/DashboardSections.tsx */

import { useUserInfo } from '@/hooks/useGetUserInfo';
import { Role } from '@/types/User';
import { DashboardCard } from '@/newcomponents/DashboardCard/DashboardCard';
import { NavbarItem } from '@/types/navigation';
export default function ApplicationSections({
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
        <>
          <div className="mb-5">
            <h1 className="text-h2">TA/UPI/Grader</h1>
            <div className="flex flex-wrap gap-6">
              {navItems
                .filter((item) => item.type === 'ta')
                .map(({ label, to, icon: Icon }: NavbarItem) => (
                  <DashboardCard key={to} icon={Icon} label={label} to={to} />
                ))}
            </div>
          </div>
          <div>
            <h1 className="text-h6">Research</h1>
            <p className="text-sm">No available applications at this time.</p>
          </div>
        </>
      );

    case 'faculty':
    case 'admin':
      return (
        <div>
          {navItems.map(({ label, to, icon: Icon }: NavbarItem) => (
            <DashboardCard key={to} icon={Icon} label={label} to={to} />
          ))}
        </div>
      );

    default:
      return null; // or 404/unauthorised component
  }
}
