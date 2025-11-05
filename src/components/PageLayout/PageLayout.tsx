'use client';

import { FC } from 'react';
import SideNav from '@/components/SideNavBar/SideNavBar';
import TopNav from '@/components/TopBar/TopBar';
import { getNavItems } from '@/hooks/useGetItems';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { NavbarItem } from '@/types/navigation';
interface PageLayoutProps {
  mainTitle: string;
  navItems: NavbarItem[];
  children?: React.ReactNode;
}

const PageLayout: FC<PageLayoutProps> = ({ mainTitle, navItems, children }) => {
  return (
    <div className="flex h-screen">
      <SideNav navItems={navItems} />
      <div className="flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 overflow-y-auto pt-14 px-6 md:px-12 ml-10">
          <h1 className="text-5xl md:text-3xl font-bold text-black mb-8 mt-8">
            {mainTitle}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
