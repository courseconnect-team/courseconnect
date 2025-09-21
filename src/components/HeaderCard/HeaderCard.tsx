'use client';

import React from 'react';
import SideNav from '@/components/SideNavBar/SideNavBar';
import TopNav from '@/components/TopBar/TopBar';
import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { getNavItems } from '@/hooks/useGetItems';

interface HeaderCardProps {
  title: string;
  children: React.ReactNode;
}

function HeaderCard({ title, children }: HeaderCardProps) {
  const [user, role, loading, error] = useUserInfo();

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading user info</div>;

  const navItems = getNavItems(role);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SideNav navItems={navItems} />

      {/* TopNav + Content */}
      <div className="flex flex-col flex-1">
        <TopNav />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pt-14 px-6 md:px-12">
          <h1 className="text-5xl md:text-3xl font-bold text-black mb-8 mt-8">
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}

export default HeaderCard;
