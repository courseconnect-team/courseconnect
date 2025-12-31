// components/DashboardCard.tsx
import * as React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Skeleton from '@mui/material/Skeleton';
import type { NavbarItem } from '@/types/navigation';
import Dashboard from '@/oldPages/dashboard/page';

type SkeletonProps = { width?: number | string; height?: number | string };

type DashboardCardType = React.FC<NavbarItem> & {
  Skeleton: React.FC<SkeletonProps>;
};

const BaseCard: React.FC<NavbarItem> = ({
  icon: Icon,
  label,
  subLabel,
  to,
  queryParams,
}) => {
  return (
    <Link
      data-testid={`nav-${label}`}
      href={{
        pathname: to,
        query: { ...queryParams },
      }}
    >
      <div className="w-[360px] h-[80px] cursor-pointer border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-7 hover:shadow-md transition-shadow duration-150 bg-white">
        <Icon className="text-[#6C37D8] text-2xl flex-shrink-0 ml-2" />
        <div className="flex flex-col  gap-0.5">
          <span className="text-body1 font-medium text-gray-900">{label}</span>
          <span className="text-body2 font-medium text-gray-900">
            {subLabel}
          </span>
        </div>
      </div>
    </Link>
  );
};

(BaseCard as any).propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

(BaseCard as any).defaultProps = {
  onClick: () => {},
};

export const DashboardCard = BaseCard as DashboardCardType;

const DashboardCardSkeletonComp: React.FC<SkeletonProps> = ({
  width = 360,
  height = 80,
}) => (
  <div
    className="border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-4 w-[360px] h-[80px] bg-white"
    style={{ width, height }}
    role="status"
    aria-busy="true"
  >
    <Skeleton variant="circular" width={28} height={28} />
    <div className="flex-1">
      <Skeleton variant="text" width="70%" height={18} />
    </div>
  </div>
);
DashboardCardSkeletonComp.displayName = 'DashboardCard.Skeleton';

DashboardCard.Skeleton = DashboardCardSkeletonComp;

/** Optional named export if you prefer importing it directly */
export const DashboardCardSkeleton = DashboardCard.Skeleton;
