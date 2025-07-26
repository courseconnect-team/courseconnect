import React from 'react';
import PropTypes from 'prop-types';
import { SvgIconComponent } from '@mui/icons-material';
import Link from 'next/link';
import { NavbarItem } from '@/types/navigation';

/**
 * A simple card with an icon and label, styled with Tailwind and MUI Paper.
 *
 * Props:
 * - icon: a MUI SvgIcon component
 * - label: the text to display
 * - onClick?: optional click handler
 */

export function DashboardCard({ icon: Icon, label, to }: NavbarItem) {
  return (
    <Link href={to}>
      <div className="w-[360px] h-[80px] cursor-pointer border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow duration-150">
        <Icon className="text-[#6C37D8] text-2xl flex-shrink-0" />
        <span className="text-base font-medium text-gray-900">{label}</span>
      </div>
    </Link>
  );
}

DashboardCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

DashboardCard.defaultProps = {
  onClick: () => {},
};
