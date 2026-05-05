'use client';

import { FC } from 'react';
import SideNav from '@/components/SideNavBar/SideNavBar';
import TopNav from '@/components/TopBar/TopBar';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getNavItemsForUser } from '@/hooks/useGetItems';
import { NavbarItem } from '@/types/navigation';

interface PageLayoutProps {
  mainTitle?: string;
  children?: React.ReactNode;
  // Optional override. When omitted, nav is derived from the current user's
  // role + superAdmin flag so the Departments entry never goes missing.
  navItems?: NavbarItem[];
}

const PageLayout: FC<PageLayoutProps> = ({
  mainTitle,
  children,
  navItems: navItemsOverride,
}) => {
  const [, role] = useUserInfo();
  const { user: currentUser } = useCurrentUser();
  const navItems =
    navItemsOverride ??
    getNavItemsForUser({ role, superAdmin: currentUser.superAdmin });

  return (
    <div className="flex h-screen">
      <SideNav navItems={navItems} />
      <div className="flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 px-6 md:px-12 ml-10">
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
