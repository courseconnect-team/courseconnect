'use client';

import { FC, useMemo } from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import SideNav from '@/components/SideNavBar/SideNavBar';
import TopNav from '@/components/TopBar/TopBar';
import { NavbarItem } from '@/types/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface PageLayoutProps {
  mainTitle?: string;
  navItems: NavbarItem[];
  children?: React.ReactNode;
}

const DEPARTMENTS_NAV: NavbarItem = {
  label: 'Departments',
  to: '/admin/departments',
  icon: AccountTreeOutlinedIcon,
};

const PageLayout: FC<PageLayoutProps> = ({ mainTitle, navItems, children }) => {
  // Every admin page passes getNavItems(role) as navItems — that list has no
  // super-admin awareness. Append the Departments entry here so every page
  // using PageLayout gains the super-admin tab for free, without having to
  // migrate each call site to getNavItemsForUser.
  const { user } = useCurrentUser();
  const withSuperAdmin = useMemo(() => {
    if (!user.superAdmin) return navItems;
    if (navItems.some((i) => i.to === DEPARTMENTS_NAV.to)) return navItems;
    const helpIdx = navItems.findIndex((i) => i.label === 'Help');
    if (helpIdx >= 0) {
      return [
        ...navItems.slice(0, helpIdx),
        DEPARTMENTS_NAV,
        ...navItems.slice(helpIdx),
      ];
    }
    return [...navItems, DEPARTMENTS_NAV];
  }, [navItems, user.superAdmin]);

  return (
    <div className="flex h-screen">
      <SideNav navItems={withSuperAdmin} />
      <div className="flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 overflow-y-auto pt-16 px-6 md:px-12 ml-10">
          <h1 className="text-5xl md:text-3xl font-bold text-black mb-6 mt-4">
            {mainTitle}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
